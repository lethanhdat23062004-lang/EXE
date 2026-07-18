require("dotenv").config({ path: require("path").resolve(__dirname, "../../.env") });

const assert = require("assert");
const mongoose = require("mongoose");
const User = require("../models/User");
const Report = require("../models/Report");
const Rating = require("../models/Rating");
const Event = require("../models/Event");
const EventRating = require("../models/EventRating");
const EventRegistration = require("../models/EventRegistration");
const EventAttendanceAudit = require("../models/EventAttendanceAudit");
const { getAdminDashboardOverview } = require("../controllers/adminDashboardController");
const { getAttendanceAudits } = require("../controllers/eventController");
const { getTestDatabaseUri } = require("./testDatabase");

const response = () => ({
  statusCode: 200,
  body: null,
  status(code) { this.statusCode = code; return this; },
  json(payload) { this.body = payload; return this; },
});

async function run() {
  await mongoose.connect(getTestDatabaseUri());
  const marker = `admin-dashboard-test-${Date.now()}`;
  const userIds = [];
  const eventIds = [];
  const reportIds = [];

  try {
    const baselineResponse = response();
    await getAdminDashboardOverview({}, baselineResponse);
    assert.strictEqual(baselineResponse.statusCode, 200);
    const baseline = baselineResponse.body.data;

    const [admin, ratedUser, unknownUser] = await User.create([
      { fullName: "Dashboard Admin", email: `${marker}-admin@soul.test`, passwordHash: "test", role: "admin", status: "active", gender: "female", dateOfBirth: new Date("1990-01-01") },
      { fullName: "Dashboard Rated User", email: `${marker}-rated@soul.test`, passwordHash: "test", role: "user", status: "active", gender: "male", dateOfBirth: new Date("2005-01-01") },
      { fullName: "Dashboard Unknown User", email: `${marker}-unknown@soul.test`, passwordHash: "test", role: "user", status: "active", gender: null, dateOfBirth: null },
    ]);
    userIds.push(admin._id, ratedUser._id, unknownUser._id);

    await Rating.create({ userId: ratedUser._id, rating: 5, feedback: "SOUL rất hữu ích" });

    const event = await Event.create({
      title: marker,
      startDateTime: new Date(Date.now() - 2 * 60 * 60 * 1000),
      endDateTime: new Date(Date.now() - 60 * 60 * 1000),
      status: "completed",
      registeredCount: 1,
      createdBy: admin._id,
    });
    eventIds.push(event._id);
    const registration = await EventRegistration.create({
      eventId: event._id,
      userId: ratedUser._id,
      registrationStatus: "registered",
      attendanceStatus: "not_checked_in",
    });
    await EventRating.create({ eventId: event._id, userId: ratedUser._id, rating: 1, comment: "Đánh giá sự kiện riêng" });
    await EventAttendanceAudit.create({
      eventId: event._id,
      registrationId: registration._id,
      userId: ratedUser._id,
      changedBy: admin._id,
      fromStatus: "attended",
      toStatus: "not_checked_in",
      reason: "Kiểm tra lịch sử",
    });

    const manualReport = await Report.create({
      targetType: "post",
      targetId: new mongoose.Types.ObjectId(),
      reporterId: ratedUser._id,
      reportSource: "user",
      reportedUserId: unknownUser._id,
      reason: marker,
      status: "pending",
    });
    const aiReport = await Report.create({
      targetType: "post",
      targetId: new mongoose.Types.ObjectId(),
      reporterId: null,
      reportSource: "system_ai",
      reportedUserId: unknownUser._id,
      reason: marker,
      status: "pending",
    });
    const appealReport = await Report.create({
      targetType: "comment",
      targetId: new mongoose.Types.ObjectId(),
      reporterId: ratedUser._id,
      reportSource: "user",
      reportedUserId: unknownUser._id,
      reason: marker,
      status: "appeal_pending",
      appealReason: "Yêu cầu xem xét lại",
    });
    reportIds.push(manualReport._id, aiReport._id, appealReport._id);

    const overviewResponse = response();
    await getAdminDashboardOverview({}, overviewResponse);
    assert.strictEqual(overviewResponse.statusCode, 200);
    const data = overviewResponse.body.data;
    assert.strictEqual(
      data.users.distribution.gender.unknown,
      baseline.users.distribution.gender.unknown + 1
    );
    assert.strictEqual(
      data.users.distribution.age.unknown,
      baseline.users.distribution.age.unknown + 1
    );
    assert.strictEqual(data.moderation.pendingReports, baseline.moderation.pendingReports + 2);
    assert.strictEqual(data.moderation.pendingAppeals, baseline.moderation.pendingAppeals + 1);
    assert.strictEqual(data.moderation.aiFlagged, baseline.moderation.aiFlagged + 1);
    assert.strictEqual(data.events.overdueEventCount, baseline.events.overdueEventCount + 1);
    assert.strictEqual(
      data.appSatisfaction.totalRatings,
      baseline.appSatisfaction.totalRatings + 1
    );
    assert.strictEqual(
      data.appSatisfaction.distribution[5],
      baseline.appSatisfaction.distribution[5] + 1
    );
    assert.ok(data.appSatisfaction.responseRate >= 0 && data.appSatisfaction.responseRate <= 100);
    assert.ok(!JSON.stringify(data).match(/diar|chatSession|emotionalTestResult/i));

    const auditResponse = response();
    await getAttendanceAudits(
      { params: { eventId: event._id.toString() }, query: { page: 1, limit: 20 } },
      auditResponse
    );
    assert.strictEqual(auditResponse.statusCode, 200);
    assert.strictEqual(auditResponse.body.data.audits[0].reason, "Kiểm tra lịch sử");
    assert.strictEqual(auditResponse.body.pagination.total, 1);

    console.log("Admin dashboard integration tests passed");
  } finally {
    await EventAttendanceAudit.deleteMany({ eventId: { $in: eventIds } });
    await EventRating.deleteMany({ eventId: { $in: eventIds } });
    await EventRegistration.deleteMany({ eventId: { $in: eventIds } });
    await Event.deleteMany({ _id: { $in: eventIds } });
    await Report.deleteMany({ _id: { $in: reportIds } });
    await Rating.deleteMany({ userId: { $in: userIds } });
    await User.deleteMany({ _id: { $in: userIds } });
    await mongoose.disconnect();
  }
}

run().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
