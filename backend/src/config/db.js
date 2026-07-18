const mongoose = require("mongoose");
const dns = require("dns");

// Fix lỗi DNS khi connect MongoDB Atlas bằng mongodb+srv
dns.setDefaultResultOrder("ipv4first");
dns.setServers(["8.8.8.8", "1.1.1.1"]);

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 30000,
    });

    const {
      ensureNotificationStorage,
    } = require("../services/notificationService");
    const {
      ensureForumModerationStorage,
    } = require("../services/forumModerationService");
    const { ensureEventStorage } = require("../services/eventStorageService");
    await ensureNotificationStorage();
    await ensureForumModerationStorage();
    await ensureEventStorage();

    console.log("MongoDB Connected");
    return mongoose.connection;
  } catch (error) {
    console.error("MongoDB connection error:", error.message);
    throw error;
  }
};

module.exports = connectDB;
