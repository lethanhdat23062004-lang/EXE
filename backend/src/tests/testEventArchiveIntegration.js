require("dotenv").config({ path: require("path").resolve(__dirname, "../../.env") });

const assert = require("assert");
const mongoose = require("mongoose");
const User = require("../models/User");
const Event = require("../models/Event");
const EventRegistration = require("../models/EventRegistration");
const EventRating = require("../models/EventRating");
const Notification = require("../models/Notification");
const eventController = require("../controllers/eventController");
const {
  scanAttendanceOverdue,
} = require("../services/attendanceOverdueService");
const { ensureNotificationStorage } = require("../services/notificationService");
const { ensureEventStorage } = require("../services/eventStorageService");
const { getTestDatabaseUri } = require("./testDatabase");

const response = () => ({
  statusCode: 200,
  body: null,
  status(code) { this.statusCode = code; return this; },
  json(payload) { this.body = payload; return this; },
});

async function run() {
  await mongoose.connect(getTestDatabaseUri());
  await ensureNotificationStorage();
  await ensureEventStorage();

  const marker = `event-archive-test-${Date.now()}`;
  const createdUserIds = [];
  const createdEventIds = [];
  try {
    const [admin, attendee] = await User.create([
      { fullName: "Archive Test Admin", email: `${marker}-admin@soul.test`, passwordHash: "test", role: "admin", status: "active" },
      { fullName: "Archive Test User", email: `${marker}-user@soul.test`, passwordHash: "test", role: "user", status: "active" },
    ]);
    createdUserIds.push(admin._id, attendee._id);

    const completedEvent = await Event.create({
      title: `${marker}-completed`,
      startDateTime: new Date(Date.now() - 2 * 60 * 60 * 1000),
      endDateTime: new Date(Date.now() - 60 * 60 * 1000),
      status: "completed",
      capacity: 10,
      registeredCount: 1,
      createdBy: admin._id,
    });
    createdEventIds.push(completedEvent._id);
    const registration = await EventRegistration.create({
      eventId: completedEvent._id,
      userId: attendee._id,
      registrationStatus: "registered",
      attendanceStatus: "not_checked_in",
    });
    await EventRating.create({
      eventId: completedEvent._id,
      userId: attendee._id,
      rating: 4,
      comment: "Nội dung đánh giá hợp lệ",
    });

    const deleteCompleted = response();
    await eventController.deleteEvent({ params: { id: completedEvent._id.toString() } }, deleteCompleted);
    assert.strictEqual(deleteCompleted.statusCode, 409);
    assert.strictEqual(deleteCompleted.body.code, "EVENT_HAS_HISTORY");
    assert.strictEqual(deleteCompleted.body.data.suggestedAction, "archive");
    assert.strictEqual(deleteCompleted.body.data.registrationCount, 1);
    assert.strictEqual(deleteCompleted.body.data.ratingCount, 1);

    const archiveResponse = response();
    await eventController.archiveEvent(
      { params: { id: completedEvent._id.toString() }, user: { _id: admin._id } },
      archiveResponse
    );
    assert.strictEqual(archiveResponse.statusCode, 200);
    assert.strictEqual(archiveResponse.body.data.isArchived, true);
    assert.strictEqual(await EventRegistration.countDocuments({ eventId: completedEvent._id }), 1);
    assert.strictEqual(await EventRating.countDocuments({ eventId: completedEvent._id }), 1);

    const publicList = response();
    await eventController.getEvents({ query: { limit: 100 } }, publicList);
    assert.ok(!publicList.body.data.some((event) => event._id.toString() === completedEvent._id.toString()));

    const restoreResponse = response();
    await eventController.restoreEvent(
      { params: { id: completedEvent._id.toString() }, user: { _id: admin._id } },
      restoreResponse
    );
    assert.strictEqual(restoreResponse.body.data.isArchived, false);

    await scanAttendanceOverdue();
    await scanAttendanceOverdue();
    const overdueFilter = {
      userId: admin._id,
      type: "attendance_overdue",
      "related.id": completedEvent._id,
    };
    assert.strictEqual(await Notification.countDocuments(overdueFilter), 1);

    const attendanceResponse = response();
    await eventController.updateParticipantAttendance(
      {
        params: { eventId: completedEvent._id.toString(), userId: attendee._id.toString() },
        body: { attendanceStatus: "attended", reason: "Hoàn tất điểm danh sau sự kiện" },
        user: { _id: admin._id },
      },
      attendanceResponse
    );
    assert.strictEqual(attendanceResponse.statusCode, 200);
    assert.strictEqual((await Notification.findOne(overdueFilter)).isRead, true);

    const upcomingEvent = await Event.create({
      title: `${marker}-upcoming`,
      startDateTime: new Date(Date.now() + 60 * 60 * 1000),
      endDateTime: new Date(Date.now() + 2 * 60 * 60 * 1000),
      status: "upcoming",
      capacity: 10,
      registeredCount: 1,
      createdBy: admin._id,
    });
    createdEventIds.push(upcomingEvent._id);
    await EventRegistration.create({
      eventId: upcomingEvent._id,
      userId: attendee._id,
      registrationStatus: "registered",
      attendanceStatus: "not_checked_in",
    });

    const deleteUpcoming = response();
    await eventController.deleteEvent({ params: { id: upcomingEvent._id.toString() } }, deleteUpcoming);
    assert.strictEqual(deleteUpcoming.body.data.suggestedAction, "cancel");

    const missingReason = response();
    await eventController.cancelEvent(
      { params: { id: upcomingEvent._id.toString() }, body: {}, user: { _id: admin._id } },
      missingReason
    );
    assert.strictEqual(missingReason.statusCode, 400);

    const cancelResponse = response();
    await eventController.cancelEvent(
      {
        params: { id: upcomingEvent._id.toString() },
        body: { reason: "Thay đổi lịch tổ chức" },
        user: { _id: admin._id },
      },
      cancelResponse
    );
    assert.strictEqual(cancelResponse.statusCode, 200);
    assert.strictEqual(cancelResponse.body.data.status, "cancelled");
    assert.strictEqual(
      await Notification.countDocuments({
        userId: attendee._id,
        "related.id": upcomingEvent._id,
        type: "event_reminder",
      }),
      1
    );

    console.log("Event archive/cancel/attendance integration tests passed");
  } finally {
    await Notification.deleteMany({ $or: [{ userId: { $in: createdUserIds } }, { "related.id": { $in: createdEventIds } }] });
    await EventRating.deleteMany({ eventId: { $in: createdEventIds } });
    await EventRegistration.deleteMany({ eventId: { $in: createdEventIds } });
    await Event.deleteMany({ _id: { $in: createdEventIds } });
    await User.deleteMany({ _id: { $in: createdUserIds } });
    await mongoose.disconnect();
  }
}

run().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
