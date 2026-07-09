import { create } from "zustand";
import { authService, setAuthToken } from "@/services/api";
import AsyncStorage from "@react-native-async-storage/async-storage";

// Định nghĩa giao diện TypeScript cho dữ liệu người dùng
interface User {
  _id: string;
  fullName: string;
  email: string;
  role: string;
  status: string;
  phone?: string;
  gender?: string;
  dateOfBirth?: string;
  avatarUrl?: string;
  bio?: string;
  isPremium?: boolean;
}

// Định nghĩa giao diện trạng thái quản lý của Zustand Store
interface AuthState {
  user: User | null;
  token: string | null;
  isLoggedIn: boolean;

  // Lưu trữ dữ liệu tạm thời phục vụ tiến trình khôi phục mật khẩu qua các màn hình
  forgotEmail: string | null;
  forgotCode: string | null;

  // Các hành động Authentication
  login: (email: string, password: string) => Promise<{ success: boolean; message: string }>;
  register: (userData: {
    fullName: string;
    email: string;
    password: string;
    phone?: string;
    gender?: string;
    dateOfBirth?: string;
  }) => Promise<{ success: boolean; message: string }>;
  loginWithGoogle: (
    email: string,
    fullName: string,
    googleId: string,
    avatarUrl?: string
  ) => Promise<{ success: boolean; message: string }>;
  setSession: (token: string, user: User) => Promise<void> | void;
  updateProfile: (profileData: {
    fullName?: string;
    phone?: string;
    gender?: string;
    dateOfBirth?: string;
    avatarUrl?: string;
    bio?: string;
  }) => Promise<{ success: boolean; message: string }>;
  changePassword: (passwordData: {
    currentPassword?: string;
    newPassword?: string;
  }) => Promise<{ success: boolean; message: string }>;
  logout: () => Promise<void> | void;
  upgradeAccount: () => Promise<{ success: boolean; message: string }>;

  // Các hành động Khôi phục mật khẩu (Forgot Password)
  setForgotEmail: (email: string) => void;
  setForgotCode: (code: string) => void;
  requestOtp: (email: string) => Promise<{ success: boolean; message: string; code?: string }>;
  verifyOtp: (code: string) => Promise<{ success: boolean; message: string }>;
  resetPass: (newPassword: string) => Promise<{ success: boolean; message: string }>;
}

