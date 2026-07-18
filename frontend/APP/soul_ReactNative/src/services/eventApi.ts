import apiClient from "./api";

type RegistrationStatusFilter =
  | "all"
  | "registered"
  | "cancelled"
  | "not_checked_in"
  | "attended"
  | "absent";
type EventStatusFilter = "all" | "upcoming" | "ongoing" | "completed" | "cancelled";

export class EventApiError extends Error {
  status?: number;
  code?: string;
  data?: {
    registrationCount?: number;
    ratingCount?: number;
    suggestedAction?: "cancel" | "archive";
  };

  constructor(error: any, fallback: string) {
    super(getErrorMessage(error, fallback));
    this.name = "EventApiError";
    this.status = error.response?.status;
    this.code = error.response?.data?.code;
    this.data = error.response?.data?.data;
  }
}

const EVENT_ERROR_TRANSLATIONS: [RegExp, string][] = [
  [/invalid event id/i, "Mã sự kiện không hợp lệ"],
  [/event not found/i, "Không tìm thấy sự kiện"],
  [/title and startdatetime are required/i, "Vui lòng nhập tiêu đề và thời gian bắt đầu"],
  [/title cannot be empty/i, "Tiêu đề sự kiện không được để trống"],
  [/invalid event type/i, "Loại sự kiện không hợp lệ"],
  [/invalid event status/i, "Trạng thái sự kiện không hợp lệ"],
  [/capacity must be/i, "Sức chứa phải là số nguyên không âm"],
  [/capacity cannot be lower/i, "Sức chứa không thể nhỏ hơn số người đã đăng ký"],
  [/invalid startdatetime/i, "Thời gian bắt đầu không hợp lệ"],
  [/invalid enddatetime/i, "Thời gian kết thúc không hợp lệ"],
  [/enddatetime must be after/i, "Thời gian kết thúc phải sau thời gian bắt đầu"],
  [/server error/i, "Máy chủ đang gặp sự cố. Vui lòng thử lại sau"],
];

const getErrorMessage = (error: any, fallback: string) => {
  const rawMessage = String(error.response?.data?.message || error.message || "").trim();
  const translated = EVENT_ERROR_TRANSLATIONS.find(([pattern]) => pattern.test(rawMessage));
  if (translated) return translated[1];
  if (!rawMessage) return fallback;

  // Never expose an unhandled English backend message directly in the UI.
  return /^[\x00-\x7F]*$/.test(rawMessage) ? fallback : rawMessage;
};

const fetchEvents = async (params?: {
  status?: EventStatusFilter;
  eventType?: string;
  page?: number;
  limit?: number;
}) => {
  const query = {
    ...params,
    status: params?.status === "all" ? undefined : params?.status,
  };

  const response = await apiClient.get("/events", { params: query });
  return response.data;
};

