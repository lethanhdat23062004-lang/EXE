import apiClient from "@/services/api";

export type RatingStatus = "visible" | "hidden";
export type RatingSort = "newest" | "oldest" | "highest" | "lowest";

export type RatingSummary = {
  average: number;
  total: number;
  distribution: Record<1 | 2 | 3 | 4 | 5, number>;
};

export type EventRating = {
  _id: string;
  eventId: string | { _id: string; title: string; startDateTime?: string };
  userId: string | { _id: string; fullName: string; email?: string; avatarUrl?: string };
  rating: number;
  comment: string;
  status: RatingStatus;
  hiddenReason?: "spam" | "offensive" | "advertisement" | "other" | null;
  hiddenNote?: string | null;
  createdAt: string;
  updatedAt: string;
};

const errorMessage = (error: any, fallback: string) =>
  error.response?.data?.message || error.message || fallback;

export const ratingService = {
  getEventRatings: async (
    eventId: string,
    params?: { rating?: number; sort?: RatingSort; page?: number; limit?: number }
  ) => {
    const response = await apiClient.get(`/events/${eventId}/ratings`, { params });
    return response.data;
  },

  getSummary: async (eventId: string) => {
    const response = await apiClient.get(`/events/${eventId}/rating-summary`);
    return response.data;
  },

  getMyRating: async (eventId: string) => {
    const response = await apiClient.get("/ratings/me", {
      params: { eventId, limit: 1 },
    });
    return response.data;
  },

  submit: async (eventId: string, rating: number, comment: string) => {
    try {
      const response = await apiClient.post(`/events/${eventId}/ratings`, {
        rating,
        comment,
      });
      return response.data;
    } catch (error: any) {
      throw new Error(errorMessage(error, "Không thể gửi đánh giá"));
    }
  },

  update: async (eventId: string, rating: number, comment: string) => {
    try {
      const response = await apiClient.patch(`/events/${eventId}/my-rating`, {
        rating,
        comment,
      });
      return response.data;
    } catch (error: any) {
      throw new Error(errorMessage(error, "Không thể cập nhật đánh giá"));
    }
  },
};

export const adminRatingService = {
  getRatings: async (params?: {
    search?: string;
    status?: "all" | RatingStatus;
    rating?: number;
    sort?: RatingSort;
    eventId?: string;
    page?: number;
    limit?: number;
  }) => {
    const response = await apiClient.get("/admin/ratings", {
      params: { ...params, status: params?.status === "all" ? undefined : params?.status },
    });
    return response.data;
  },

  getStatistics: async (eventId?: string) => {
    const response = await apiClient.get("/admin/ratings/statistics", {
      params: { eventId: eventId || undefined },
    });
    return response.data;
  },

  getDetail: async (id: string) => {
    const response = await apiClient.get(`/admin/ratings/${id}`);
    return response.data;
  },

  hide: async (id: string, reason: string, note?: string) => {
    const response = await apiClient.patch(`/admin/ratings/${id}/hide`, {
      reason,
      note,
    });
    return response.data;
  },

  restore: async (id: string) => {
    const response = await apiClient.patch(`/admin/ratings/${id}/restore`);
    return response.data;
  },

  exportCsv: async () => {
    const response = await apiClient.get("/admin/ratings/export.csv", {
      responseType: "text",
    });
    return response.data as string;
  },
};
