require("dotenv").config();

const express = require("express");
const cors = require("cors");
const path = require("path");
const morgan = require("morgan");
const cookieParser = require("cookie-parser");

const connectDB = require("./src/config/db");

const emotionAnalysisRoutes = require("./src/routes/emotionAnalysisRoutes");
const aiRoutes = require("./src/routes/aiRoutes");

const authRouter = require("./src/routes/auth");
const diaryRoutes = require("./src/routes/diaryRoutes");
const postRoutes = require("./src/routes/postRoutes");
const commentRoutes = require("./src/routes/commentRoutes");
const reactionRoutes = require("./src/routes/reactionRoutes");
const reportRoutes = require("./src/routes/reportRoutes");
const adminForumRoutes = require("./src/routes/adminForumRoutes");
const eventRoutes = require("./src/routes/eventRoutes");
const tagRoutes = require("./src/routes/tagRoutes");
const adminRoutes = require("./src/routes/adminRoutes");
const emotionalTestRoutes = require("./src/routes/emotionalTestRoutes");
const ratingRoutes = require("./src/routes/ratingRoutes");
const adminRatingRoutes = require("./src/routes/adminRatingRoutes");
const notificationRoutes = require("./src/routes/notificationRoutes");

const app = express();

connectDB();

const allowedOrigins = [
  process.env.CLIENT_URL,
  "http://localhost:3000",
  "http://localhost:5173",
  "http://localhost:8081",
  "http://localhost:19006",
  "https://exe2306.vercel.app",
  "https://soulaimind.space",
  "https://exe2306-lw7qjq3lt-soul11.vercel.app",
].filter(Boolean);

app.use(
  cors({
    origin: function (origin, callback) {
      // Cho phép Postman / mobile app không có origin
      if (!origin) return callback(null, true);

      const isLocalhost =
        origin.startsWith("http://localhost:") ||
        origin === "http://localhost" ||
        origin.startsWith("http://127.0.0.1:") ||
        origin === "http://127.0.0.1";

      const isAllowedOrigin =
        isLocalhost ||
        allowedOrigins.includes(origin) ||
        origin.endsWith(".vercel.app");

      if (isAllowedOrigin) {
        return callback(null, true);
      }

      console.log("CORS blocked origin:", origin);
      return callback(new Error("Not allowed by CORS: " + origin));
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());

if (process.env.NODE_ENV !== "production") {
  app.use(morgan("dev"));
}

app.use(express.static(path.join(__dirname, "public")));

app.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    message: "SOUL API Running",
    environment: process.env.NODE_ENV || "development",
  });
});

app.get("/api/health", (req, res) => {
  res.status(200).json({
    success: true,
    status: "ok",
    message: "SOUL Backend is healthy",
  });
});

// Routes
app.use("/api/auth", authRouter);
app.use("/api/posts", postRoutes);
app.use("/api/comments", commentRoutes);
app.use("/api/reactions", reactionRoutes);
app.use("/api/reports", reportRoutes);
app.use("/api/admin/forum", adminForumRoutes);
app.use("/api/diaries", diaryRoutes);
app.use("/api/events", eventRoutes);
app.use("/api/tags", tagRoutes);
app.use("/api/ai", aiRoutes);
app.use("/api/emotion-analysis", emotionAnalysisRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/emotional-tests", emotionalTestRoutes);
app.use("/api/ratings", ratingRoutes);
app.use("/api/admin/ratings", adminRatingRoutes);
app.use("/api/notifications", notificationRoutes);

module.exports = app;
