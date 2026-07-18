const express = require("express");
const router = express.Router();

const {
  getAllUsers,
  getUserById,
  updateUserStatus,
  updateUserRole,
} = require("../controllers/adminController");

const auth = require("../middleware/auth");
const { getAdminDashboardOverview } = require("../controllers/adminDashboardController");
const {
  getEventDashboardStatistics,
  getAdminEvents,
  getAdminEventById,
  getAttendanceAudits,
  archiveEvent,
  restoreEvent,
  cancelEvent,
  updateParticipantAttendance,
} = require("../controllers/eventController");

// Lấy danh sách tất cả user (có filter, search, phân trang)
router.get("/users", auth, auth.isAdmin, getAllUsers);

// Lấy chi tiết một user
router.get("/users/:id", auth, auth.isAdmin, getUserById);

// Cập nhật trạng thái tài khoản (khóa/mở khóa)
router.patch("/users/:id/status", auth, auth.isAdmin, updateUserStatus);

// Cập nhật vai trò (gán/thu hồi event_organizer, admin)
router.patch("/users/:id/role", auth, auth.isAdmin, updateUserRole);

router.get("/dashboard/overview", auth, auth.isAdmin, getAdminDashboardOverview);

router.patch(
  "/events/:eventId/participants/:userId/attendance",
  auth,
  auth.isAdmin,
  updateParticipantAttendance
);
router.get("/events/statistics", auth, auth.isAdmin, getEventDashboardStatistics);
router.get("/events", auth, auth.isAdmin, getAdminEvents);
router.get("/events/:id", auth, auth.isAdmin, getAdminEventById);
router.get("/events/:eventId/attendance-audits", auth, auth.isAdmin, getAttendanceAudits);
router.patch("/events/:id/archive", auth, auth.isAdmin, archiveEvent);
router.patch("/events/:id/restore", auth, auth.isAdmin, restoreEvent);
router.patch("/events/:id/cancel", auth, auth.isAdmin, cancelEvent);

module.exports = router;
