require("dotenv").config({ path: require("path").resolve(__dirname, "../../.env") });

const mongoose = require("mongoose");
const Notification = require("../models/Notification");
const User = require("../models/User");
const Report = require("../models/Report");
const Event = require("../models/Event");
const EventRating = require("../models/EventRating");

const applyChanges = process.argv.includes("--apply");

async function findOrphanNotificationIds() {
  const candidates = await Notification.find({
    type: {
      $in: [
        "moderation_review",
        "appeal_review",
        "rating_alert",
        "event_capacity_alert",
        "attendance_overdue",
      ],
    },
    "related.id": { $ne: null },
  }).select("_id type related").lean();

  const reportIds = candidates
    .filter((item) => ["moderation_review", "appeal_review"].includes(item.type))
    .map((item) => item.related.id);
  const ratingIds = candidates
    .filter((item) => item.type === "rating_alert")
    .map((item) => item.related.id);
  const eventIds = candidates
    .filter((item) => ["event_capacity_alert", "attendance_overdue"].includes(item.type))
    .map((item) => item.related.id);

  const [reports, ratings, events] = await Promise.all([
    Report.find({ _id: { $in: reportIds } }).select("_id").lean(),
    EventRating.find({ _id: { $in: ratingIds } }).select("_id").lean(),
    Event.find({ _id: { $in: eventIds } }).select("_id").lean(),
  ]);
  const existing = {
    report: new Set(reports.map((item) => item._id.toString())),
    rating: new Set(ratings.map((item) => item._id.toString())),
    event: new Set(events.map((item) => item._id.toString())),
  };

  return candidates
    .filter((item) => {
      if (["moderation_review", "appeal_review"].includes(item.type)) {
        return !existing.report.has(item.related.id.toString());
      }
      if (item.type === "rating_alert") {
        return !existing.rating.has(item.related.id.toString());
      }
      return !existing.event.has(item.related.id.toString());
    })
    .map((item) => item._id);
}

async function run() {
  if (!process.env.MONGODB_URI) throw new Error("MONGODB_URI is required");
  await mongoose.connect(process.env.MONGODB_URI);

  const adminIds = await User.distinct("_id", { role: "admin" });
  const orphanIds = await findOrphanNotificationIds();
  const filter = {
    $or: [
      { userId: { $in: adminIds }, type: "system", title: "Đăng nhập thành công" },
      { title: "Notification service test" },
      { content: /admin-notification-test-/i },
      { dedupeKey: /admin-notification-test-/i },
      { _id: { $in: orphanIds } },
    ],
  };
  const count = await Notification.countDocuments(filter);

  console.log(`${applyChanges ? "APPLY" : "DRY RUN"}: ${count} notification(s) matched cleanup rules.`);
  if (applyChanges && count) {
    const result = await Notification.deleteMany(filter);
    console.log(`Deleted ${result.deletedCount} notification(s).`);
  } else if (!applyChanges) {
    console.log("No data changed. Run with --apply to delete matched notifications.");
  }
}

run()
  .catch((error) => {
    console.error("Cleanup failed:", error.message);
    process.exitCode = 1;
  })
  .finally(() => mongoose.disconnect());
