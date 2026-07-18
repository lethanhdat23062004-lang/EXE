const User = require("../models/User");
const Report = require("../models/Report");
const Rating = require("../models/Rating");
const EventRating = require("../models/EventRating");
const EventRegistration = require("../models/EventRegistration");

const percentage = (part, total) =>
  total > 0 ? Math.round((part / total) * 1000) / 10 : 0;

const toCountMap = (rows, allowedKeys) => {
  const result = Object.fromEntries(allowedKeys.map((key) => [key, 0]));
  rows.forEach((row) => {
    const key = row._id === null || row._id === undefined ? "unknown" : String(row._id);
    if (Object.prototype.hasOwnProperty.call(result, key)) result[key] = row.count;
  });
  return result;
};

const buildLastSixMonths = (rows, now = new Date()) => {
  const source = new Map(rows.map((row) => [row._id, row.count]));
  return Array.from({ length: 6 }, (_, index) => {
    const date = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 5 + index, 1));
    const key = `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}`;
    return {
      month: key,
      label: `T${date.getUTCMonth() + 1}`,
      count: source.get(key) || 0,
    };
  });
};

const getAdminDashboardOverview = async (_req, res) => {
  try {
    const now = new Date();
    const sixMonthsAgo = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 5, 1));

    const [
      userRows,
      eligibleActiveUsers,
      moderationRows,
      registrationRows,
      eventRatingRows,
      overdueRows,
      appRatingRows,
      recentFeedback,
    ] = await Promise.all([
      User.aggregate([
        {
          $facet: {
            gender: [
              { $group: { _id: { $ifNull: ["$gender", "unknown"] }, count: { $sum: 1 } } },
            ],
            status: [{ $group: { _id: "$status", count: { $sum: 1 } } }],
            role: [{ $group: { _id: "$role", count: { $sum: 1 } } }],
            age: [
              {
                $project: {
                  age: {
                    $cond: [
                      { $eq: [{ $type: "$dateOfBirth" }, "date"] },
                      { $dateDiff: { startDate: "$dateOfBirth", endDate: now, unit: "year" } },
                      null,
                    ],
                  },
                },
              },
              {
                $project: {
                  group: {
                    $switch: {
                      branches: [
                        { case: { $and: [{ $gte: ["$age", 0] }, { $lt: ["$age", 18] }] }, then: "under18" },
                        { case: { $and: [{ $gte: ["$age", 18] }, { $lte: ["$age", 22] }] }, then: "18_22" },
                        { case: { $and: [{ $gte: ["$age", 23] }, { $lte: ["$age", 30] }] }, then: "23_30" },
                        { case: { $gt: ["$age", 30] }, then: "over30" },
                      ],
                      default: "unknown",
                    },
                  },
                },
              },
              { $group: { _id: "$group", count: { $sum: 1 } } },
            ],
            growth: [
              { $match: { createdAt: { $gte: sixMonthsAgo } } },
              { $group: { _id: { $dateToString: { format: "%Y-%m", date: "$createdAt" } }, count: { $sum: 1 } } },
              { $sort: { _id: 1 } },
            ],
            total: [{ $count: "count" }],
          },
        },
      ]),
      User.countDocuments({ role: "user", status: "active" }),
      Report.aggregate([
        {
          $group: {
            _id: null,
            pendingReports: { $sum: { $cond: [{ $eq: ["$status", "pending"] }, 1, 0] } },
            pendingAppeals: { $sum: { $cond: [{ $eq: ["$status", "appeal_pending"] }, 1, 0] } },
            aiFlagged: {
              $sum: {
                $cond: [
                  { $and: [{ $eq: ["$reportSource", "system_ai"] }, { $eq: ["$status", "pending"] }] },
                  1,
                  0,
                ],
              },
            },
          },
        },
      ]),
      EventRegistration.aggregate([
        {
          $group: {
            _id: null,
            registeredCount: { $sum: { $cond: [{ $eq: ["$registrationStatus", "registered"] }, 1, 0] } },
            cancelledCount: { $sum: { $cond: [{ $eq: ["$registrationStatus", "cancelled"] }, 1, 0] } },
            attendedCount: { $sum: { $cond: [{ $eq: ["$attendanceStatus", "attended"] }, 1, 0] } },
            absentCount: { $sum: { $cond: [{ $eq: ["$attendanceStatus", "absent"] }, 1, 0] } },
          },
        },
      ]),
      EventRating.aggregate([
        {
          $group: {
            _id: null,
            reviewCount: { $sum: 1 },
            averageRating: { $avg: { $cond: [{ $eq: ["$status", "visible"] }, "$rating", null] } },
          },
        },
      ]),
      EventRegistration.aggregate([
        { $match: { registrationStatus: "registered", attendanceStatus: "not_checked_in" } },
        { $lookup: { from: "events", localField: "eventId", foreignField: "_id", as: "event" } },
        { $unwind: "$event" },
        {
          $match: {
            "event.status": { $ne: "cancelled" },
            $or: [{ "event.endDateTime": { $lte: now } }, { "event.status": "completed" }],
          },
        },
        { $group: { _id: "$eventId", pendingRegistrations: { $sum: 1 } } },
        { $group: { _id: null, eventCount: { $sum: 1 }, registrationCount: { $sum: "$pendingRegistrations" } } },
      ]),
      Rating.aggregate([
        {
          $group: {
            _id: null,
            total: { $sum: 1 },
            average: { $avg: "$rating" },
            satisfied: { $sum: { $cond: [{ $gte: ["$rating", 4] }, 1, 0] } },
            oneStar: { $sum: { $cond: [{ $eq: ["$rating", 1] }, 1, 0] } },
            twoStar: { $sum: { $cond: [{ $eq: ["$rating", 2] }, 1, 0] } },
            threeStar: { $sum: { $cond: [{ $eq: ["$rating", 3] }, 1, 0] } },
            fourStar: { $sum: { $cond: [{ $eq: ["$rating", 4] }, 1, 0] } },
            fiveStar: { $sum: { $cond: [{ $eq: ["$rating", 5] }, 1, 0] } },
          },
        },
      ]),
      Rating.find({ feedback: { $type: "string", $ne: "" } })
        .sort({ createdAt: -1 })
        .limit(5)
        .populate("userId", "fullName avatarUrl")
        .select("rating feedback createdAt userId")
        .lean(),
    ]);

    const users = userRows[0] || {};
    const registrations = registrationRows[0] || {};
    const eventRatings = eventRatingRows[0] || {};
    const moderation = moderationRows[0] || {};
    const overdue = overdueRows[0] || {};
    const appRatings = appRatingRows[0] || {};
    const totalAppRatings = appRatings.total || 0;
    const attendanceDecisions = (registrations.attendedCount || 0) + (registrations.absentCount || 0);

    return res.status(200).json({
      success: true,
      data: {
        users: {
          total: users.total?.[0]?.count || 0,
          active: toCountMap(users.status || [], ["active", "inactive", "blocked"]).active,
          inactive: toCountMap(users.status || [], ["active", "inactive", "blocked"]).inactive,
          blocked: toCountMap(users.status || [], ["active", "inactive", "blocked"]).blocked,
          growth: buildLastSixMonths(users.growth || [], now),
          distribution: {
            age: toCountMap(users.age || [], ["under18", "18_22", "23_30", "over30", "unknown"]),
            gender: toCountMap(users.gender || [], ["male", "female", "other", "unknown"]),
            status: toCountMap(users.status || [], ["active", "inactive", "blocked"]),
            role: toCountMap(users.role || [], ["user", "admin", "event_organizer"]),
          },
        },
        moderation: {
          pendingReports: moderation.pendingReports || 0,
          pendingAppeals: moderation.pendingAppeals || 0,
          aiFlagged: moderation.aiFlagged || 0,
        },
        events: {
          registeredCount: registrations.registeredCount || 0,
          cancelledCount: registrations.cancelledCount || 0,
          attendedCount: registrations.attendedCount || 0,
          absentCount: registrations.absentCount || 0,
          attendanceRate: percentage(registrations.attendedCount || 0, attendanceDecisions),
          reviewRate: percentage(eventRatings.reviewCount || 0, registrations.attendedCount || 0),
          averageRating: Math.round((eventRatings.averageRating || 0) * 10) / 10,
          overdueEventCount: overdue.eventCount || 0,
          overdueRegistrationCount: overdue.registrationCount || 0,
        },
        appSatisfaction: {
          totalRatings: totalAppRatings,
          averageRating: Math.round((appRatings.average || 0) * 10) / 10,
          responseRate: Math.min(100, percentage(totalAppRatings, eligibleActiveUsers)),
          satisfactionRate: percentage(appRatings.satisfied || 0, totalAppRatings),
          distribution: {
            1: appRatings.oneStar || 0,
            2: appRatings.twoStar || 0,
            3: appRatings.threeStar || 0,
            4: appRatings.fourStar || 0,
            5: appRatings.fiveStar || 0,
          },
          recentFeedback: recentFeedback.map((item) => ({
            _id: item._id,
            rating: item.rating,
            feedback: item.feedback,
            createdAt: item.createdAt,
            user: item.userId
              ? { _id: item.userId._id, fullName: item.userId.fullName, avatarUrl: item.userId.avatarUrl }
              : null,
          })),
        },
      },
    });
  } catch (error) {
    console.error("Admin dashboard overview error:", error);
    return res.status(500).json({ success: false, message: "Không thể tải dữ liệu tổng quan quản trị" });
  }
};

module.exports = { getAdminDashboardOverview };
