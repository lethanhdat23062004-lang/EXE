const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const axios = require("axios");
const User = require("../models/User");
const TokenBlacklist = require("../models/TokenBlacklist");
const { createNotification } = require("../services/notificationService");

// Generate JWT Helper
const generateToken = (userId) => {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: "7d", // Token valid for 7 days
  });
};

/**
 * @desc    Đăng ký tài khoản người dùng mới
 * @route   POST /api/auth/register
 * @access  Public
 */
const register = async (req, res) => {
  try {
    const { fullName, email, password, phone, gender, dateOfBirth } = req.body;

    // 1. Kiểm tra các trường bắt buộc
    if (!fullName || !email || !password) {
      return res.status(400).json({
        success: false,
        message: "Vui lòng nhập đầy đủ họ tên, email và mật khẩu.",
      });
    }

    // 2. Kiểm tra email định dạng hợp lệ
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        message: "Định dạng email không hợp lệ.",
      });
    }

    // 3. Kiểm tra độ dài mật khẩu
    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: "Mật khẩu phải có ít nhất 6 ký tự.",
      });
    }

    // 4. Kiểm tra xem email đã tồn tại chưa
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({
        success: false,
        message: "Email này đã được sử dụng để đăng ký tài khoản khác.",
      });
    }

    // 5. Kiểm tra xem số điện thoại đã tồn tại chưa (nếu có)
    if (phone) {
      const phoneExists = await User.findOne({ phone });
      if (phoneExists) {
        return res.status(400).json({
          success: false,
          message: "Số điện thoại này đã được sử dụng.",
        });
      }
    }

    // 6. Mã hóa mật khẩu sử dụng bcryptjs
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // 7. Tạo người dùng mới
    const userFields = {
      fullName,
      email,
      passwordHash,
      role: "user",
      status: "active",
      isEmailVerified: false,
    };

    if (phone) {
      userFields.phone = phone;
    }
    if (gender) {
      userFields.gender = gender;
    }
    if (dateOfBirth) {
      userFields.dateOfBirth = new Date(dateOfBirth);
    }

    const newUser = await User.create(userFields);

    // 8. Tạo JWT token
    const token = generateToken(newUser._id);

    // 9. Gửi thông báo chào mừng (không chặn response nếu lỗi)
    createNotification(
      newUser._id,
      "welcome",
      "Chào mừng bạn đến với SOUL! 🎉",
      `Xin chào ${newUser.fullName}! Hành trình chăm sóc sức khỏe tâm thần của bạn bắt đầu từ đây. Hãy khám phá các tính năng của SOUL nhé.`
    );

    // 10. Trả về kết quả (toJSON đã tự động xóa passwordHash)
    return res.status(201).json({
      success: true,
      message: "Đăng ký tài khoản thành công.",
      data: {
        user: newUser,
        token,
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Lỗi hệ thống khi đăng ký tài khoản: " + error.message,
    });
  }
};

/**
 * @desc    Đăng nhập tài khoản
 * @route   POST /api/auth/login
 * @access  Public
 */
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // 1. Kiểm tra đầu vào
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Vui lòng nhập đầy đủ email và mật khẩu.",
      });
    }

    // 2. Tìm người dùng bằng email
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Email hoặc mật khẩu không chính xác.",
      });
    }

    // 3. Kiểm tra trạng thái tài khoản
    if (user.status === "blocked") {
      return res.status(403).json({
        success: false,
        message: "Tài khoản của bạn đã bị khóa. Vui lòng liên hệ quản trị viên.",
      });
    }

    // 4. So sánh mật khẩu bằng bcryptjs
    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: "Email hoặc mật khẩu không chính xác.",
      });
    }

    // 5. Cập nhật thời gian đăng nhập cuối cùng
    user.lastLoginAt = new Date();
    await user.save();

    // 6. Tạo JWT token
    const token = generateToken(user._id);

    // 7. Thông báo đăng nhập thành công
    createNotification(
      user._id,
      "system",
      "Đăng nhập thành công",
      `Chào mừng trở lại, ${user.fullName}! Bạn vừa đăng nhập lúc ${new Date().toLocaleTimeString("vi-VN")}.`
    );

    return res.status(200).json({
      success: true,
      message: "Đăng nhập thành công.",
      data: {
        user,
        token,
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Lỗi hệ thống khi đăng nhập: " + error.message,
    });
  }
};

/**
 * @desc    Lấy thông tin cá nhân hiện tại
 * @route   GET /api/auth/me
 * @access  Private (Cần Token)
 */
