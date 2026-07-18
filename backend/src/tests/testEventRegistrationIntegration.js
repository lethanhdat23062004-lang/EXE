require("dotenv").config({ path: require("path").resolve(__dirname, "../../.env") });
const assert = require("assert");
const mongoose = require("mongoose");
const User = require("../models/User");
const Event = require("../models/Event");
const EventRegistration = require("../models/EventRegistration");
const EventAttendanceAudit = require("../models/EventAttendanceAudit");
const EventRegistrationMutex = require("../models/EventRegistrationMutex");
const EventRating = require("../models/EventRating");
const eventController = require("../controllers/eventController");
const ratingController = require("../controllers/eventRatingController");
const { getTestDatabaseUri } = require("./testDatabase");

const response = () => ({
  statusCode: 200,
  body: null,
  status(code) { this.statusCode = code; return this; },
  json(payload) { this.body = payload; return this; },
});

const run = async () => {
  await mongoose.connect(getTestDatabaseUri());
  const marker = `registration-test-${Date.now()}`;
  let event;
  let admin;
  let user;
  let limitUser;
  let extraEvents = [];

  try {
    [admin, user, limitUser] = await User.create([
      { fullName: "Registration Admin", email: `${marker}-admin@soul.test`, passwordHash: "test", role: "admin" },
      { fullName: "Registration User", email: `${marker}-user@soul.test`, passwordHash: "test", role: "user" },
      { fullName: "Registration Limit User", email: `${marker}-limit@soul.test`, passwordHash: "test", role: "user" },
    ]);
    event = await Event.create({
      title: marker,
      startDateTime: new Date(Date.now() + 60 * 60 * 1000),
      endDateTime: new Date(Date.now() + 2 * 60 * 60 * 1000),
      capacity: 2,
      registeredCount: 0,
      createdBy: admin._id,
    });

    const createPast = response();
    await eventController.createEvent({
      user: admin,
      body: {
        title: `${marker}-past-create`,
        startDateTime: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
        endDateTime: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
        eventType: "workshop",
        capacity: 20,
      },
    }, createPast);
    assert.equal(createPast.statusCode, 400);
    assert.match(createPast.body.message, /Giờ bắt đầu đã qua/);
    assert.equal(await Event.countDocuments({ title: `${marker}-past-create` }), 0);

    const first = response();
    const duplicate = response();
    await Promise.all([
      eventController.registerEvent({ params: { id: event._id.toString() }, user }, first),
      eventController.registerEvent({ params: { id: event._id.toString() }, user }, duplicate),
    ]);
    assert.deepEqual([first.statusCode, duplicate.statusCode].sort(), [201, 409]);
    assert.equal(await EventRegistration.countDocuments({ eventId: event._id, userId: user._id }), 1);
    assert.equal((await Event.findById(event._id)).registeredCount, 1);

    extraEvents = await Event.insertMany([0, 1, 2, 3].map((index) => ({
      title: `${marker}-limit-${index}`,
      startDateTime: new Date(Date.now() + (index + 2) * 60 * 60 * 1000),
      endDateTime: new Date(Date.now() + (index + 3) * 60 * 60 * 1000),
      capacity: 10,
      registeredCount: 0,
      createdBy: admin._id,
    })));
    const limitResponses = extraEvents.map(() => response());
    await Promise.all(extraEvents.map((extraEvent, index) =>
      eventController.registerEvent(
        { params: { id: extraEvent._id.toString() }, user: limitUser },
        limitResponses[index]
      )
    ));
    assert.equal(limitResponses.filter((item) => [200, 201].includes(item.statusCode)).length, 3);
    assert.equal(limitResponses.filter((item) => item.statusCode === 400).length, 1);

    const searchableIndex = limitResponses.findIndex((item) => [200, 201].includes(item.statusCode));
    const searchResult = response();
    await eventController.getRegisteredEvents({
      user: limitUser,
      query: {
        status: "all",
        search: `${marker}-limit-${searchableIndex}`,
        page: 1,
        limit: 10,
      },
    }, searchResult);
    assert.equal(searchResult.statusCode, 200);
    assert.equal(searchResult.body.data.length, 1);

    const earlyAttendance = response();
    await eventController.updateParticipantAttendance({
      params: { eventId: event._id.toString(), userId: user._id.toString() },
      user: admin,
      body: { attendanceStatus: "attended" },
    }, earlyAttendance);
    assert.equal(earlyAttendance.statusCode, 409);

    const cancel = response();
    await eventController.cancelRegistration({ params: { id: event._id.toString() }, user }, cancel);
    assert.equal(cancel.statusCode, 200);
    const registerAgain = response();
    await eventController.registerEvent({ params: { id: event._id.toString() }, user }, registerAgain);
    assert.equal(registerAgain.statusCode, 200);

    event.startDateTime = new Date(Date.now() - 30 * 60 * 1000);
    event.endDateTime = new Date(Date.now() + 30 * 60 * 1000);
    await event.save();
    const absent = response();
    await eventController.updateParticipantAttendance({
      params: { eventId: event._id.toString(), userId: user._id.toString() },
      user: admin,
      body: { attendanceStatus: "absent" },
    }, absent);
    assert.equal(absent.statusCode, 200);
    assert.equal((await Event.findById(event._id)).registeredCount, 1);

    event.endDateTime = new Date(Date.now() - 1000);
    await event.save();
    const missingReason = response();
    await eventController.updateParticipantAttendance({
      params: { eventId: event._id.toString(), userId: user._id.toString() },
      user: admin,
      body: { attendanceStatus: "attended" },
    }, missingReason);
    assert.equal(missingReason.statusCode, 400);

    const corrected = response();
    await eventController.updateParticipantAttendance({
      params: { eventId: event._id.toString(), userId: user._id.toString() },
      user: admin,
      body: { attendanceStatus: "attended", reason: "Verified from check-in list" },
    }, corrected);
    assert.equal(corrected.statusCode, 200);
    assert.equal(await EventAttendanceAudit.countDocuments({ eventId: event._id }), 2);

    const review = response();
    await ratingController.submitRating({
      params: { eventId: event._id.toString() },
      user,
      body: { rating: 5, comment: "A useful and thoughtful event." },
    }, review);
    assert.equal(review.statusCode, 201);

    console.log("Event registration integration tests passed.");
  } finally {
    if (event) {
      await EventRating.deleteMany({ eventId: event._id });
      await EventAttendanceAudit.deleteMany({ eventId: event._id });
      await EventRegistration.deleteMany({ eventId: event._id });
      await Event.deleteOne({ _id: event._id });
    }
    if (extraEvents.length) {
      const eventIds = extraEvents.map((item) => item._id);
      await EventRegistration.deleteMany({ eventId: { $in: eventIds } });
      await Event.deleteMany({ _id: { $in: eventIds } });
    }
    await EventRegistrationMutex.deleteMany({
      userId: { $in: [user?._id, limitUser?._id].filter(Boolean) },
    });
    if (admin || user || limitUser) {
      await User.deleteMany({
        _id: { $in: [admin?._id, user?._id, limitUser?._id].filter(Boolean) },
      });
    }
    await mongoose.disconnect();
  }
};

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
