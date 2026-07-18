const Event = require("../models/Event");
const EventRegistration = require("../models/EventRegistration");
const Notification = require("../models/Notification");
const { notifyActiveAdmins } = require("./notificationService");

const FIVE_MINUTES = 5 * 60 * 1000;
let attendanceTimer = null;
let scanInProgress = false;

const pendingAttendanceCount = (eventId) =>
  EventRegistration.countDocuments({
    eventId,
    registrationStatus: "registered",
    attendanceStatus: "not_checked_in",
  });

async function resolveAttendanceOverdueNotification(eventId) {
  if (await pendingAttendanceCount(eventId)) return false;

  await Notification.updateMany(
    {
      type: "attendance_overdue",
      "related.type": "event_attendance",
      "related.id": eventId,
      isRead: false,
    },
    { $set: { isRead: true, readAt: new Date() } }
  );
  return true;
}

async function scanAttendanceOverdue() {
  if (scanInProgress) return { scanned: 0, notified: 0 };
  scanInProgress = true;
  try {
    const now = new Date();
    const events = await Event.find({
      status: { $ne: "cancelled" },
      $or: [
        { endDateTime: { $lte: now } },
        { status: "completed" },
      ],
    }).select("_id title").lean();

    let notified = 0;
    for (const event of events) {
      const pendingCount = await pendingAttendanceCount(event._id);
      if (!pendingCount) {
        await resolveAttendanceOverdueNotification(event._id);
        continue;
      }

      await notifyActiveAdmins({
        type: "attendance_overdue",
        title: "Sự kiện chưa hoàn tất điểm danh",
        content: `“${event.title}” còn ${pendingCount} người chưa được xác nhận tham dự hoặc vắng mặt.`,
        related: { type: "event_attendance", id: event._id },
        dedupeKey: `attendance-overdue:${event._id}`,
      });
      notified += 1;
    }
    return { scanned: events.length, notified };
  } finally {
    scanInProgress = false;
  }
}

function startAttendanceOverdueWorker() {
  if (attendanceTimer) return attendanceTimer;

  scanAttendanceOverdue().catch((error) =>
    console.error("[AttendanceOverdue] Initial scan failed:", error.message)
  );
  attendanceTimer = setInterval(() => {
    scanAttendanceOverdue().catch((error) =>
      console.error("[AttendanceOverdue] Scheduled scan failed:", error.message)
    );
  }, FIVE_MINUTES);
  attendanceTimer.unref?.();
  return attendanceTimer;
}

function stopAttendanceOverdueWorker() {
  if (!attendanceTimer) return;
  clearInterval(attendanceTimer);
  attendanceTimer = null;
}

module.exports = {
  scanAttendanceOverdue,
  resolveAttendanceOverdueNotification,
  startAttendanceOverdueWorker,
  stopAttendanceOverdueWorker,
};
