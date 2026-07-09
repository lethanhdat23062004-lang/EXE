const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    fullName: {
      type: String,
      required: true,
      trim: true,
    },

    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },

    phone: {
      type: String,
      unique: true,
      sparse: true,
      trim: true,
    },

    passwordHash: {
      type: String,
      required: true,
    },

    avatarUrl: {
      type: String,
      default: null,
    },

    bio: {
      type: String,
      default: null,
    },

    savedPosts: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Post",
      },
    ],

    completedEmotionalTests: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "EmotionalTest",
      },
    ],

    role: {
      type: String,
      enum: ["user", "admin", "event_organizer"],
      required: true,
      default: "user",
    },

    status: {
      type: String,
      enum: ["active", "inactive", "blocked"],
      required: true,
      default: "active",
    },

    forumBannedUntil: {
      type: Date,
      default: null,
    },

    moodReputation: {
      type: String,
      enum: ["positive", "neutral", "negative"],
      default: "neutral",
    },

    moodReputationScore: {
      type: Number,
      default: 0,
    },

    moodReputationUpdatedAt: {
      type: Date,
      default: null,
    },

    anonymousModeEnabled: {
      type: Boolean,
      default: false,
    },

    anonymousAlias: {
      type: String,
      trim: true,
      default: null,
    },

    anonymousModeUpdatedAt: {
      type: Date,
      default: null,
    },

    lastEmotionalTestAt: {
      type: Date,
      default: null,
    },

    nextEmotionalTestDueAt: {
      type: Date,
      default: null,
    },

    gender: {
      type: String,
      enum: ["male", "female", "other", null],
      default: null,
    },

    dateOfBirth: {
      type: Date,
      default: null,
    },

    isEmailVerified: {
      type: Boolean,
      default: false,
    },

    emailVerifiedAt: {
      type: Date,
      default: null,
    },

    lastLoginAt: {
      type: Date,
      default: null,
    },

    failedLoginAttempts: {
      type: Number,
      default: 0,
    },

    passwordChangedAt: {
      type: Date,
      default: null,
    },

    resetCode: {
      type: String,
      default: null,
    },

    resetCodeExpires: {
      type: Date,
      default: null,
    },

    googleId: {
      type: String,
      unique: true,
      sparse: true,
      trim: true,
    },

    isPremium: {
      type: Boolean,
      default: false,
    },

    chatCount: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

userSchema.methods.toJSON = function () {
  const user = this.toObject();
  delete user.passwordHash;
  return user;
};

const User = mongoose.model("User", userSchema);

module.exports = User;