// Tạo Zustand Store để quản lý Auth State toàn cục
export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  token: null,
  isLoggedIn: false,
  
  forgotEmail: null,
  forgotCode: null,

  // Xử lý Đăng nhập
  login: async (email, password) => {
    try {
      const response = await authService.login(email, password);
      if (response.success && response.data) {
        const { token, user } = response.data;
        
        // Lưu token vào bộ nhớ thiết bị
        await AsyncStorage.setItem("token", token);
        
        // Thiết lập header Authorization trong axios client
        setAuthToken(token);
        
        set({
          user,
          token,
          isLoggedIn: true,
        });
        return { success: true, message: response.message };
      }
      return { success: false, message: response.message || "Đăng nhập thất bại." };
    } catch (error: any) {
      return { success: false, message: error.message || "Đăng nhập thất bại do lỗi mạng." };
    }
  },

  // Xử lý Đăng ký
  register: async (userData) => {
    try {
      const response = await authService.register(userData);
      if (response.success) {
        return { success: true, message: response.message };
      }
      return { success: false, message: response.message || "Đăng ký thất bại." };
    } catch (error: any) {
      return { success: false, message: error.message || "Đăng ký thất bại do lỗi mạng." };
    }
  },

  // Xử lý Đăng nhập / Đăng ký bằng Google
  loginWithGoogle: async (email, fullName, googleId, avatarUrl) => {
    try {
      const response = await authService.googleLogin(email, fullName, googleId, avatarUrl);
      if (response.success && response.data) {
        const { token, user } = response.data;
        
        // Lưu token vào bộ nhớ thiết bị
        await AsyncStorage.setItem("token", token);
        
        // Gắn JWT token vào axios header
        setAuthToken(token);
        
        set({
          user,
          token,
          isLoggedIn: true,
        });
        return { success: true, message: response.message };
      }
      return { success: false, message: response.message || "Đăng nhập Google thất bại." };
    } catch (error: any) {
      return { success: false, message: error.message || "Đăng nhập Google thất bại." };
    }
  },

  // Lưu trực tiếp session đăng nhập từ Deep Link
  setSession: async (token, user) => {
    try {
      await AsyncStorage.setItem("token", token);
    } catch (e) {
      console.warn("Lỗi lưu token vào AsyncStorage khi setSession:", e);
    }
    setAuthToken(token);
    set({
      user,
      token,
      isLoggedIn: true,
    });
  },

  // Cập nhật thông tin cá nhân
  updateProfile: async (profileData) => {
    try {
      const response = await authService.updateProfile(profileData);
      if (response.success && response.data) {
        const currentUser = get().user;
        const updatedUser = {
          ...currentUser,
          ...response.data.user,
        } as User;
        
        set({ user: updatedUser });
        return { success: true, message: response.message || "Cập nhật thành công." };
      }
      return { success: false, message: response.message || "Cập nhật profile thất bại." };
    } catch (error: any) {
      return { success: false, message: error.message || "Cập nhật profile thất bại." };
    }
  },

  // Đổi mật khẩu
  changePassword: async (passwordData) => {
    try {
      const response = await authService.changePassword(passwordData);
      if (response.success) {
        return { success: true, message: response.message || "Đổi mật khẩu thành công." };
      }
      return { success: false, message: response.message || "Đổi mật khẩu thất bại." };
    } catch (error: any) {
      return { success: false, message: error.message || "Đổi mật khẩu thất bại." };
    }
  },

  // Xử lý Đăng xuất
  logout: async () => {
    try {
      await AsyncStorage.removeItem("token");
    } catch (e) {
      console.warn("Lỗi xóa token khỏi AsyncStorage khi logout:", e);
    }
    setAuthToken(null);
    set({ user: null, token: null, isLoggedIn: false });
  },

  upgradeAccount: async () => {
    try {
      const response = await authService.upgradeAccount();
      if (response.success && response.data) {
        set({ user: response.data });
        return { success: true, message: response.message };
      }
      return { success: false, message: response.message || "Lỗi nâng cấp." };
    } catch (error: any) {
      return { success: false, message: error.message || "Lỗi nâng cấp." };
    }
  },

  // Lưu email trong tiến trình quên mật khẩu
  setForgotEmail: (email) => set({ forgotEmail: email }),
  
  // Lưu mã OTP trong tiến trình quên mật khẩu
  setForgotCode: (code) => set({ forgotCode: code }),

  // Gửi email yêu cầu mã khôi phục OTP
  requestOtp: async (email) => {
    try {
      const response = await authService.forgotPassword(email);
      if (response.success) {
        set({ forgotEmail: email, forgotCode: response.code || null });
        return { success: true, message: response.message, code: response.code };
      }
      return { success: false, message: response.message || "Không thể yêu cầu mã OTP." };
    } catch (error: any) {
      return { success: false, message: error.message || "Gửi yêu cầu thất bại." };
    }
  },

  // Xác thực mã OTP
  verifyOtp: async (code) => {
    try {
      const email = get().forgotEmail;
      if (!email) {
        return { success: false, message: "Thiếu địa chỉ email khôi phục." };
      }
      const response = await authService.verifyCode(email, code);
      if (response.success) {
        set({ forgotCode: code });
        return { success: true, message: response.message };
      }
      return { success: false, message: response.message || "Mã xác thực không đúng." };
    } catch (error: any) {
      return { success: false, message: error.message || "Xác thực mã thất bại." };
    }
  },

  // Đặt lại mật khẩu mới
  resetPass: async (newPassword) => {
    try {
      const email = get().forgotEmail;
      const code = get().forgotCode;
      if (!email || !code) {
        return { success: false, message: "Tiến trình khôi phục không hợp lệ." };
      }
      const response = await authService.resetPassword(email, code, newPassword);
      if (response.success) {
        // Đặt lại thành công, làm sạch dữ liệu tiến trình khôi phục
        set({ forgotEmail: null, forgotCode: null });
        return { success: true, message: response.message };
      }
      return { success: false, message: response.message || "Đặt lại mật khẩu thất bại." };
    } catch (error: any) {
      return { success: false, message: error.message || "Đặt lại mật khẩu thất bại." };
    }
  },
}));