const getProfile = async (req, res) => {
  try {
    return res.status(200).json({
      success: true,
      message: "Lấy thông tin cá nhân thành công.",
      data: {
        user: req.user,
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Lỗi hệ thống khi lấy thông tin cá nhân: " + error.message,
    });
  }
};

/**
 * @desc    Đăng xuất tài khoản (vô hiệu hóa token phía Server)
 * @route   POST /api/auth/logout
 * @access  Private (Cần Token)
 * @note    Hoạt động tốt cho cả Mobile App (Flutter) và Web.
 *          Sau khi gọi API này:
 *            - Mobile: xóa token khỏi Secure Storage.
 *            - Web: xóa token khỏi localStorage/sessionStorage/cookie.
 */
const logout = async (req, res) => {
  try {
    const token = req.token;
    const tokenExp = req.tokenExp; // Unix timestamp (giây) từ JWT payload

    // Chuyển đổi thời gian hết hạn từ Unix timestamp sang Date object
    const expiresAt = new Date(tokenExp * 1000);

    // Thêm token vào danh sách đen (blacklist)
    // Nếu token đã có trong blacklist (đăng xuất trùng), bỏ qua lỗi duplicate
    await TokenBlacklist.findOneAndUpdate(
      { token },
      { token, userId: req.user._id, expiresAt },
      { upsert: true, returnDocument: "after" }
    );

    return res.status(200).json({
      success: true,
      message: "Đăng xuất thành công. Hẹn gặp lại bạn!",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Lỗi hệ thống khi đăng xuất: " + error.message,
    });
  }
};

/**
 * @desc    Yêu cầu đặt lại mật khẩu (Quên mật khẩu)
 * @route   POST /api/auth/forgot-password
 * @access  Public
 */
const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Vui lòng nhập địa chỉ email.",
      });
    }

    // Tìm người dùng bằng email
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy tài khoản với email này.",
      });
    }

    // Tạo mã xác thực 4 chữ số ngẫu nhiên
    const code = Math.floor(1000 + Math.random() * 9000).toString();

    // Lưu mã xác thực và thời gian hết hạn (10 phút) vào database
    user.resetCode = code;
    user.resetCodeExpires = new Date(Date.now() + 10 * 60 * 1000);
    await user.save();

    console.log(`[FORGOT PASSWORD] Mã xác thực cho ${email} là: ${code}`);

    return res.status(200).json({
      success: true,
      message: "Mã xác thực đã được gửi thành công.",
      code, // Trả về kèm code trong môi trường test/development để frontend dễ mock
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Lỗi hệ thống khi xử lý quên mật khẩu: " + error.message,
    });
  }
};

/**
 * @desc    Xác thực mã khôi phục mật khẩu
 * @route   POST /api/auth/verify-code
 * @access  Public
 */
const verifyCode = async (req, res) => {
  try {
    const { email, code } = req.body;

    if (!email || !code) {
      return res.status(400).json({
        success: false,
        message: "Vui lòng nhập đầy đủ email và mã xác thực.",
      });
    }

    const user = await User.findOne({
      email,
      resetCode: code,
      resetCodeExpires: { $gt: new Date() }, // Kiểm tra mã chưa hết hạn
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: "Mã xác thực không hợp lệ hoặc đã hết hạn.",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Xác thực mã thành công.",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Lỗi hệ thống khi xác thực mã: " + error.message,
    });
  }
};

/**
 * @desc    Đặt lại mật khẩu mới
 * @route   POST /api/auth/reset-password
 * @access  Public
 */
const resetPassword = async (req, res) => {
  try {
    const { email, code, newPassword } = req.body;

    if (!email || !code || !newPassword) {
      return res.status(400).json({
        success: false,
        message: "Vui lòng cung cấp đầy đủ email, mã xác thực và mật khẩu mới.",
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: "Mật khẩu phải có ít nhất 6 ký tự.",
      });
    }

    const user = await User.findOne({
      email,
      resetCode: code,
      resetCodeExpires: { $gt: new Date() },
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: "Mã xác thực không hợp lệ hoặc đã hết hạn.",
      });
    }

    // Mã hóa mật khẩu mới sử dụng bcryptjs
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(newPassword, salt);

    // Cập nhật mật khẩu mới và xoá mã xác thực
    user.passwordHash = passwordHash;
    user.resetCode = null;
    user.resetCodeExpires = null;
    await user.save();

    return res.status(200).json({
      success: true,
      message: "Đặt lại mật khẩu thành công. Vui lòng đăng nhập lại.",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Lỗi hệ thống khi đặt lại mật khẩu: " + error.message,
    });
  }
};

/**
 * @desc    Đăng nhập hoặc đăng ký bằng tài khoản Google (OAuth)
 * @route   POST /api/auth/google-login
 * @access  Public
 */
