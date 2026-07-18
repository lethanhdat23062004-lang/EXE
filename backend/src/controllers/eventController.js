const mongoose = require("mongoose");
const { randomUUID } = require("crypto");
const Event = require("../models/Event");
const EventRating = require("../models/EventRating");
const EventRegistration = require("../models/EventRegistration");
const EventAttendanceAudit = require("../models/EventAttendanceAudit");
const EventRegistrationMutex = require("../models/EventRegistrationMutex");
const Notification = require("../models/Notification");
const {
  createNotification,
  notifyActiveAdmins,
} = require("../services/notificationService");
const {
  buildEventStatusQuery,
  getEffectiveEventStatus,
} = require("../utils/eventLifecycle");
const {
  emptySummary,
  getRatingSummary,
  getRatingSummaries,
} = require("../services/eventRatingService");
const {
  resolveAttendanceOverdueNotification,
} = require("../services/attendanceOverdueService");

const EVENT_TYPES = ["workshop", "talkshow", "webinar", "community_event", null];
const EVENT_STATUSES = ["upcoming", "ongoing", "completed", "cancelled"];
const REGISTRATION_STATUSES = ["registered", "cancelled"];
const ATTENDANCE_STATUSES = ["not_checked_in", "attended", "absent"];

const getCrossedCapacityThreshold = (previousCount, nextCount, capacity) => {
  const numericCapacity = Number(capacity);
  if (!Number.isFinite(numericCapacity) || numericCapacity <= 0) return null;

  const previousRatio = previousCount / numericCapacity;
  const nextRatio = nextCount / numericCapacity;

  // If a registration crosses both thresholds, only the higher alert is sent.
  if (previousRatio < 1 && nextRatio >= 1) return 100;
  if (previousRatio < 0.9 && nextRatio >= 0.9) return 90;
  return null;
};

const notifyEventCapacityThreshold = async (event) => {
  const threshold = getCrossedCapacityThreshold(
    Math.max(0, event.registeredCount - 1),
    event.registeredCount,
    event.capacity
  );
  if (!threshold) return;

  const isFull = threshold === 100;
  await notifyActiveAdmins({
    type: "event_capacity_alert",
    title: isFull ? "Sự kiện đã đủ chỗ" : "Sự kiện đạt 90% sức chứa",
    content: isFull
      ? `“${event.title}”: ${event.registeredCount}/${event.capacity} chỗ đã đăng ký.`
      : `“${event.title}”: ${event.registeredCount}/${event.capacity} chỗ đã đăng ký.`,
    related: { type: "event", id: event._id },
    dedupeKey: `event-capacity:${event._id}:${threshold}`,
  });
};

const isValidObjectId = (id) => /^[0-9a-fA-F]{24}$/.test(id);
const toObjectId = (id) => new mongoose.Types.ObjectId(id.toString());

const buildEventPayload = (body) => {
  const allowedFields = [
    "title",
    "description",
    "speakerName",
    "organizerName",
    "contactEmail",
    "bannerImage",
    "images",
    "eventType",
    "startDateTime",
    "endDateTime",
    "location",
    "meetingLink",
    "capacity",
    "status",
  ];

  return allowedFields.reduce((payload, field) => {
    if (Object.prototype.hasOwnProperty.call(body, field)) {
      payload[field] = body[field];
    }

    return payload;
  }, {});
};

const validateEventPayload = (payload, { isCreate = false, currentEvent = null } = {}) => {
  if (isCreate && (!payload.title || !payload.startDateTime)) {
    return "Title and startDateTime are required";
  }

  if (payload.title !== undefined && !String(payload.title).trim()) {
    return "Title cannot be empty";
  }

  if (payload.eventType !== undefined && !EVENT_TYPES.includes(payload.eventType)) {
    return "Invalid event type";
  }

  if (payload.status !== undefined && !EVENT_STATUSES.includes(payload.status)) {
    return "Invalid event status";
  }

  if (payload.capacity !== undefined && payload.capacity !== null) {
    const capacity = Number(payload.capacity);
    const registeredCount = currentEvent ? currentEvent.registeredCount : 0;

    if (!Number.isInteger(capacity) || capacity < 0) {
      return "Capacity must be a non-negative integer";
    }

    if (capacity < registeredCount) {
      return "Capacity cannot be lower than current registered count";
    }

    payload.capacity = capacity;
  }

  const startDateTime =
    payload.startDateTime !== undefined
      ? new Date(payload.startDateTime)
      : currentEvent && currentEvent.startDateTime;
  const endDateTime =
    payload.endDateTime !== undefined
      ? payload.endDateTime === null
        ? null
        : new Date(payload.endDateTime)
      : currentEvent && currentEvent.endDateTime;

  if (payload.startDateTime !== undefined && Number.isNaN(startDateTime.getTime())) {
    return "Invalid startDateTime";
  }

  if (
    payload.endDateTime !== undefined &&
    payload.endDateTime !== null &&
    Number.isNaN(endDateTime.getTime())
  ) {
    return "Invalid endDateTime";
  }

  if (endDateTime && startDateTime && endDateTime <= startDateTime) {
    return "endDateTime must be after startDateTime";
  }

  const now = new Date();
  const currentStartTime = currentEvent?.startDateTime
    ? new Date(currentEvent.startDateTime).getTime()
    : null;
  const nextStartTime = startDateTime ? startDateTime.getTime() : null;
  const startTimeChanged =
    payload.startDateTime !== undefined &&
    (currentStartTime === null || nextStartTime !== currentStartTime);

  if ((isCreate || startTimeChanged) && startDateTime && startDateTime < now) {
    return "Giờ bắt đầu đã qua so với thời điểm hiện tại, vui lòng chọn thời gian khác";
  }

  if (payload.startDateTime !== undefined) {
    payload.startDateTime = startDateTime;
  }

  if (payload.endDateTime !== undefined) {
    payload.endDateTime = endDateTime;
  }

  return null;
};

