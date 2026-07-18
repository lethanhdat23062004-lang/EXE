import apiClient from "@/services/api";

export type DistributionKey = "age" | "gender" | "status" | "role";

export type AdminDashboardOverview = {
  users: {
    total: number;
    active: number;
    inactive: number;
    blocked: number;
    growth: { month: string; label: string; count: number }[];
    distribution: {
      age: Record<"under18" | "18_22" | "23_30" | "over30" | "unknown", number>;
      gender: Record<"male" | "female" | "other" | "unknown", number>;
      status: Record<"active" | "inactive" | "blocked", number>;
      role: Record<"user" | "admin" | "event_organizer", number>;
    };
  };
  moderation: {
    pendingReports: number;
    pendingAppeals: number;
    aiFlagged: number;
  };
  events: {
    registeredCount: number;
    cancelledCount: number;
    attendedCount: number;
    absentCount: number;
    attendanceRate: number;
    reviewRate: number;
    averageRating: number;
    overdueEventCount: number;
    overdueRegistrationCount: number;
  };
  appSatisfaction: {
    totalRatings: number;
    averageRating: number;
    responseRate: number;
    satisfactionRate: number;
    distribution: Record<1 | 2 | 3 | 4 | 5, number>;
    recentFeedback: {
      _id: string;
      rating: number;
      feedback: string;
      createdAt: string;
      user: { _id: string; fullName: string; avatarUrl?: string | null } | null;
    }[];
  };
};

export const EMPTY_ADMIN_OVERVIEW: AdminDashboardOverview = {
  users: {
    total: 0,
    active: 0,
    inactive: 0,
    blocked: 0,
    growth: [],
    distribution: {
      age: { under18: 0, "18_22": 0, "23_30": 0, over30: 0, unknown: 0 },
      gender: { male: 0, female: 0, other: 0, unknown: 0 },
      status: { active: 0, inactive: 0, blocked: 0 },
      role: { user: 0, admin: 0, event_organizer: 0 },
    },
  },
  moderation: { pendingReports: 0, pendingAppeals: 0, aiFlagged: 0 },
  events: {
    registeredCount: 0,
    cancelledCount: 0,
    attendedCount: 0,
    absentCount: 0,
    attendanceRate: 0,
    reviewRate: 0,
    averageRating: 0,
    overdueEventCount: 0,
    overdueRegistrationCount: 0,
  },
  appSatisfaction: {
    totalRatings: 0,
    averageRating: 0,
    responseRate: 0,
    satisfactionRate: 0,
    distribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
    recentFeedback: [],
  },
};

export async function getAdminDashboardOverview() {
  const response = await apiClient.get("/admin/dashboard/overview");
  return response.data as { success: boolean; data: AdminDashboardOverview };
}
