import axios from "axios";
import { API_BASE_URL } from "@/api/config";
import AsyncStorage from "@react-native-async-storage/async-storage";

// Khởi tạo instance Axios với cấu hình cơ bản
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000, // 10 giây - đủ thời gian cho backend xử lý DB operations
  headers: {
    "Content-Type": "application/json",
  },
});

apiClient.interceptors.request.use(async (config) => {
  const hasAuthorization = Boolean(config.headers?.Authorization);

  if (!hasAuthorization) {
    const token = await AsyncStorage.getItem("token");

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }

  return config;
});

// Hàm gắn Token JWT vào Header của mọi yêu cầu
export const setAuthToken = (token: string | null) => {
  if (token) {
    apiClient.defaults.headers.common["Authorization"] = `Bearer ${token}`;
  } else {
    delete apiClient.defaults.headers.common["Authorization"];
  }
};

/**
 * Các hàm API phục vụ luồng Authentication & Forgot Password.
 */
export const authService = {
  // Đăng nhập tài khoản
  login: async (email: string, password: string) => {
    try {
      const response = await apiClient.post("/auth/login", { email, password });
      return response.data;
    } catch (error: any) {
      throw error.response?.data || new Error("Không thể kết nối đến máy chủ.");
    }
  },

  // Đăng ký tài khoản mới
  register: async (userData: {
    fullName: string;
    email: string;
    password: string;
    phone?: string;
    gender?: string;
    dateOfBirth?: string;
  }) => {
    try {
      const response = await apiClient.post("/auth/register", userData);
      return response.data;
    } catch (error: any) {
      throw error.response?.data || new Error("Không thể kết nối đến máy chủ.");
    }
  },

  // Yêu cầu lấy lại mật khẩu (Gửi mã xác thực OTP)
  forgotPassword: async (email: string) => {
    try {
      const response = await apiClient.post("/auth/forgot-password", { email });
      return response.data;
    } catch (error: any) {
      throw error.response?.data || new Error("Không thể kết nối đến máy chủ.");
    }
  },

  // Kiểm tra mã OTP
  verifyCode: async (email: string, code: string) => {
    try {
      const response = await apiClient.post("/auth/verify-code", { email, code });
      return response.data;
    } catch (error: any) {
      throw error.response?.data || new Error("Mã xác thực không hợp lệ.");
    }
  },

  // Đặt lại mật khẩu mới
  resetPassword: async (email: string, code: string, newPassword: string) => {
    try {
      const response = await apiClient.post("/auth/reset-password", {
        email,
        code,
        newPassword,
      });
      return response.data;
    } catch (error: any) {
      throw error.response?.data || new Error("Không thể kết nối đến máy chủ.");
    }
  },

  // Đăng nhập bằng Google (Gửi thông tin lên Backend để lưu/đăng nhập thật)
  googleLogin: async (
    email: string,
    fullName: string,
    googleId: string,
    avatarUrl?: string
  ) => {
    try {
      const response = await apiClient.post("/auth/google-login", {
        email,
        fullName,
        googleId,
        avatarUrl: avatarUrl || null,
      });
      return response.data;
    } catch (error: any) {
      throw error.response?.data || new Error("Không thể kết nối đến máy chủ.");
    }
  },

  // Cập nhật thông tin cá nhân
  updateProfile: async (profileData: {
    fullName?: string;
    phone?: string;
    gender?: string;
    dateOfBirth?: string;
    avatarUrl?: string;
    bio?: string;
  }) => {
    try {
      const response = await apiClient.put("/auth/profile", profileData);
      return response.data;
    } catch (error: any) {
      throw error.response?.data || new Error("Không thể kết nối đến máy chủ.");
    }
  },

  // Đổi mật khẩu
  changePassword: async (passwordData: {
    currentPassword?: string;
    newPassword?: string;
  }) => {
    try {
      const response = await apiClient.put("/auth/change-password", passwordData);
      return response.data;
    } catch (error: any) {
      throw error.response?.data || new Error("Không thể kết nối đến máy chủ.");
    }
  },

  // Nâng cấp tài khoản
  upgradeAccount: async () => {
    try {
      const response = await apiClient.post("/auth/upgrade");
      return response.data;
    } catch (error: any) {
      throw error.response?.data || new Error("Không thể kết nối đến máy chủ.");
    }
  },
};

/**
 * Các hàm API phục vụ đánh giá ứng dụng.
 */
export const ratingService = {
  // Gửi đánh giá (mỗi tài khoản 1 lần)
  submit: async (rating: number, feedback?: string) => {
    try {
      const response = await apiClient.post("/ratings", { rating, feedback: feedback || null });
      return response.data;
    } catch (error: any) {
      throw error.response?.data || new Error("Không thể kết nối đến máy chủ.");
    }
  },

  // Kiểm tra tài khoản hiện tại đã đánh giá chưa
  getMyRating: async () => {
    try {
      const response = await apiClient.get("/ratings/me");
      return response.data;
    } catch (error: any) {
      throw error.response?.data || new Error("Không thể kết nối đến máy chủ.");
    }
  },
};

export default apiClient;