class ControllerError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

const ensureRegistrationMutex = async (userId) => {
  try {
    await EventRegistrationMutex.updateOne(
      { userId },
      { $setOnInsert: { userId, lockOwner: null, lockedUntil: null } },
      { upsert: true }
    );
  } catch (error) {
    if (error?.code !== 11000) throw error;
  }
};

const wait = (milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds));

const acquireRegistrationMutex = async (userId) => {
  await ensureRegistrationMutex(userId);
  const lockOwner = randomUUID();

  for (let attempt = 0; attempt < 40; attempt += 1) {
    const now = new Date();
    const lockedUntil = new Date(now.getTime() + 5000);
    const lock = await EventRegistrationMutex.findOneAndUpdate(
      {
        userId,
        $or: [
          { lockedUntil: null },
          { lockedUntil: { $lte: now } },
          { lockOwner },
        ],
      },
      { $set: { lockOwner, lockedUntil } },
      { returnDocument: "after" }
    ).lean();
    if (lock?.lockOwner === lockOwner) return lockOwner;
    await wait(25);
  }

  throw new ControllerError(503, "Registration is busy. Please try again.");
};

const releaseRegistrationMutex = (userId, lockOwner) =>
  EventRegistrationMutex.updateOne(
    { userId, lockOwner },
    { $set: { lockOwner: null, lockedUntil: null } }
  );

const countUserUpcomingRegistrations = async (userId) => {
  const registrations = await EventRegistration.find({
    userId: toObjectId(userId),
    registrationStatus: "registered",
  }).select("eventId").lean();
  if (!registrations.length) return 0;

  return Event.countDocuments({
    _id: { $in: registrations.map((item) => item.eventId) },
    status: { $ne: "cancelled" },
    startDateTime: { $gt: new Date() },
  });
};

/**
 * @route   GET /api/events
 * @desc    Get list of events
 * @access  Public
 */
