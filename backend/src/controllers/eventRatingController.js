const mongoose = require("mongoose");
const Event = require("../models/Event");
const EventRating = require("../models/EventRating");
const User = require("../models/User");
const EventRegistration = require("../models/EventRegistration");
const { getEffectiveEventStatus } = require("../utils/eventLifecycle");
const {
  getRatingSummary,
} = require("../services/eventRatingService");
const { notifyActiveAdmins } = require("../services/notificationService");

const HIDDEN_REASONS = ["spam", "offensive", "advertisement", "other"];
const SORTS = {
  newest: { createdAt: -1 },
  oldest: { createdAt: 1 },
  highest: { rating: -1, createdAt: -1 },
  lowest: { rating: 1, createdAt: -1 },
};

const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);
const toObjectId = (id) => new mongoose.Types.ObjectId(id.toString());

const parsePagination = (query) => {
  const page = Math.max(parseInt(query.page, 10) || 1, 1);
  const limit = Math.min(Math.max(parseInt(query.limit, 10) || 10, 1), 100);
  return { page, limit, skip: (page - 1) * limit };
};

const validateRatingPayload = (body) => {
  const rating = Number(body.rating);
  const comment = body.comment === undefined || body.comment === null
    ? ""
    : String(body.comment).trim();

  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
    return { error: "Rating must be an integer from 1 to 5" };
  }

  if (comment && (comment.length < 10 || comment.length > 500)) {
    return { error: "Comment must contain 10 to 500 characters" };
  }

  return { value: { rating, comment } };
};

const ensureCanRate = async (eventId, userId) => {
  if (!isValidObjectId(eventId)) {
    return { status: 400, message: "Invalid event ID" };
  }

  const event = await Event.findById(eventId);
  if (!event) return { status: 404, message: "Event not found" };

  const eventStatus = getEffectiveEventStatus(event);
  if (eventStatus !== "completed") {
    return {
      status: 400,
      message: eventStatus === "cancelled"
        ? "Cancelled events cannot be reviewed"
        : "You can only review completed events",
    };
  }

  const registration = await EventRegistration.findOne({
    eventId: toObjectId(event._id),
    userId: toObjectId(userId),
  }).lean();
  if (
    registration?.registrationStatus !== "registered" ||
    registration?.attendanceStatus !== "attended"
  ) {
    return {
      status: 403,
      message: "You can only rate events you have attended",
    };
  }

  return { event };
};

const notifyLowRating = async ({ ratingDocument, event }) => {
  if (ratingDocument.rating > 2) return;

  await notifyActiveAdmins({
    type: "rating_alert",
    title: "Sự kiện nhận đánh giá thấp",
    content: `“${event.title}” nhận ${ratingDocument.rating}/5 sao. Mở phản hồi để xem nội dung.`,
    related: { type: "event_rating", id: ratingDocument._id },
    dedupeKey: `low-event-rating:${ratingDocument._id}`,
  });
};

const submitRating = async (req, res) => {
  try {
    const validation = validateRatingPayload(req.body);
    if (validation.error) {
      return res.status(400).json({ success: false, message: validation.error });
    }

    const eligibility = await ensureCanRate(req.params.eventId, req.user._id);
    if (!eligibility.event) {
      return res.status(eligibility.status).json({
        success: false,
        message: eligibility.message,
      });
    }

    const rating = await EventRating.create({
      eventId: eligibility.event._id,
      userId: req.user._id,
      ...validation.value,
    });

    await notifyLowRating({ ratingDocument: rating, event: eligibility.event });

    return res.status(201).json({
      success: true,
      message: "Thank you for your feedback!",
      data: rating,
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "You have already reviewed this event",
      });
    }

    console.error("Submit event rating error:", error);
    return res.status(500).json({ success: false, message: "Server Error" });
  }
};

