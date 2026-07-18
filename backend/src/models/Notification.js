const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    type: {
      type: String,
      enum: [
        "event_reminder",
        "event_registration",
        "mental_insight",
        "emotional_test_reminder",
        "safety_alert",
        "report_update",
        "moderation_review",
        "appeal_update",
        "appeal_review",
        "rating_alert",
        "event_capacity_alert",
        "attendance_overdue",
        "positive_support_request",
        "friend_suggestion",
        "friend_request",
        "welcome",
        "system",
      ],
      required: true,
    },

    title: {
      type: String,
      required: true,
      trim: true,
    },

    content: {
      type: String,
      required: true,
    },

    related: {
      type: {
        type: String,
        default: null,
      },

      id: {
        type: mongoose.Schema.Types.ObjectId,
        default: null,
      },
    },

    isRead: {
      type: Boolean,
      default: false,
    },

    readAt: {
      type: Date,
      default: null,
    },

    // Internal idempotency key. It is intentionally excluded from API results.
    dedupeKey: {
      type: String,
      trim: true,
      select: false,
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  }
);

notificationSchema.index({ userId: 1 });
notificationSchema.index({ userId: 1, isRead: 1 });
notificationSchema.index({ type: 1 });
notificationSchema.index({ createdAt: -1 });
notificationSchema.index(
  { userId: 1, dedupeKey: 1 },
  {
    unique: true,
    partialFilterExpression: { dedupeKey: { $type: "string" } },
  }
);

module.exports = mongoose.model("Notification", notificationSchema);
