import apiClient from "@/services/api";

export type AdminForumPostStatus =
  | "pending"
  | "approved"
  | "rejected"
  | "hidden"
  | "deleted";

export type AdminForumPost = {
  _id: string;
  authorId:
    | string
    | {
        _id: string;
        fullName?: string;
        email?: string;
        avatarUrl?: string;
      };
  content: string;
  emotionStatus?: string;
  hashtags?: string[];
  isAnonymous?: boolean;
  anonymousName?: string | null;
  visibility?: "public" | "private";
  status: AdminForumPostStatus;
  statistics?: {
    commentCount?: number;
    reportCount?: number;
  };
  isFlagged?: boolean;
  toxicityLevel?: "low" | "medium" | "high" | null;
  rejectedReason?: string | null;
  createdAt: string;
  updatedAt?: string;
};

export type AdminForumReportStatus =
  | "pending"
  | "dismissed"
  | "action_taken"
  | "appeal_pending"
  | "appeal_accepted"
  | "appeal_rejected";

type ForumUser =
  | string
  | {
      _id: string;
      fullName?: string;
      email?: string;
      avatarUrl?: string;
    }
  | null;

export type AdminForumReport = {
  _id: string;
  targetType: "post" | "comment";
  targetId: string | { _id: string; content?: string };
  reporterId?: ForumUser;
  reportedUserId: ForumUser;
  reportSource: "user" | "system_ai";
  reason: string;
  description?: string | null;
  status: AdminForumReportStatus;
  aiReview?: {
    isViolationSuspected?: boolean;
    violationType?: string | null;
    severity?: "low" | "medium" | "high" | null;
    confidenceScore?: number | null;
    checkedAt?: string | null;
  };
  appealReason?: string | null;
  appealRequestedAt?: string | null;
  appealResolvedAt?: string | null;
  appealNote?: string | null;
  createdAt: string;
  updatedAt?: string;
};

type ApiResponse<T> = {
  success: boolean;
  message?: string;
  data: T;
};

export const adminForumService = {
  getPosts: async (params?: {
    status?: AdminForumPostStatus;
    flagged?: boolean;
  }) => {
    const response = await apiClient.get<ApiResponse<AdminForumPost[]>>(
      "/admin/forum/posts",
      {
        params: {
          status: params?.status,
          flagged:
            typeof params?.flagged === "boolean"
              ? String(params.flagged)
              : undefined,
        },
      }
    );
    return response.data;
  },

  getReports: async () => {
    const response = await apiClient.get<ApiResponse<AdminForumReport[]>>(
      "/admin/forum/reports"
    );
    return response.data;
  },

  approvePost: async (postId: string) => {
    const response = await apiClient.patch<ApiResponse<AdminForumPost>>(
      `/admin/forum/posts/${postId}/approve`
    );
    return response.data;
  },

  hidePost: async (postId: string, reason?: string) => {
    const response = await apiClient.patch<ApiResponse<AdminForumPost>>(
      `/admin/forum/posts/${postId}/hide`,
      { reason }
    );
    return response.data;
  },

  rejectPost: async (postId: string, reason?: string) => {
    const response = await apiClient.patch<ApiResponse<AdminForumPost>>(
      `/admin/forum/posts/${postId}/reject`,
      { reason }
    );
    return response.data;
  },

  dismissReport: async (reportId: string) => {
    const response = await apiClient.patch<ApiResponse<unknown>>(
      `/admin/forum/reports/${reportId}/dismiss`
    );
    return response.data;
  },

  takeActionReport: async (reportId: string, reason?: string) => {
    const response = await apiClient.patch<ApiResponse<unknown>>(
      `/admin/forum/reports/${reportId}/action`,
      { reason }
    );
    return response.data;
  },

  resolveAppeal: async (
    reportId: string,
    action: "accept" | "reject",
    note?: string
  ) => {
    const response = await apiClient.patch<ApiResponse<unknown>>(
      `/admin/forum/reports/${reportId}/appeal`,
      { action, note }
    );
    return response.data;
  },
};