const googleLogin = async (req, res) => {
  try {
    const { email, fullName, googleId, avatarUrl } = req.body;

    if (!email || !fullName || !googleId) {
      return res.status(400).json({
        success: false,
        message: "Vui lòng cung cấp đầy đủ email, họ tên và googleId.",
      });
    }

    // 1. Kiểm tra xem người dùng đã tồn tại bằng email hoặc googleId chưa
    let user = await User.findOne({ $or: [{ googleId }, { email }] });

    if (user) {
      // Nếu người dùng đã tồn tại bằng email nhưng chưa có googleId (đăng ký thường từ trước), liên kết tài khoản
      let isUpdated = false;
      if (!user.googleId) {
        user.googleId = googleId;
        isUpdated = true;
      }
      if (avatarUrl && !user.avatarUrl) {
        user.avatarUrl = avatarUrl;
        isUpdated = true;
      }
      
      user.lastLoginAt = new Date();
      await user.save();

      // Tạo JWT token cho phiên đăng nhập
      const token = generateToken(user._id);

      return res.status(200).json({
        success: true,
        message: isUpdated 
          ? "Liên kết tài khoản và đăng nhập bằng Google thành công." 
          : "Đăng nhập bằng Google thành công.",
        data: {
          user,
          token,
        },
      });
    }

    // 2. Nếu người dùng chưa tồn tại, tự động đăng ký tài khoản mới bằng thông tin Google
    // Sinh mật khẩu ngẫu nhiên và băm mật khẩu
    const randomPassword = Math.random().toString(36).substring(2, 10);
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(randomPassword, salt);

    const newUser = await User.create({
      fullName,
      email,
      passwordHash,
      googleId,
      avatarUrl: avatarUrl || null,
      role: "user",
      status: "active",
      isEmailVerified: true, // Tài khoản của Google được xem là đã xác minh email sẵn
      emailVerifiedAt: new Date(),
      lastLoginAt: new Date(),
    });

    // Tạo JWT token cho tài khoản mới
    const token = generateToken(newUser._id);

    return res.status(201).json({
      success: true,
      message: "Tạo tài khoản mới và đăng nhập bằng Google thành công.",
      data: {
        user: newUser,
        token,
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Lỗi hệ thống khi đăng nhập bằng Google: " + error.message,
    });
  }
};

/**
 * @desc    Khởi động luồng Google OAuth2 (Chuyển hướng người dùng)
 * @route   GET /api/auth/google
 * @access  Public
 */
const initiateGoogleAuth = async (req, res) => {
  try {
    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    const callbackUrl = process.env.GOOGLE_CALLBACK_URL;

    // Nếu chưa cấu hình Client ID/Secret trong .env, báo lỗi
    if (!clientId || !clientSecret || clientId === "YOUR_GOOGLE_CLIENT_ID") {
      console.error("[Google OAuth] Lỗi: Chưa cấu hình biến môi trường GOOGLE_CLIENT_ID hoặc GOOGLE_CLIENT_SECRET trong file .env!");
      return res.status(400).send(
        "<h3>Lỗi cấu hình OAuth phía Server</h3><p>Vui lòng cấu hình các trường GOOGLE_CLIENT_ID và GOOGLE_CLIENT_SECRET trong file .env của Backend để tiếp tục đăng nhập bằng Google thật.</p>"
      );
    }

    // Luồng OAuth2 thật: Chuyển hướng tới Google accounts
    const googleAuthUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${encodeURIComponent(callbackUrl)}&response_type=code&scope=profile%20email&prompt=select_account`;
    return res.redirect(googleAuthUrl);
  } catch (error) {
    return res.status(500).send("Lỗi khởi động Google Auth: " + error.message);
  }
};

/**
 * @desc    Xử lý nhận callback từ Google OAuth2 và chuyển tiếp về Mobile bằng Deep Linking
 * @route   GET /api/auth/google/callback
 * @access  Public
 */
const googleCallback = async (req, res) => {
  try {
    const { code } = req.query;

    if (!code) {
      return res.status(400).send("Thiếu OAuth code.");
    }

    // Luồng thật: Trao đổi code lấy access_token
    const tokenResponse = await axios.post("https://oauth2.googleapis.com/token", {
      code,
      client_id: process.env.GOOGLE_CLIENT_ID,
      client_secret: process.env.GOOGLE_CLIENT_SECRET,
      redirect_uri: process.env.GOOGLE_CALLBACK_URL,
      grant_type: "authorization_code",
    });

    const { access_token } = tokenResponse.data;

    // Lấy thông tin hồ sơ của người dùng từ Google
    const userinfoResponse = await axios.get("https://www.googleapis.com/oauth2/v3/userinfo", {
      headers: { Authorization: `Bearer ${access_token}` },
    });

    const profile = userinfoResponse.data;
    const email = profile.email;
    const fullName = profile.name;
    const googleId = profile.sub;
    const avatarUrl = profile.picture;

    // 2. Tìm kiếm hoặc tạo tài khoản trong cơ sở dữ liệu MongoDB thật
    let user = await User.findOne({ $or: [{ googleId }, { email }] });

    if (user) {
      // Cập nhật thông tin định danh Google nếu cần thiết
      let isUpdated = false;
      if (!user.googleId) {
        user.googleId = googleId;
        isUpdated = true;
      }
      if (avatarUrl && !user.avatarUrl) {
        user.avatarUrl = avatarUrl;
        isUpdated = true;
      }
      user.lastLoginAt = new Date();
      await user.save();
    } else {
      // Đăng ký tài khoản Google mới trong Database
      const randomPassword = Math.random().toString(36).substring(2, 10);
      const salt = await bcrypt.genSalt(10);
      const passwordHash = await bcrypt.hash(randomPassword, salt);

      user = await User.create({
        fullName,
        email,
        passwordHash,
        googleId,
        avatarUrl: avatarUrl || null,
        role: "user",
        status: "active",
        isEmailVerified: true,
        emailVerifiedAt: new Date(),
        lastLoginAt: new Date(),
      });
    }

    // 3. Tạo JWT token
    const token = generateToken(user._id);

    // 4. Chuyển hướng người dùng về App di động thông qua Deep Link (soulreactnative://)
    const deepLinkUrl = `soulreactnative://login-success?token=${token}&user=${encodeURIComponent(JSON.stringify(user))}`;
    console.log("[Google OAuth] Thành công. Chuyển hướng về App di động:", deepLinkUrl);
    return res.redirect(deepLinkUrl);
  } catch (error) {
    console.error("[Google OAuth Callback Error]:", error.response?.data || error.message);
    return res.status(500).send("Lỗi xử lý Google OAuth Callback: " + (error.response?.data?.error_description || error.message));
  }
};

/**
 * @desc    Cập nhật thông tin cá nhân người dùng
 * @route   PUT /api/auth/profile
 * @access  Private (Cần Token)
 */
const updateProfile = async (req, res) => {
  try {
    const { fullName, phone, gender, dateOfBirth, avatarUrl, bio } = req.body;
    const userId = req.user._id;

    // Tìm người dùng trong DB
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy người dùng.",
      });
    }

    // Nếu cập nhật số điện thoại, kiểm tra xem số điện thoại đã được người khác sử dụng chưa
    if (phone && phone !== user.phone) {
      const phoneExists = await User.findOne({ phone, _id: { $ne: userId } });
      if (phoneExists) {
        return res.status(400).json({
          success: false,
          message: "Số điện thoại này đã được sử dụng bởi tài khoản khác.",
        });
      }
      user.phone = phone;
    }

    // Cập nhật các trường thông tin khác
    if (fullName) user.fullName = fullName;
    if (gender !== undefined) user.gender = gender;
    if (dateOfBirth !== undefined) user.dateOfBirth = dateOfBirth ? new Date(dateOfBirth) : null;
    if (avatarUrl !== undefined) user.avatarUrl = avatarUrl;
    if (bio !== undefined) user.bio = bio;

    await user.save();

    return res.status(200).json({
      success: true,
      message: "Cập nhật thông tin cá nhân thành công.",
      data: {
        user,
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Lỗi hệ thống khi cập nhật thông tin cá nhân: " + error.message,
    });
  }
};

