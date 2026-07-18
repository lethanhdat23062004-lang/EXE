require("dotenv").config({ path: require("path").resolve(__dirname, "../../.env") });

const assert = require("assert");
const bcrypt = require("bcryptjs");
const mongoose = require("mongoose");
const User = require("../models/User");
const Post = require("../models/Post");
const Report = require("../models/Report");
const ModerationLog = require("../models/ModerationLog");
const Notification = require("../models/Notification");
const Event = require("../models/Event");
const EventRating = require("../models/EventRating");
const EventRegistration = require("../models/EventRegistration");
const EventRegistrationMutex = require("../models/EventRegistrationMutex");
const reportController = require("../controllers/reportController");
const ratingController = require("../controllers/eventRatingController");
const eventController = require("../controllers/eventController");
const authController = require("../controllers/authController");
const notificationController = require("../controllers/notificationController");
const forumModerationService = require("../services/forumModerationService");
const {
  notifyActiveAdmins,
  ensureNotificationStorage,
} = require("../services/notificationService");
const { getTestDatabaseUri } = require("./testDatabase");

const response = () => ({
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
  await mongoose.connect(getTestDatabaseUri());
  await ensureNotificationStorage();
  await forumModerationService.ensureForumModerationStorage();

  const marker = `admin-notification-test-${Date.now()}`;
  const userIds = [];
  const postIds = [];
  const reportIds = [];
  const eventIds = [];

  try {
    const password = "AdminNotificationTest123!";
    const passwordHash = await bcrypt.hash(password, 4);
    const [activeAdmin, inactiveAdmin, reporter, author, capacityUser] =
      await User.create([
        {
          fullName: "Active Notification Admin",
          email: `${marker}-active-admin@soul.test`,
          passwordHash,
          role: "admin",
          status: "active",
        },
        {
          fullName: "Inactive Notification Admin",
          email: `${marker}-inactive-admin@soul.test`,
          passwordHash,
          role: "admin",
          status: "inactive",
        },
        {
          fullName: "Notification Reporter",
          email: `${marker}-reporter@soul.test`,
          passwordHash,
          role: "user",
          status: "active",
        },
        {
          fullName: "Notification Author",
          email: `${marker}-author@soul.test`,
          passwordHash,
          role: "user",
          status: "active",
        },
        {
          fullName: "Notification Capacity User",
          email: `${marker}-capacity@soul.test`,
          passwordHash,
          role: "user",
          status: "active",
        },
      ]);
    userIds.push(
      activeAdmin._id,
      inactiveAdmin._id,
      reporter._id,
      author._id,
      capacityUser._id
    );

    const serviceDedupeKey = `${marker}:service-dedupe`;
    await notifyActiveAdmins({
      type: "system",
      title: "Notification service test",
      content: "This notification should only be created once.",
      dedupeKey: serviceDedupeKey,
    });
    await notifyActiveAdmins({
      type: "system",
      title: "Notification service test",
      content: "This notification should only be created once.",
      dedupeKey: serviceDedupeKey,
    });
    assert.equal(
      await Notification.countDocuments({
        userId: activeAdmin._id,
        dedupeKey: serviceDedupeKey,
      }),
      1
    );
    assert.equal(
      await Notification.countDocuments({
        userId: inactiveAdmin._id,
        dedupeKey: serviceDedupeKey,
      }),
      0
    );
    assert.equal(
      await Notification.countDocuments({
        userId: reporter._id,
        dedupeKey: serviceDedupeKey,
      }),
      0
    );

    const post = await Post.create({
      authorId: author._id,
      content: `${marker} community post`,
    });
    postIds.push(post._id);

    const reportResponse = response();
    await reportController.createReport(
      {
        user: reporter,
        body: {
          targetType: "post",
          targetId: post._id.toString(),
          reason: "Integration test report",
        },
      },
      reportResponse
    );
    assert.equal(reportResponse.statusCode, 201);
    const manualReport = reportResponse.body.data;
    reportIds.push(manualReport._id);
    assert.equal(
      await Notification.countDocuments({
        userId: activeAdmin._id,
        dedupeKey: `manual-report:${manualReport._id}`,
      }),
      1
    );

    await Report.updateOne(
      { _id: manualReport._id },
      { $set: { status: "action_taken" } }
    );
    const appealResponse = response();
    await reportController.createAppeal(
      {
        user: author,
        body: {
          reportId: manualReport._id.toString(),
          appealReason: "Please review this moderation decision again.",
        },
      },
      appealResponse
    );
    assert.equal(appealResponse.statusCode, 200);
    assert.equal(
      await Notification.countDocuments({
        userId: activeAdmin._id,
        dedupeKey: `appeal-review:${manualReport._id}`,
      }),
      1
    );

    const aiPost = await Post.create({
      authorId: author._id,
      content: "toi muon chet",
    });
    postIds.push(aiPost._id);
    await forumModerationService.moderatePostAfterCreate(aiPost);
    const aiReport = await Report.findOne({
      targetType: "post",
      targetId: aiPost._id,
      reportSource: "system_ai",
    });
    assert.ok(aiReport);
    reportIds.push(aiReport._id);
    assert.equal(
      await Notification.countDocuments({
        userId: activeAdmin._id,
        dedupeKey: `ai-moderation-report:${aiReport._id}`,
      }),
      1
    );

    const completedEvent = await Event.create({
      title: `${marker}-completed-rating-event`,
      startDateTime: new Date(Date.now() - 2 * 60 * 60 * 1000),
      endDateTime: new Date(Date.now() - 60 * 60 * 1000),
      status: "completed",
      createdBy: activeAdmin._id,
    });
    eventIds.push(completedEvent._id);
    await EventRegistration.create({
      eventId: completedEvent._id,
      userId: author._id,
      registrationStatus: "registered",
      attendanceStatus: "attended",
    });

    const submitRatingResponse = response();
    await ratingController.submitRating(
      {
        params: { eventId: completedEvent._id.toString() },
        user: author,
        body: { rating: 5, comment: "A valid integration test review." },
      },
      submitRatingResponse
    );
    assert.equal(submitRatingResponse.statusCode, 201);
    const eventRating = submitRatingResponse.body.data;
    assert.equal(
      await Notification.countDocuments({
        userId: activeAdmin._id,
        dedupeKey: `low-event-rating:${eventRating._id}`,
      }),
      0
    );

    const lowerRatingResponse = response();
    await ratingController.updateMyRating(
      {
        params: { eventId: completedEvent._id.toString() },
        user: author,
        body: { rating: 2, comment: "This update now requires admin review." },
      },
      lowerRatingResponse
    );
    assert.equal(lowerRatingResponse.statusCode, 200);
    assert.equal(
      await Notification.countDocuments({
        userId: activeAdmin._id,
        dedupeKey: `low-event-rating:${eventRating._id}`,
      }),
      1
    );

    const repeatLowRatingResponse = response();
    await ratingController.updateMyRating(
      {
        params: { eventId: completedEvent._id.toString() },
        user: author,
        body: { rating: 1, comment: "Still low but must not notify twice." },
      },
      repeatLowRatingResponse
    );
    assert.equal(repeatLowRatingResponse.statusCode, 200);
    assert.equal(
      await Notification.countDocuments({
        userId: activeAdmin._id,
        dedupeKey: `low-event-rating:${eventRating._id}`,
      }),
      1
    );

    const capacityEvent = await Event.create({
      title: `${marker}-capacity-event`,
      startDateTime: new Date(Date.now() + 2 * 60 * 60 * 1000),
      endDateTime: new Date(Date.now() + 3 * 60 * 60 * 1000),
      capacity: 10,
      registeredCount: 8,
      createdBy: activeAdmin._id,
    });
    eventIds.push(capacityEvent._id);

    const ninetyResponse = response();
    await eventController.registerEvent(
      { params: { id: capacityEvent._id.toString() }, user: reporter },
      ninetyResponse
    );
    assert.ok([200, 201].includes(ninetyResponse.statusCode));
    assert.equal(
      await Notification.countDocuments({
        userId: activeAdmin._id,
        dedupeKey: `event-capacity:${capacityEvent._id}:90`,
      }),
      1
    );

    const fullResponse = response();
    await eventController.registerEvent(
      { params: { id: capacityEvent._id.toString() }, user: author },
      fullResponse
    );
    assert.ok([200, 201].includes(fullResponse.statusCode));
    assert.equal(
      await Notification.countDocuments({
        userId: activeAdmin._id,
        dedupeKey: `event-capacity:${capacityEvent._id}:100`,
      }),
      1
    );

    const jumpEvent = await Event.create({
      title: `${marker}-jump-capacity-event`,
      startDateTime: new Date(Date.now() + 4 * 60 * 60 * 1000),
      endDateTime: new Date(Date.now() + 5 * 60 * 60 * 1000),
      capacity: 1,
      registeredCount: 0,
      createdBy: activeAdmin._id,
    });
    eventIds.push(jumpEvent._id);
    const jumpResponse = response();
    await eventController.registerEvent(
      { params: { id: jumpEvent._id.toString() }, user: capacityUser },
      jumpResponse
    );
    assert.ok([200, 201].includes(jumpResponse.statusCode));
    assert.equal(
      await Notification.countDocuments({
        userId: activeAdmin._id,
        dedupeKey: `event-capacity:${jumpEvent._id}:100`,
      }),
      1
    );
    assert.equal(
      await Notification.countDocuments({
        userId: activeAdmin._id,
        dedupeKey: `event-capacity:${jumpEvent._id}:90`,
      }),
      0
    );

    const systemCountBeforeLogin = await Notification.countDocuments({
      userId: activeAdmin._id,
      type: "system",
    });
    const loginResponse = response();
    await authController.login(
      { body: { email: activeAdmin.email, password } },
      loginResponse
    );
    assert.equal(loginResponse.statusCode, 200);
    assert.equal(
      await Notification.countDocuments({
        userId: activeAdmin._id,
        type: "system",
      }),
      systemCountBeforeLogin
    );

    const protectedNotification = await Notification.findOne({
      userId: activeAdmin._id,
      dedupeKey: `manual-report:${manualReport._id}`,
    });
    const crossAccountReadResponse = response();
    await notificationController.markAsRead(
      { params: { id: protectedNotification._id.toString() }, user: reporter },
      crossAccountReadResponse
    );
    assert.equal(crossAccountReadResponse.statusCode, 404);
    assert.equal(
      (await Notification.findById(protectedNotification._id)).isRead,
      false
    );

    console.log("Admin notification integration tests passed.");
  } finally {
    if (userIds.length) {
      await Notification.deleteMany({ userId: { $in: userIds } });
      await EventRegistrationMutex.deleteMany({ userId: { $in: userIds } });
    }
    if (reportIds.length) {
      await ModerationLog.deleteMany({ "target.id": { $in: reportIds } });
      await Report.deleteMany({ _id: { $in: reportIds } });
    }
    if (eventIds.length) {
      await EventRating.deleteMany({ eventId: { $in: eventIds } });
      await EventRegistration.deleteMany({ eventId: { $in: eventIds } });
      await Event.deleteMany({ _id: { $in: eventIds } });
    }
    if (postIds.length) await Post.deleteMany({ _id: { $in: postIds } });
    if (userIds.length) await User.deleteMany({ _id: { $in: userIds } });
    await mongoose.disconnect();
  }
};

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