export const eventAdminService = {
  getDashboardStatistics: async () => {
    const response = await apiClient.get("/admin/events/statistics");
    return response.data;
  },
  getEvents: async (archiveStatus: "active" | "archived" | "all" = "active") => {
    try {
      const response = await apiClient.get("/admin/events", {
        params: { archiveStatus, limit: 200 },
      });
      return response.data;
    } catch (error: any) {
      const errMsg = getErrorMessage(error, "Khong the tai danh sach su kien");
      const errStatus = error.response?.status;
      console.error(`[EventAPI] getEvents loi ${errStatus}:`, errMsg);
      throw new EventApiError(error, errMsg);
    }
  },

  getEventById: async (id: string) => {
    try {
      const response = await apiClient.get(`/admin/events/${id}`);
      return response.data;
    } catch (error: any) {
      const errMsg = getErrorMessage(error, "Khong the tai chi tiet su kien");
      const errStatus = error.response?.status;
      console.error(`[EventAPI] getEventById loi ${errStatus}:`, errMsg);
      throw new Error(errMsg);
    }
  },

  getEventRegistrations: async (
    id: string,
    status: RegistrationStatusFilter = "all"
  ) => {
    try {
      const response = await apiClient.get(`/events/${id}/registrations`, {
        params: { status, limit: 100 },
      });
      return response.data;
    } catch (error: any) {
      const errMsg = getErrorMessage(
        error,
        "Khong the tai danh sach nguoi dang ky"
      );
      const errStatus = error.response?.status;
      console.error(`[EventAPI] getEventRegistrations loi ${errStatus}:`, errMsg);
      throw new Error(errMsg);
    }
  },

  updateAttendance: async (
    eventId: string,
    userId: string,
    attendanceStatus: "not_checked_in" | "attended" | "absent",
    reason = ""
  ) => {
    try {
      const response = await apiClient.patch(
        `/admin/events/${eventId}/participants/${userId}/attendance`,
        { attendanceStatus, reason }
      );
      return response.data;
    } catch (error: any) {
      const errMsg = getErrorMessage(error, "Khong the cap nhat tham du");
      throw new Error(errMsg);
    }
  },

  createEvent: async (eventData: any) => {
    try {
      const response = await apiClient.post("/events", eventData);
      return response.data;
    } catch (error: any) {
      const errMsg = getErrorMessage(error, "Khong the tao su kien");
      const errStatus = error.response?.status;
      console.error(`[EventAPI] createEvent loi ${errStatus}:`, errMsg);
      throw new Error(errMsg);
    }
  },

  updateEvent: async (id: string, eventData: any) => {
    try {
      const response = await apiClient.patch(`/events/${id}`, eventData);
      return response.data;
    } catch (error: any) {
      const errMsg = getErrorMessage(error, "Khong the cap nhat su kien");
      const errStatus = error.response?.status;
      console.error(`[EventAPI] updateEvent loi ${errStatus}:`, errMsg);
      throw new Error(errMsg);
    }
  },

  deleteEvent: async (id: string) => {
    try {
      const response = await apiClient.delete(`/events/${id}`);
      return response.data;
    } catch (error: any) {
      const errMsg = getErrorMessage(error, "Khong the xoa su kien");
      const errStatus = error.response?.status;
      console.error(`[EventAPI] deleteEvent loi ${errStatus}:`, errMsg);
      throw new EventApiError(error, errMsg);
    }
  },

  getAttendanceAudits: async (eventId: string, page = 1, limit = 50) => {
    try {
      const response = await apiClient.get(`/admin/events/${eventId}/attendance-audits`, {
        params: { page, limit },
      });
      return response.data;
    } catch (error: any) {
      throw new EventApiError(error, "Không thể tải lịch sử điểm danh");
    }
  },

  archiveEvent: async (id: string) => {
    try {
      const response = await apiClient.patch(`/admin/events/${id}/archive`);
      return response.data;
    } catch (error: any) {
      throw new EventApiError(error, "Không thể lưu trữ sự kiện");
    }
  },

  restoreEvent: async (id: string) => {
    try {
      const response = await apiClient.patch(`/admin/events/${id}/restore`);
      return response.data;
    } catch (error: any) {
      throw new EventApiError(error, "Không thể khôi phục sự kiện");
    }
  },

  cancelEvent: async (id: string, reason: string) => {
    try {
      const response = await apiClient.patch(`/admin/events/${id}/cancel`, { reason });
      return response.data;
    } catch (error: any) {
      throw new EventApiError(error, "Không thể hủy sự kiện");
    }
  },
};

export const eventUserService = {
  getEvents: async (params?: {
    status?: EventStatusFilter;
    eventType?: string;
    page?: number;
    limit?: number;
  }) => {
    try {
      return await fetchEvents(params);
    } catch (error: any) {
      const errMsg = getErrorMessage(error, "Khong the tai danh sach su kien");
      const errStatus = error.response?.status;
      console.error(`[EventAPI] user getEvents loi ${errStatus}:`, errMsg);
      throw new Error(errMsg);
    }
  },

  getEventById: async (id: string) => {
    try {
      const response = await apiClient.get(`/events/${id}`);
      return response.data;
    } catch (error: any) {
      const errMsg = getErrorMessage(error, "Khong the tai chi tiet su kien");
      const errStatus = error.response?.status;
      console.error(`[EventAPI] user getEventById loi ${errStatus}:`, errMsg);
      throw new Error(errMsg);
    }
  },

  getRegisteredEvents: async (
    status: RegistrationStatusFilter = "all",
    page = 1,
    limit = 100,
    search = ""
  ) => {
    try {
      const response = await apiClient.get("/events/me/registered", {
        params: { status, page, limit, search: search || undefined },
      });
      return response.data;
    } catch (error: any) {
      const errMsg = getErrorMessage(
        error,
        "Khong the tai danh sach su kien da dang ky"
      );
      const errStatus = error.response?.status;
      console.error(`[EventAPI] user getRegisteredEvents loi ${errStatus}:`, errMsg);
      throw new Error(errMsg);
    }
  },

  registerEvent: async (id: string) => {
    try {
      const response = await apiClient.post(`/events/${id}/register`);
      return response.data;
    } catch (error: any) {
      const errMsg = getErrorMessage(error, "Khong the dang ky su kien");
      const errStatus = error.response?.status;
      console.error(`[EventAPI] user registerEvent loi ${errStatus}:`, errMsg);
      throw new Error(errMsg);
    }
  },

  cancelRegistration: async (id: string) => {
    try {
      const response = await apiClient.post(`/events/${id}/cancel`);
      return response.data;
    } catch (error: any) {
      const errMsg = getErrorMessage(error, "Khong the huy dang ky su kien");
      const errStatus = error.response?.status;
      console.error(`[EventAPI] user cancelRegistration loi ${errStatus}:`, errMsg);
      throw new Error(errMsg);
    }
  },
};