const updateMyRating = async (req, res) => {
  try {
    const validation = validateRatingPayload(req.body);
    if (validation.error) {
      return res.status(400).json({ success: false, message: validation.error });
    }

    const eligibility = await ensureCanRate(req.params.eventId, req.user._id);
    if (!eligibility.event) {
      return res.status(eligibility.status).json({
        success: false,
        message: eligibility.message,
      });
    }

    const existingRating = await EventRating.findOne({
      eventId: eligibility.event._id,
      userId: req.user._id,
    }).select("rating");

    if (!existingRating) {
      return res.status(404).json({
        success: false,
        message: "You have not reviewed this event yet",
      });
    }

    const previousRating = existingRating.rating;
    const rating = await EventRating.findByIdAndUpdate(
      existingRating._id,
      { $set: validation.value },
      { returnDocument: "after", runValidators: true }
    );

    if (previousRating > 2 && rating.rating <= 2) {
      await notifyLowRating({ ratingDocument: rating, event: eligibility.event });
    }

    return res.status(200).json({
      success: true,
      message: "Your review has been updated.",
      data: rating,
    });
  } catch (error) {
    console.error("Update event rating error:", error);
    return res.status(500).json({ success: false, message: "Server Error" });
  }
};

const getEventRatings = async (req, res) => {
  try {
    if (!isValidObjectId(req.params.eventId)) {
      return res.status(400).json({ success: false, message: "Invalid event ID" });
    }

    const eventExists = await Event.exists({ _id: req.params.eventId });
    if (!eventExists) {
      return res.status(404).json({ success: false, message: "Event not found" });
    }

    const { page, limit, skip } = parsePagination(req.query);
    const query = { eventId: req.params.eventId, status: "visible" };
    const ratingFilter = Number(req.query.rating);
    if (Number.isInteger(ratingFilter) && ratingFilter >= 1 && ratingFilter <= 5) {
      query.rating = ratingFilter;
    }

    const [ratings, total, summary] = await Promise.all([
      EventRating.find(query)
        .sort(SORTS[req.query.sort] || SORTS.newest)
        .skip(skip)
        .limit(limit)
        .populate("userId", "fullName avatarUrl")
        .lean(),
      EventRating.countDocuments(query),
      getRatingSummary(req.params.eventId),
    ]);

    return res.status(200).json({
      success: true,
      data: { ratings, summary },
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Get event ratings error:", error);
    return res.status(500).json({ success: false, message: "Server Error" });
  }
};

const getEventRatingSummary = async (req, res) => {
  try {
    if (!isValidObjectId(req.params.eventId)) {
      return res.status(400).json({ success: false, message: "Invalid event ID" });
    }

    const eventExists = await Event.exists({ _id: req.params.eventId });
    if (!eventExists) {
      return res.status(404).json({ success: false, message: "Event not found" });
    }

    const summary = await getRatingSummary(req.params.eventId);
    return res.status(200).json({ success: true, data: summary });
  } catch (error) {
    console.error("Get rating summary error:", error);
    return res.status(500).json({ success: false, message: "Server Error" });
  }
};

const getMyRatings = async (req, res) => {
  try {
    const { page, limit, skip } = parsePagination(req.query);
    const query = { userId: req.user._id };

    if (req.query.eventId) {
      if (!isValidObjectId(req.query.eventId)) {
        return res.status(400).json({ success: false, message: "Invalid event ID" });
      }
      query.eventId = req.query.eventId;
    }

    const [ratings, total] = await Promise.all([
      EventRating.find(query)
        .sort({ updatedAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate("eventId", "title bannerImage startDateTime endDateTime status")
        .lean(),
      EventRating.countDocuments(query),
    ]);

    return res.status(200).json({
      success: true,
      data: ratings,
      pagination: { total, page, limit, totalPages: Math.ceil(total / limit) },
    });
  } catch (error) {
    console.error("Get my ratings error:", error);
    return res.status(500).json({ success: false, message: "Server Error" });
  }
};

const buildAdminQuery = async (queryParams) => {
  const query = {};
  if (["visible", "hidden"].includes(queryParams.status)) query.status = queryParams.status;

  const rating = Number(queryParams.rating);
  if (Number.isInteger(rating) && rating >= 1 && rating <= 5) query.rating = rating;

  if (queryParams.eventId && isValidObjectId(queryParams.eventId)) {
    query.eventId = queryParams.eventId;
  }

  const search = String(queryParams.search || "").trim();
  if (search) {
    const safeSearch = search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const regex = new RegExp(safeSearch, "i");
    const [users, events] = await Promise.all([
      User.find({ fullName: regex }).select("_id").lean(),
      Event.find({ title: regex }).select("_id").lean(),
    ]);
    query.$or = [
      { comment: regex },
      { userId: { $in: users.map((user) => user._id) } },
      { eventId: { $in: events.map((event) => event._id) } },
    ];
  }

  return query;
};

const getAdminRatings = async (req, res) => {
  try {
    const { page, limit, skip } = parsePagination(req.query);
    const query = await buildAdminQuery(req.query);
    const [ratings, total] = await Promise.all([
      EventRating.find(query)
        .sort(SORTS[req.query.sort] || SORTS.newest)
        .skip(skip)
        .limit(limit)
        .populate("userId", "fullName email avatarUrl")
        .populate("eventId", "title startDateTime endDateTime status")
        .populate("hiddenBy restoredBy", "fullName email")
        .lean(),
      EventRating.countDocuments(query),
    ]);

    return res.status(200).json({
      success: true,
      data: ratings,
      pagination: { total, page, limit, totalPages: Math.ceil(total / limit) },
    });
  } catch (error) {
    console.error("Get admin ratings error:", error);
    return res.status(500).json({ success: false, message: "Server Error" });
  }
};

const getAdminRatingDetail = async (req, res) => {
  try {
    if (!isValidObjectId(req.params.id)) {
      return res.status(400).json({ success: false, message: "Invalid rating ID" });
    }

    const rating = await EventRating.findById(req.params.id)
      .populate("userId", "fullName email avatarUrl")
      .populate("eventId", "title startDateTime endDateTime status")
      .populate("hiddenBy restoredBy", "fullName email")
      .lean();

    if (!rating) {
      return res.status(404).json({ success: false, message: "Rating not found" });
    }

    return res.status(200).json({ success: true, data: rating });
  } catch (error) {
    console.error("Get rating detail error:", error);
    return res.status(500).json({ success: false, message: "Server Error" });
  }
};

const hideRating = async (req, res) => {
  try {
    if (!isValidObjectId(req.params.id)) {
      return res.status(400).json({ success: false, message: "Invalid rating ID" });
    }

    const reason = String(req.body.reason || "").trim().toLowerCase();
    const note = String(req.body.note || "").trim();

    if (!HIDDEN_REASONS.includes(reason)) {
      return res.status(400).json({ success: false, message: "Invalid hidden reason" });
    }
    if (reason === "other" && !note) {
      return res.status(400).json({
        success: false,
        message: "A note is required when the reason is Other",
      });
    }
    if (note.length > 500) {
      return res.status(400).json({ success: false, message: "Note exceeds 500 characters" });
    }

    const rating = await EventRating.findByIdAndUpdate(
      req.params.id,
      {
        $set: {
          status: "hidden",
          hiddenReason: reason,
          hiddenNote: note || null,
          hiddenBy: req.user._id,
          hiddenAt: new Date(),
          restoredBy: null,
          restoredAt: null,
        },
      },
      { returnDocument: "after", runValidators: true }
    );

    if (!rating) {
      return res.status(404).json({ success: false, message: "Rating not found" });
    }

    return res.status(200).json({
      success: true,
      message: "Review hidden successfully.",
      data: rating,
    });
  } catch (error) {
    console.error("Hide rating error:", error);
    return res.status(500).json({ success: false, message: "Server Error" });
  }
};

const restoreRating = async (req, res) => {
  try {
    if (!isValidObjectId(req.params.id)) {
      return res.status(400).json({ success: false, message: "Invalid rating ID" });
    }

    const rating = await EventRating.findByIdAndUpdate(
      req.params.id,
      {
        $set: {
          status: "visible",
          hiddenReason: null,
          hiddenNote: null,
          hiddenBy: null,
          hiddenAt: null,
          restoredBy: req.user._id,
          restoredAt: new Date(),
        },
      },
      { returnDocument: "after", runValidators: true }
    );

    if (!rating) {
      return res.status(404).json({ success: false, message: "Rating not found" });
    }

    return res.status(200).json({
      success: true,
      message: "Review restored successfully.",
      data: rating,
    });
  } catch (error) {
    console.error("Restore rating error:", error);
    return res.status(500).json({ success: false, message: "Server Error" });
  }
};

const getAdminStatistics = async (req, res) => {
  try {
    const eventFilter =
      req.query.eventId && isValidObjectId(req.query.eventId)
        ? { eventId: toObjectId(req.query.eventId) }
        : {};
    const [visibleRows, hiddenTotal, ratedEventIds] = await Promise.all([
      EventRating.aggregate([
        { $match: { ...eventFilter, status: "visible" } },
        { $group: { _id: "$rating", count: { $sum: 1 } } },
      ]),
      EventRating.countDocuments({ ...eventFilter, status: "hidden" }),
      EventRating.distinct("eventId", { ...eventFilter, status: "visible" }),
    ]);

    const distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    let total = 0;
    let sum = 0;
    visibleRows.forEach((row) => {
      distribution[row._id] = row.count;
      total += row.count;
      sum += row._id * row.count;
    });

    return res.status(200).json({
      success: true,
      data: {
        average: total ? Number((sum / total).toFixed(1)) : 0,
        total,
        ratedEvents: ratedEventIds.length,
        hiddenTotal,
        distribution,
      },
    });
  } catch (error) {
    console.error("Get rating statistics error:", error);
    return res.status(500).json({ success: false, message: "Server Error" });
  }
};

const escapeCsv = (value) => {
  let text = value === null || value === undefined ? "" : String(value);
  if (/^[=+\-@]/.test(text)) text = `'${text}`;
  return `"${text.replace(/"/g, '""')}"`;
};

const exportRatingsCsv = async (req, res) => {
  try {
    const query = await buildAdminQuery(req.query);
    const ratings = await EventRating.find(query)
      .sort(SORTS[req.query.sort] || SORTS.newest)
      .populate("userId", "fullName email")
      .populate("eventId", "title")
      .lean();

    const header = [
      "Rating ID", "Event", "User", "Email", "Rating", "Comment",
      "Status", "Hidden reason", "Created at", "Updated at",
    ];
    const rows = ratings.map((item) => [
      item._id,
      item.eventId?.title,
      item.userId?.fullName,
      item.userId?.email,
      item.rating,
      item.comment,
      item.status,
      item.hiddenReason,
      item.createdAt?.toISOString(),
      item.updatedAt?.toISOString(),
    ]);
    const csv = [header, ...rows]
      .map((row) => row.map(escapeCsv).join(","))
      .join("\r\n");

    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="event-ratings-${new Date().toISOString().slice(0, 10)}.csv"`
    );
    return res.status(200).send(`\uFEFF${csv}`);
  } catch (error) {
    console.error("Export ratings error:", error);
    return res.status(500).json({ success: false, message: "Server Error" });
  }
};

module.exports = {
  submitRating,
  updateMyRating,
  getEventRatings,
  getEventRatingSummary,
  getMyRatings,
  getAdminRatings,
  getAdminRatingDetail,
  hideRating,
  restoreRating,
  getAdminStatistics,
  exportRatingsCsv,
};