/**
 * @desc    Đổi mật khẩu tài khoản
 * @route   PUT /api/auth/change-password
 * @access  Private (Cần Token)
 */
const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const userId = req.user._id;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: "Vui lòng nhập mật khẩu hiện tại và mật khẩu mới.",
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: "Mật khẩu mới phải có ít nhất 6 ký tự.",
      });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy người dùng.",
      });
    }

    // Nếu người dùng đăng nhập bằng Google và chưa thiết lập mật khẩu thì sao?
    // user.passwordHash có thể rỗng hoặc không có
    const isMatch = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: "Mật khẩu hiện tại không đúng.",
      });
    }

    // Kiểm tra mật khẩu mới không được trùng với mật khẩu hiện tại
    const isSame = await bcrypt.compare(newPassword, user.passwordHash);
    if (isSame) {
      return res.status(400).json({
        success: false,
        message: "Mật khẩu mới không được trùng với mật khẩu hiện tại.",
      });
    }

    // Mã hóa mật khẩu mới
    const salt = await bcrypt.genSalt(10);
    user.passwordHash = await bcrypt.hash(newPassword, salt);
    await user.save();

    return res.status(200).json({
      success: true,
      message: "Đổi mật khẩu thành công.",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Lỗi hệ thống khi đổi mật khẩu: " + error.message,
    });
  }
};

const upgradeAccount = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    user.isPremium = true;
    await user.save();

    return res.status(200).json({
      success: true,
      message: "Nâng cấp tài khoản thành công",
      data: user,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Lỗi nâng cấp tài khoản: " + error.message,
    });
  }
};

module.exports = {
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
};



