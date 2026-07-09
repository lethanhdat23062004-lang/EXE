const express = require("express");
const router = express.Router();

const {
  register,
  login,
  getProfile,
  logout,
  forgotPassword,
  verifyCode,
  resetPassword,
  googleLogin,
  initiateGoogleAuth,
  googleCallback,
  updateProfile,
  changePassword,
  upgradeAccount,
} = require("../controllers/authController");
const auth = require("../middleware/auth");

// Đăng ký tài khoản mới (Public)
router.post("/register", register);

// Đăng nhập (Public)
router.post("/login", login);

// Lấy thông tin cá nhân của token đang đăng nhập (Private)
router.get("/me", auth, getProfile);

// Đăng xuất - vô hiệu hóa token phía server (Private)
router.post("/logout", auth, logout);

// Các endpoint phục vụ luồng quên mật khẩu (Public)
router.post("/forgot-password", forgotPassword);
router.post("/verify-code", verifyCode);
router.post("/reset-password", resetPassword);

// Đăng nhập bằng Google (Mục đích đồng bộ hóa/fallback) (Public)
router.post("/google-login", googleLogin);

// Khởi chạy luồng Google OAuth 2.0 thật (Public)
router.get("/google", initiateGoogleAuth);

// Callback đón mã từ Google trả về (Public)
router.get("/google/callback", googleCallback);

// Cập nhật thông tin cá nhân (Private)
router.put("/profile", auth, updateProfile);

// Đổi mật khẩu (Private)
router.put("/change-password", auth, changePassword);

// Nâng cấp tài khoản (Private)
router.post("/upgrade", auth, upgradeAccount);

// Route kiểm tra phân quyền Admin (Private & Admin only)
router.get("/admin-only", auth, auth.isAdmin, (req, res) => {
  return res.status(200).json({
    success: true,
    message: "Truy cập thành công! Bạn có quyền quản trị viên.",
    data: {
      user: req.user,
    },
  });
});

module.exports = router;


