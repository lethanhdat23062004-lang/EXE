require("dotenv").config({ path: require("path").resolve(__dirname, "../../.env") });
const assert = require("assert");
const mongoose = require("mongoose");
const User = require("../models/User");
const Event = require("../models/Event");
const EventRating = require("../models/EventRating");
const EventRegistration = require("../models/EventRegistration");
const EventAttendanceAudit = require("../models/EventAttendanceAudit");
const controller = require("../controllers/eventRatingController");
const eventController = require("../controllers/eventController");
const { getTestDatabaseUri } = require("./testDatabase");

const mockResponse = () => ({
  statusCode: 200,
  body: null,
  status(code) {
    this.statusCode = code;
    return this;
  },
  json(payload) {
    this.body = payload;
    return this;
  },
});

const run = async () => {
  const marker = `rating-test-${Date.now()}`;
  const createdUserIds = [];
  let eventId = null;

  try {
    await mongoose.connect(getTestDatabaseUri());

    const [admin, attendee, registeredOnly] = await User.create([
      { fullName: "Rating Test Admin", email: `${marker}-admin@soul.test`, passwordHash: "test", role: "admin" },
      { fullName: "Rating Test Attendee", email: `${marker}-attendee@soul.test`, passwordHash: "test" },
      { fullName: "Rating Test Registered", email: `${marker}-registered@soul.test`, passwordHash: "test" },
    ]);
    createdUserIds.push(admin._id, attendee._id, registeredOnly._id);

    const event = await Event.create({
      title: marker,
      startDateTime: new Date(Date.now() - 2 * 60 * 60 * 1000),
      endDateTime: new Date(Date.now() - 60 * 60 * 1000),
      status: "completed",
      createdBy: admin._id,
    });
    eventId = event._id;
    await EventRegistration.create([
      {
        eventId: event._id,
        userId: attendee._id,
        registrationStatus: "registered",
        attendanceStatus: "attended",
        checkedInAt: new Date(Date.now() - 90 * 60 * 1000),
      },
      {
        eventId: event._id,
        userId: registeredOnly._id,
        registrationStatus: "registered",
        attendanceStatus: "not_checked_in",
      },
    ]);

    const submitRes = mockResponse();
    await controller.submitRating(
      { params: { eventId: event._id.toString() }, user: attendee, body: { rating: 5, comment: "A thoughtful and useful workshop." } },
      submitRes
    );
    assert.equal(submitRes.statusCode, 201);

    const duplicateRes = mockResponse();
    await controller.submitRating(
      { params: { eventId: event._id.toString() }, user: attendee, body: { rating: 4, comment: "Still a useful event overall." } },
      duplicateRes
    );
    assert.equal(duplicateRes.statusCode, 409);

    const forbiddenRes = mockResponse();
    await controller.submitRating(
      { params: { eventId: event._id.toString() }, user: registeredOnly, body: { rating: 5, comment: "This should not be accepted." } },
      forbiddenRes
    );
    assert.equal(forbiddenRes.statusCode, 403);

    const attendanceRes = mockResponse();
    await eventController.updateParticipantAttendance(
      {
        params: { eventId: event._id.toString(), userId: registeredOnly._id.toString() },
        user: admin,
        body: { attendanceStatus: "attended", reason: "Integration test correction" },
      },
      attendanceRes
    );
    assert.equal(attendanceRes.statusCode, 200);
    const updatedRegistration = await EventRegistration.findOne({
      eventId: event._id,
      userId: registeredOnly._id,
    });
    assert.equal(updatedRegistration.attendanceStatus, "attended");
    assert.equal(await EventAttendanceAudit.countDocuments({ eventId: event._id }), 1);

    const updateRes = mockResponse();
    await controller.updateMyRating(
      { params: { eventId: event._id.toString() }, user: attendee, body: { rating: 4, comment: "Updated review after reflection." } },
      updateRes
    );
    assert.equal(updateRes.statusCode, 200);

    const summaryRes = mockResponse();
    await controller.getEventRatingSummary(
      { params: { eventId: event._id.toString() } },
      summaryRes
    );
    assert.equal(summaryRes.body.data.average, 4);
    assert.equal(summaryRes.body.data.total, 1);

    const rating = await EventRating.findOne({ eventId: event._id, userId: attendee._id });
    const hideRes = mockResponse();
    await controller.hideRating(
      { params: { id: rating._id.toString() }, user: admin, body: { reason: "spam", note: "Integration test" } },
      hideRes
    );
    assert.equal(hideRes.statusCode, 200);

    const hiddenSummaryRes = mockResponse();
    await controller.getEventRatingSummary(
      { params: { eventId: event._id.toString() } },
      hiddenSummaryRes
    );
    assert.equal(hiddenSummaryRes.body.data.total, 0);

    const restoreRes = mockResponse();
    await controller.restoreRating(
      { params: { id: rating._id.toString() }, user: admin, body: {} },
      restoreRes
    );
    assert.equal(restoreRes.statusCode, 200);

    console.log("Event rating integration tests passed.");
  } finally {
    if (eventId) await EventRating.deleteMany({ eventId });
    if (eventId) {
      await EventRegistration.deleteMany({ eventId });
      await EventAttendanceAudit.deleteMany({ eventId });
    }
    if (eventId) await Event.deleteOne({ _id: eventId });
    if (createdUserIds.length) await User.deleteMany({ _id: { $in: createdUserIds } });
    await mongoose.disconnect();
  }
};

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