const getEvents = async (req, res) => {
  try {
    const { status, eventType, page = 1, limit = 10 } = req.query;
    const query = buildEventStatusQuery(status);
    query.isArchived = { $ne: true };
    if (eventType) {
      query.eventType = eventType;
    }
    const pageNumber = Math.max(parseInt(page, 10) || 1, 1);
    const limitNumber = Math.min(Math.max(parseInt(limit, 10) || 10, 1), 100);
    const [events, total] = await Promise.all([
      Event.find(query)
      .sort({ startDateTime: 1 })
      .skip((pageNumber - 1) * limitNumber)
      .limit(limitNumber)
      .populate("createdBy", "username fullName avatar"),
      Event.countDocuments(query),
    ]);
    const summaries = await getRatingSummaries(events.map((event) => event._id));
    const data = events.map((event) => {
      const item = event.toObject();
      return {
        ...item,
        status: getEffectiveEventStatus(event),
        ratingSummary: summaries.get(event._id.toString()) || emptySummary(),
      };
    });

    res.status(200).json({
      success: true,
      data,
      pagination: {
        total,
        page: pageNumber,
        limit: limitNumber,
        totalPages: Math.ceil(total / limitNumber),
      },
    });
  } catch (error) {
    console.error("Error fetching events:", error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

/**
 * @route   GET /api/admin/events
 * @desc    Get events including archived records for administration
 * @access  Private (Admin)
 */
const getAdminEvents = async (req, res) => {
  try {
    const {
      status,
      eventType,
      archiveStatus = "active",
      page = 1,
      limit = 100,
    } = req.query;
    if (!["active", "archived", "all"].includes(archiveStatus)) {
      return res.status(400).json({
        success: false,
        message: "Trạng thái lưu trữ không hợp lệ",
      });
    }

    const query = buildEventStatusQuery(status);
    if (archiveStatus === "active") query.isArchived = { $ne: true };
    if (archiveStatus === "archived") query.isArchived = true;
    if (eventType) query.eventType = eventType;

    const pageNumber = Math.max(parseInt(page, 10) || 1, 1);
    const limitNumber = Math.min(Math.max(parseInt(limit, 10) || 100, 1), 200);
    const [events, total] = await Promise.all([
      Event.find(query)
        .sort({ startDateTime: -1 })
        .skip((pageNumber - 1) * limitNumber)
        .limit(limitNumber)
        .populate("createdBy archivedBy cancelledBy", "username fullName avatar"),
      Event.countDocuments(query),
    ]);
    const eventIds = events.map((event) => event._id);
    const [summaries, pendingAttendanceRows] = await Promise.all([
      getRatingSummaries(eventIds),
      EventRegistration.aggregate([
        {
          $match: {
            eventId: { $in: eventIds },
            registrationStatus: "registered",
            attendanceStatus: "not_checked_in",
          },
        },
        { $group: { _id: "$eventId", count: { $sum: 1 } } },
      ]),
    ]);
    const pendingAttendance = new Map(
      pendingAttendanceRows.map((row) => [row._id.toString(), row.count])
    );

    return res.status(200).json({
      success: true,
      data: events.map((event) => ({
        ...event.toObject(),
        status: getEffectiveEventStatus(event),
        ratingSummary: summaries.get(event._id.toString()) || emptySummary(),
        pendingAttendanceCount: pendingAttendance.get(event._id.toString()) || 0,
      })),
      pagination: {
        total,
        page: pageNumber,
        limit: limitNumber,
        totalPages: Math.ceil(total / limitNumber),
      },
    });
  } catch (error) {
    console.error("Error fetching admin events:", error);
    return res.status(500).json({ success: false, message: "Không thể tải danh sách sự kiện" });
  }
};

/**
 * @route   GET /api/events/:id
 * @desc    Get event detail by ID
 * @access  Public
 */
const getEventById = async (req, res) => {
  try {
    const { id } = req.params;

    // Validate MongoDB ObjectId format
    if (!isValidObjectId(id)) {
      return res.status(400).json({ success: false, message: "Invalid event ID" });
    }

    const event = await Event.findById(id).populate(
      "createdBy",
      "username fullName avatar"
    );

    if (!event) {
      return res.status(404).json({ success: false, message: "Event not found" });
    }

    const eventData = event.toObject();
    const responseData = {
      ...eventData,
      status: getEffectiveEventStatus(event),
      ratingSummary: await getRatingSummary(event._id),
    };

    res.status(200).json({
      success: true,
      data: responseData,
    });
  } catch (error) {
    console.error("Error fetching event detail:", error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

/**
 * @route   POST /api/events
 * @desc    Create event
 * @access  Private (Admin)
 */
const createEvent = async (req, res) => {
  try {
    const payload = buildEventPayload(req.body);
    const validationError = validateEventPayload(payload, { isCreate: true });

    if (validationError) {
      return res.status(400).json({ success: false, message: validationError });
    }

    const event = await Event.create({
      ...payload,
      registeredCount: 0,
      createdBy: req.user._id,
    });

    res.status(201).json({
      success: true,
      message: "Event created successfully",
      data: event,
    });
  } catch (error) {
    console.error("Error creating event:", error);

    if (error.name === "ValidationError") {
      return res.status(400).json({ success: false, message: error.message });
    }

    res.status(500).json({ success: false, message: "Server Error" });
  }
};

/**
 * @route   PATCH /api/events/:id
 * @desc    Update event
 * @access  Private (Admin)
 */
const updateEvent = async (req, res) => {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return res.status(400).json({ success: false, message: "Invalid event ID" });
    }

    const event = await Event.findById(id);
    if (!event) {
      return res.status(404).json({ success: false, message: "Event not found" });
    }

    if (event.isArchived) {
      return res.status(409).json({
        success: false,
        code: "EVENT_ARCHIVED",
        message: "Sự kiện đã được lưu trữ. Hãy khôi phục trước khi chỉnh sửa.",
      });
    }

    if (req.body.status === "cancelled" && event.status !== "cancelled") {
      return res.status(400).json({
        success: false,
        code: "USE_CANCEL_ENDPOINT",
        message: "Vui lòng dùng chức năng Hủy sự kiện và nhập lý do hủy.",
      });
    }

    const payload = buildEventPayload(req.body);
    const validationError = validateEventPayload(payload, { currentEvent: event });

    if (validationError) {
      return res.status(400).json({ success: false, message: validationError });
    }

    Object.assign(event, payload);
    await event.save();

    res.status(200).json({
      success: true,
      message: "Event updated successfully",
      data: event,
    });
  } catch (error) {
    console.error("Error updating event:", error);

    if (error.name === "ValidationError") {
      return res.status(400).json({ success: false, message: error.message });
    }

    res.status(500).json({ success: false, message: "Server Error" });
  }
};

/**
 * @route   DELETE /api/events/:id
 * @desc    Delete event
 * @access  Private (Admin)
 */
const deleteEvent = async (req, res) => {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return res.status(400).json({ success: false, message: "Invalid event ID" });
    }

    const event = await Event.findById(id);

    if (!event) {
      return res.status(404).json({ success: false, message: "Event not found" });
    }

    const ratingCount = await EventRating.countDocuments({ eventId: event._id });
    const registrationCount = await EventRegistration.countDocuments({ eventId: event._id });
    if (ratingCount > 0 || registrationCount > 0) {
      const effectiveStatus = getEffectiveEventStatus(event);
      const suggestedAction = ["completed", "cancelled"].includes(effectiveStatus)
        ? "archive"
        : "cancel";
      return res.status(409).json({
        success: false,
        code: "EVENT_HAS_HISTORY",
        message:
          suggestedAction === "archive"
            ? "Sự kiện đã có lịch sử đăng ký hoặc đánh giá nên không thể xóa vĩnh viễn. Hãy lưu trữ sự kiện."
            : "Sự kiện đã có người đăng ký nên không thể xóa vĩnh viễn. Hãy hủy sự kiện và thông báo cho người tham gia.",
        data: {
          registrationCount,
          ratingCount,
          suggestedAction,
        },
      });
    }

    await event.deleteOne();

    res.status(200).json({
      success: true,
      message: "Event deleted successfully",
      data: {
        eventId: event._id,
        title: event.title,
      },
    });
  } catch (error) {
    console.error("Error deleting event:", error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

const getAdminEventById = async (req, res) => {
  try {
    const { id } = req.params;
    if (!isValidObjectId(id)) {
      return res.status(400).json({ success: false, message: "Mã sự kiện không hợp lệ" });
    }

    const event = await Event.findById(id).populate(
      "createdBy archivedBy cancelledBy",
      "username fullName avatarUrl"
    );
    if (!event) {
      return res.status(404).json({ success: false, message: "Không tìm thấy sự kiện" });
    }

    const registeredUsers = await EventRegistration.find({
      eventId: event._id,
      registrationStatus: "registered",
    }).select("userId").lean();
    const recipientIds = registeredUsers.map((item) => item.userId);
    const sentCount = event.cancelledAt
      ? await Notification.countDocuments({
          userId: { $in: recipientIds },
          dedupeKey: `event-cancelled:${event._id}`,
        })
      : 0;

    return res.status(200).json({
      success: true,
      data: {
        ...event.toObject(),
        status: getEffectiveEventStatus(event),
        ratingSummary: await getRatingSummary(event._id),
        cancellationNotification: {
          recipientCount: recipientIds.length,
          sentCount,
          status: !event.cancelledAt
            ? "not_applicable"
            : recipientIds.length === 0
              ? "not_required"
            : sentCount >= recipientIds.length
              ? "sent"
              : "partial",
        },
      },
    });
  } catch (error) {
    console.error("Error fetching admin event detail:", error);
    return res.status(500).json({ success: false, message: "Không thể tải chi tiết sự kiện" });
  }
};

const archiveEvent = async (req, res) => {
  try {
    const { id } = req.params;
    if (!isValidObjectId(id)) {
      return res.status(400).json({ success: false, message: "Mã sự kiện không hợp lệ" });
    }
    const event = await Event.findById(id);
    if (!event) return res.status(404).json({ success: false, message: "Không tìm thấy sự kiện" });
    if (event.isArchived) {
      return res.status(200).json({ success: true, message: "Sự kiện đã được lưu trữ", data: event });
    }

    const effectiveStatus = getEffectiveEventStatus(event);
    if (!["completed", "cancelled"].includes(effectiveStatus)) {
      return res.status(409).json({
        success: false,
        code: "EVENT_MUST_BE_CANCELLED_FIRST",
        message: "Sự kiện sắp hoặc đang diễn ra phải được hủy trước khi lưu trữ.",
      });
    }

    event.isArchived = true;
    event.archivedAt = new Date();
    event.archivedBy = req.user._id;
    await event.save();
    return res.status(200).json({
      success: true,
      message: "Đã lưu trữ sự kiện",
      data: { ...event.toObject(), status: getEffectiveEventStatus(event) },
    });
  } catch (error) {
    console.error("Archive event error:", error);
    return res.status(500).json({ success: false, message: "Không thể lưu trữ sự kiện" });
  }
};

const restoreEvent = async (req, res) => {
  try {
    const { id } = req.params;
    if (!isValidObjectId(id)) {
      return res.status(400).json({ success: false, message: "Mã sự kiện không hợp lệ" });
    }
    const event = await Event.findById(id);
    if (!event) return res.status(404).json({ success: false, message: "Không tìm thấy sự kiện" });
    event.isArchived = false;
    event.archivedAt = null;
    event.archivedBy = null;
    await event.save();
    return res.status(200).json({
      success: true,
      message: "Đã khôi phục sự kiện",
      data: { ...event.toObject(), status: getEffectiveEventStatus(event) },
    });
  } catch (error) {
    console.error("Restore event error:", error);
    return res.status(500).json({ success: false, message: "Không thể khôi phục sự kiện" });
  }
};

const cancelEvent = async (req, res) => {
  try {
    const { id } = req.params;
    const reason = String(req.body.reason || "").trim();
    if (!isValidObjectId(id)) {
      return res.status(400).json({ success: false, message: "Mã sự kiện không hợp lệ" });
    }
    if (!reason) {
      return res.status(400).json({ success: false, message: "Vui lòng nhập lý do hủy sự kiện" });
    }
    if (reason.length > 500) {
      return res.status(400).json({ success: false, message: "Lý do hủy không được vượt quá 500 ký tự" });
    }

    const event = await Event.findById(id);
    if (!event) return res.status(404).json({ success: false, message: "Không tìm thấy sự kiện" });
    if (event.isArchived) {
      return res.status(409).json({ success: false, message: "Hãy khôi phục sự kiện trước khi hủy" });
    }
    const effectiveStatus = getEffectiveEventStatus(event);
    if (!["upcoming", "ongoing"].includes(effectiveStatus)) {
      return res.status(409).json({
        success: false,
        message: effectiveStatus === "cancelled" ? "Sự kiện đã được hủy" : "Sự kiện đã kết thúc, hãy lưu trữ thay vì hủy",
      });
    }

    event.status = "cancelled";
    event.cancellationReason = reason;
    event.cancelledAt = new Date();
    event.cancelledBy = req.user._id;
    await event.save();

    const registrations = await EventRegistration.find({
      eventId: event._id,
      registrationStatus: "registered",
    }).select("userId").lean();
    await Promise.all(
      registrations.map((registration) =>
        createNotification(
          registration.userId,
          "event_reminder",
          `Sự kiện “${event.title}” đã bị hủy`,
          `Lý do: ${reason}`,
          { type: "Event", id: event._id },
          { dedupeKey: `event-cancelled:${event._id}` }
        )
      )
    );

    return res.status(200).json({
      success: true,
      message: "Đã hủy sự kiện và thông báo cho người đăng ký",
      data: event,
    });
  } catch (error) {
    console.error("Cancel event error:", error);
    return res.status(500).json({ success: false, message: "Không thể hủy sự kiện" });
  }
};

/**
 * @route   GET /api/events/:id/registrations
 * @desc    Get event registrations
 * @access  Private (Admin)
 */
const getEventRegistrations = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      status = "all",
      registrationStatus,
      attendanceStatus,
      page = 1,
      limit = 10,
    } = req.query;

    if (!isValidObjectId(id)) {
      return res.status(400).json({ success: false, message: "Invalid event ID" });
    }

    const pageNumber = Math.max(parseInt(page, 10) || 1, 1);
    const limitNumber = Math.min(Math.max(parseInt(limit, 10) || 10, 1), 100);
    const skip = (pageNumber - 1) * limitNumber;

    const event = await Event.findById(id)
      .select("title startDateTime endDateTime status capacity registeredCount");

    if (!event) {
      return res.status(404).json({ success: false, message: "Event not found" });
    }

    const filter = { eventId: toObjectId(id) };
    const legacyRegistrationStatus = ["registered", "cancelled"].includes(status)
      ? status
      : undefined;
    const legacyAttendanceStatus = ["attended", "absent", "not_checked_in"].includes(status)
      ? status
      : undefined;
    const selectedRegistrationStatus = registrationStatus || legacyRegistrationStatus;
    const selectedAttendanceStatus = attendanceStatus || legacyAttendanceStatus;

    if (selectedRegistrationStatus) {
      if (!REGISTRATION_STATUSES.includes(selectedRegistrationStatus)) {
        return res.status(400).json({ success: false, message: "Invalid registration status" });
      }
      filter.registrationStatus = selectedRegistrationStatus;
    }
    if (selectedAttendanceStatus) {
      if (!ATTENDANCE_STATUSES.includes(selectedAttendanceStatus)) {
        return res.status(400).json({ success: false, message: "Invalid attendance status" });
      }
      filter.attendanceStatus = selectedAttendanceStatus;
    }

    const [registrations, total, groupedStats] = await Promise.all([
      EventRegistration.find(filter)
        .populate("userId", "fullName email phone avatarUrl role status")
        .sort({ registeredAt: -1 })
        .skip(skip)
        .limit(limitNumber)
        .lean(),
      EventRegistration.countDocuments(filter),
      EventRegistration.aggregate([
        { $match: { eventId: toObjectId(id) } },
        {
          $group: {
            _id: null,
            totalRegistered: {
              $sum: { $cond: [{ $eq: ["$registrationStatus", "registered"] }, 1, 0] },
            },
            totalCancelled: {
              $sum: { $cond: [{ $eq: ["$registrationStatus", "cancelled"] }, 1, 0] },
            },
            totalAttended: {
              $sum: { $cond: [{ $eq: ["$attendanceStatus", "attended"] }, 1, 0] },
            },
            totalAbsent: {
              $sum: { $cond: [{ $eq: ["$attendanceStatus", "absent"] }, 1, 0] },
            },
            totalNotCheckedIn: {
              $sum: { $cond: [{ $eq: ["$attendanceStatus", "not_checked_in"] }, 1, 0] },
            },
          },
        },
      ]),
    ]);

    const reviewedUserIds = await EventRating.distinct("userId", { eventId: toObjectId(id) });
    const reviewedSet = new Set(reviewedUserIds.map((userId) => userId.toString()));
    const data = registrations.map((registration) => ({
      ...registration,
      reviewStatus: reviewedSet.has(
        (registration.userId?._id || registration.userId).toString()
      ) ? "reviewed" : "not_reviewed",
    }));
    const rawStats = groupedStats[0] || {};
    const stats = {
      totalRegistrations: rawStats.totalRegistered || 0,
      totalRegistered: rawStats.totalRegistered || 0,
      totalCancelled: rawStats.totalCancelled || 0,
      totalAttended: rawStats.totalAttended || 0,
      totalAbsent: rawStats.totalAbsent || 0,
      totalNotCheckedIn: rawStats.totalNotCheckedIn || 0,
      capacity: event.capacity,
      remainingSlots: event.capacity == null
        ? null
        : Math.max(event.capacity - (rawStats.totalRegistered || 0), 0),
    };

    res.status(200).json({
      success: true,
      data: {
        event: {
          _id: event._id,
          title: event.title,
          startDateTime: event.startDateTime,
          endDateTime: event.endDateTime,
          status: getEffectiveEventStatus(event),
          capacity: event.capacity,
          registeredCount: stats.totalRegistrations,
        },
        registrations: data,
        stats,
      },
      pagination: {
        total,
        page: pageNumber,
        limit: limitNumber,
        totalPages: Math.ceil(total / limitNumber),
      },
    });
  } catch (error) {
    console.error("Error fetching event registrations:", error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

const getAttendanceAudits = async (req, res) => {
  try {
    const { eventId } = req.params;
    const pageNumber = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const limitNumber = Math.min(Math.max(parseInt(req.query.limit, 10) || 20, 1), 100);
    if (!isValidObjectId(eventId)) {
      return res.status(400).json({ success: false, message: "Mã sự kiện không hợp lệ" });
    }

    const event = await Event.findById(eventId).select("title startDateTime endDateTime status").lean();
    if (!event) {
      return res.status(404).json({ success: false, message: "Không tìm thấy sự kiện" });
    }

    const query = { eventId: toObjectId(eventId) };
    const [audits, total] = await Promise.all([
      EventAttendanceAudit.find(query)
        .sort({ createdAt: -1 })
        .skip((pageNumber - 1) * limitNumber)
        .limit(limitNumber)
        .populate("userId", "fullName email avatarUrl")
        .populate("changedBy", "fullName email avatarUrl")
        .lean(),
      EventAttendanceAudit.countDocuments(query),
    ]);

    return res.status(200).json({
      success: true,
      data: {
        event: { ...event, status: getEffectiveEventStatus(event) },
        audits,
      },
      pagination: {
        total,
        page: pageNumber,
        limit: limitNumber,
        totalPages: Math.ceil(total / limitNumber),
      },
    });
  } catch (error) {
    console.error("Get attendance audits error:", error);
    return res.status(500).json({ success: false, message: "Không thể tải lịch sử điểm danh" });
  }
};

/**
 * @route   PATCH /api/admin/events/:eventId/participants/:userId/attendance
 * @desc    Confirm or undo participant attendance
 * @access  Private (Admin)
 */
const updateParticipantAttendance = async (req, res) => {
  try {
    const { eventId, userId } = req.params;
    const attendanceStatus = req.body.attendanceStatus || req.body.status;
    const reason = String(req.body.reason || "").trim();

    if (!isValidObjectId(eventId) || !isValidObjectId(userId)) {
      return res.status(400).json({ success: false, message: "Invalid event or user ID" });
    }
    if (!ATTENDANCE_STATUSES.includes(attendanceStatus)) {
      return res.status(400).json({
        success: false,
        message: "Invalid attendance status",
      });
    }
    if (reason.length > 500) {
      return res.status(400).json({ success: false, message: "Reason is too long" });
    }

    const event = await Event.findById(eventId);
    if (!event) throw new ControllerError(404, "Event not found");
    const eventStatus = getEffectiveEventStatus(event);
    if (eventStatus === "upcoming") {
      throw new ControllerError(409, "Attendance cannot be updated before the event starts");
    }
    if (eventStatus === "cancelled") {
      throw new ControllerError(409, "Cancelled events cannot be checked in");
    }
    if (eventStatus === "completed" && !reason) {
      throw new ControllerError(
        400,
        "A reason is required when changing attendance after the event"
      );
    }

    const current = await EventRegistration.findOne({
      eventId: toObjectId(eventId), userId: toObjectId(userId),
    }).lean();
    if (!current) throw new ControllerError(404, "Event registration not found");
    if (current.registrationStatus !== "registered") {
      throw new ControllerError(400, "A cancelled registration cannot have attendance updated");
    }
    if (current.attendanceStatus === attendanceStatus) {
      return res.status(200).json({
        success: true,
        message: "Attendance unchanged",
        data: current,
      });
    }

    const changeMarker = new Date();
    const registration = await EventRegistration.findOneAndUpdate(
      {
        _id: current._id,
        registrationStatus: "registered",
        attendanceStatus: current.attendanceStatus,
      },
      {
        $set: {
          attendanceStatus,
          checkedInAt: attendanceStatus === "attended" ? changeMarker : null,
          attendanceUpdatedAt: changeMarker,
          attendanceUpdatedBy: req.user._id,
        },
      },
      { returnDocument: "after", runValidators: true }
    );
    if (!registration) {
      throw new ControllerError(409, "Attendance was changed by another request");
    }

    try {
      await EventAttendanceAudit.create({
        eventId: event._id,
        registrationId: registration._id,
        userId: registration.userId,
        changedBy: req.user._id,
        fromStatus: current.attendanceStatus,
        toStatus: attendanceStatus,
        reason,
      });
    } catch (auditError) {
      await EventRegistration.updateOne(
        {
          _id: registration._id,
          attendanceStatus,
          attendanceUpdatedAt: changeMarker,
        },
        {
          $set: {
            attendanceStatus: current.attendanceStatus,
            checkedInAt: current.checkedInAt || null,
            attendanceUpdatedAt: current.attendanceUpdatedAt || null,
            attendanceUpdatedBy: current.attendanceUpdatedBy || null,
          },
        }
      );
      throw auditError;
    }

    await resolveAttendanceOverdueNotification(event._id);

    return res.status(200).json({
      success: true,
      message: "Attendance updated",
      data: {
        eventId: event._id,
        userId,
        registrationStatus: registration.registrationStatus,
        attendanceStatus: registration.attendanceStatus,
        checkedInAt: registration.checkedInAt,
      },
    });
  } catch (error) {
    if (error instanceof ControllerError) {
      return res.status(error.status).json({ success: false, message: error.message });
    }
    console.error("Update participant attendance error:", error);
    return res.status(500).json({ success: false, message: "Server Error" });
  }
};

/**
 * @route   GET /api/events/me/registered
 * @desc    Get events registered by current user
 * @access  Private (User)
 */
const getRegisteredEvents = async (req, res) => {
  try {
    const userId = req.user._id;
    const { status = "registered", search = "", page = 1, limit = 10 } = req.query;
    const pageNumber = Math.max(parseInt(page, 10) || 1, 1);
    const limitNumber = Math.min(Math.max(parseInt(limit, 10) || 10, 1), 100);
    const skip = (pageNumber - 1) * limitNumber;

    const validStatuses = ["registered", "cancelled", "attended", "absent", "not_checked_in"];
    if (status !== "all" && !validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid registration status",
      });
    }

    const registrationFilter = { userId: toObjectId(userId) };
    if (["registered", "cancelled"].includes(status)) {
      registrationFilter.registrationStatus = status;
    } else if (["attended", "absent", "not_checked_in"].includes(status)) {
      registrationFilter.attendanceStatus = status;
    }
    const keyword = String(search).trim();
    if (keyword) {
      const escapedKeyword = keyword.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const matchingEvents = await Event.find({
        $or: [
          { title: { $regex: escapedKeyword, $options: "i" } },
          { description: { $regex: escapedKeyword, $options: "i" } },
          { location: { $regex: escapedKeyword, $options: "i" } },
          { meetingLink: { $regex: escapedKeyword, $options: "i" } },
          { eventType: { $regex: escapedKeyword, $options: "i" } },
        ],
      }).select("_id").lean();
      registrationFilter.eventId = { $in: matchingEvents.map((event) => event._id) };
    }

    const [registrations, total] = await Promise.all([
      EventRegistration.find(registrationFilter)
        .sort({ registeredAt: -1 })
        .skip(skip)
        .limit(limitNumber)
        .lean(),
      EventRegistration.countDocuments(registrationFilter),
    ]);
    const registrationMap = new Map(
      registrations.map((registration) => [registration.eventId.toString(), registration])
    );
    const events = await Event.find({
      _id: { $in: registrations.map((registration) => registration.eventId) },
    })
      .populate("createdBy", "username fullName avatar");
    const summaries = await getRatingSummaries(events.map((event) => event._id));
    const reviewedEventIds = await EventRating.distinct("eventId", {
      userId: toObjectId(userId),
      eventId: { $in: events.map((event) => event._id) },
    });
    const reviewedSet = new Set(reviewedEventIds.map((eventId) => eventId.toString()));
    const data = events.map((event) => {
      const eventData = event.toObject();
      return {
        ...eventData,
        status: getEffectiveEventStatus(event),
        registration: {
          ...registrationMap.get(eventData._id.toString()),
          reviewStatus: reviewedSet.has(eventData._id.toString())
            ? "reviewed"
            : "not_reviewed",
        },
        ratingSummary: summaries.get(eventData._id.toString()) || emptySummary(),
      };
    }).sort((a, b) => new Date(a.startDateTime) - new Date(b.startDateTime));

    res.status(200).json({
      success: true,
      data,
      pagination: {
        total,
        page: pageNumber,
        limit: limitNumber,
        totalPages: Math.ceil(total / limitNumber),
      },
    });
  } catch (error) {
    console.error("Error fetching registered events:", error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

const registerEvent = async (req, res) => {
  let lockOwner;
  let userId;
  let eventObjectId;
  let seatReserved = false;
  try {
    const { id } = req.params;
    userId = toObjectId(req.user._id);
    if (!isValidObjectId(id)) {
      return res.status(400).json({ success: false, message: "Invalid event ID" });
    }

    eventObjectId = toObjectId(id);
    lockOwner = await acquireRegistrationMutex(userId);

    const event = await Event.findById(eventObjectId);
    if (!event) throw new ControllerError(404, "Event not found");
    if (event.isArchived) throw new ControllerError(409, "Sự kiện đã được lưu trữ");
    if (getEffectiveEventStatus(event) !== "upcoming") {
      throw new ControllerError(400, "Chỉ có thể đăng ký sự kiện sắp diễn ra");
    }

    const existingRegistration = await EventRegistration.findOne({
      eventId: eventObjectId,
      userId,
    }).lean();
    if (existingRegistration?.registrationStatus === "registered") {
      throw new ControllerError(409, "Bạn đã đăng ký sự kiện này rồi");
    }
    if (await countUserUpcomingRegistrations(userId) >= 3) {
      throw new ControllerError(400, "Bạn chỉ có thể đăng ký tối đa 3 sự kiện sắp diễn ra");
    }

    const reservedEvent = await Event.findOneAndUpdate(
      {
        _id: eventObjectId,
        status: { $ne: "cancelled" },
        startDateTime: { $gt: new Date() },
        $or: [
          { capacity: null },
          { capacity: { $exists: false } },
          { $expr: { $lt: ["$registeredCount", "$capacity"] } },
        ],
      },
      { $inc: { registeredCount: 1 } },
      { returnDocument: "after" }
    );
    if (!reservedEvent) {
      throw new ControllerError(409, "Sự kiện đã đủ chỗ hoặc đã bắt đầu");
    }
    seatReserved = true;

    const registration = await EventRegistration.findOneAndUpdate(
      { eventId: eventObjectId, userId },
      {
        $set: {
          registrationStatus: "registered",
          attendanceStatus: "not_checked_in",
          registeredAt: new Date(),
          cancelledAt: null,
          checkedInAt: null,
          attendanceUpdatedAt: null,
          attendanceUpdatedBy: null,
        },
        $setOnInsert: { eventId: eventObjectId, userId },
      },
      { returnDocument: "after", upsert: true, runValidators: true }
    );
    seatReserved = false;

    // Gửi thông báo đăng ký thành công
    createNotification(
      userId,
      "event_registration",
      "Đăng ký sự kiện thành công 🎟️",
      `Bạn đã đăng ký tham gia sự kiện "${reservedEvent.title}" thành công. Hẹn gặp bạn tại sự kiện!`,
      { type: "Event", id: reservedEvent._id }
    );

    await notifyEventCapacityThreshold(reservedEvent);

    return res.status(existingRegistration ? 200 : 201).json({
      success: true,
      message: "Đăng ký sự kiện thành công",
      data: {
        eventId: reservedEvent._id,
        title: reservedEvent.title,
        registeredCount: reservedEvent.registeredCount,
        registration,
      },
    });
  } catch (error) {
    if (seatReserved && eventObjectId) {
      await Event.updateOne(
        { _id: eventObjectId, registeredCount: { $gt: 0 } },
        { $inc: { registeredCount: -1 } }
      );
    }
    if (error instanceof ControllerError) {
      return res.status(error.status).json({ success: false, message: error.message });
    }
    if (error?.code === 11000) {
      return res.status(409).json({ success: false, message: "Bạn đã đăng ký sự kiện này rồi" });
    }
    console.error("Register event error:", error);
    return res.status(500).json({ success: false, message: "Server Error" });
  } finally {
    if (lockOwner && userId) await releaseRegistrationMutex(userId, lockOwner);
  }
};

const cancelRegistration = async (req, res) => {
  let lockOwner;
  let userId;
  try {
    const { id } = req.params;
    userId = toObjectId(req.user._id);
    if (!isValidObjectId(id)) {
      return res.status(400).json({ success: false, message: "Invalid event ID" });
    }

    lockOwner = await acquireRegistrationMutex(userId);
    const event = await Event.findById(id);
    if (!event) throw new ControllerError(404, "Event not found");
    if (getEffectiveEventStatus(event) !== "upcoming") {
      throw new ControllerError(400, "Không thể hủy sau khi sự kiện bắt đầu");
    }

    const registration = await EventRegistration.findOneAndUpdate(
      { eventId: event._id, userId, registrationStatus: "registered" },
      {
        $set: {
          registrationStatus: "cancelled",
          attendanceStatus: "not_checked_in",
          cancelledAt: new Date(),
          checkedInAt: null,
          attendanceUpdatedAt: null,
          attendanceUpdatedBy: null,
        },
      },
      { returnDocument: "after", runValidators: true }
    );
    if (!registration) throw new ControllerError(400, "Bạn chưa đăng ký sự kiện này");

    const updatedEvent = await Event.findOneAndUpdate(
      { _id: event._id, registeredCount: { $gt: 0 } },
      { $inc: { registeredCount: -1 } },
      { returnDocument: "after" }
    );
    if (!updatedEvent) {
      await EventRegistration.updateOne(
        { _id: registration._id, registrationStatus: "cancelled" },
        { $set: { registrationStatus: "registered", cancelledAt: null } }
      );
      throw new ControllerError(409, "Registration counter is inconsistent");
    }

    // Gửi thông báo hủy đăng ký
    createNotification(
      userId,
      "event_reminder",
      "Hủy đăng ký sự kiện",
      `Bạn đã hủy đăng ký sự kiện "${event.title}". Bạn có thể đăng ký lại bất cứ lúc nào nếu đổi ý.`,
      { type: "Event", id: event._id }
    );

    return res.status(200).json({
      success: true,
      message: "Hủy đăng ký thành công",
      data: {
        eventId: event._id,
        title: event.title,
        registeredCount: updatedEvent.registeredCount,
        registration,
      },
    });
  } catch (error) {
    if (error instanceof ControllerError) {
      return res.status(error.status).json({ success: false, message: error.message });
    }
    console.error("Cancel registration error:", error);
    return res.status(500).json({ success: false, message: "Server Error" });
  } finally {
    if (lockOwner && userId) await releaseRegistrationMutex(userId, lockOwner);
  }
};

const getEventDashboardStatistics = async (_req, res) => {
  try {
    const [registrationRows, ratingRows] = await Promise.all([
      EventRegistration.aggregate([
        {
          $group: {
            _id: null,
            registeredCount: {
              $sum: { $cond: [{ $eq: ["$registrationStatus", "registered"] }, 1, 0] },
            },
            cancelledCount: {
              $sum: { $cond: [{ $eq: ["$registrationStatus", "cancelled"] }, 1, 0] },
            },
            attendedCount: {
              $sum: { $cond: [{ $eq: ["$attendanceStatus", "attended"] }, 1, 0] },
            },
            absentCount: {
              $sum: { $cond: [{ $eq: ["$attendanceStatus", "absent"] }, 1, 0] },
            },
          },
        },
      ]),
      EventRating.aggregate([
        {
          $group: {
            _id: null,
            reviewCount: { $sum: 1 },
            averageRating: {
              $avg: { $cond: [{ $eq: ["$status", "visible"] }, "$rating", null] },
            },
          },
        },
      ]),
    ]);
    const registrations = registrationRows[0] || {};
    const ratings = ratingRows[0] || {};
    const attendanceDecisions = (registrations.attendedCount || 0) + (registrations.absentCount || 0);
    const attendedCount = registrations.attendedCount || 0;
    const reviewCount = ratings.reviewCount || 0;

    return res.status(200).json({
      success: true,
      data: {
        registeredCount: registrations.registeredCount || 0,
        cancelledCount: registrations.cancelledCount || 0,
        attendedCount,
        absentCount: registrations.absentCount || 0,
        attendanceRate: attendanceDecisions
          ? Math.round((attendedCount / attendanceDecisions) * 1000) / 10
          : 0,
        reviewRate: attendedCount
          ? Math.round((reviewCount / attendedCount) * 1000) / 10
          : 0,
        averageRating: Math.round((ratings.averageRating || 0) * 10) / 10,
      },
    });
  } catch (error) {
    console.error("Event dashboard statistics error:", error);
    return res.status(500).json({ success: false, message: "Server Error" });
  }
};

module.exports = {
  getEvents,
  getAdminEvents,
  getEventById,
  getAdminEventById,
  createEvent,
  updateEvent,
  deleteEvent,
  archiveEvent,
  restoreEvent,
  cancelEvent,
  getEventRegistrations,
  getAttendanceAudits,
  getRegisteredEvents,
  registerEvent,
  cancelRegistration,
  updateParticipantAttendance,
  getEventDashboardStatistics,
};
