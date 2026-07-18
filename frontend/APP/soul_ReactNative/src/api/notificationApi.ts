import { API_BASE_URL } from "@/api/config";
import AsyncStorage from "@react-native-async-storage/async-storage";

const BASE = `${API_BASE_URL.replace(/\/$/, "")}/notifications`;

async function authHeaders() {
  const token = await AsyncStorage.getItem("token");
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };
}

async function readResponse(res: Response) {
  const json = await res.json().catch(() => null);
  if (!res.ok) {
    throw new Error(json?.message || "Không thể xử lý thông báo");
  }
  return json;
}

export type AppNotification = {
  _id: string;
  userId: string;
  type: string;
  title: string;
  content: string;
  isRead: boolean;
  readAt: string | null;
  related?: { type: string | null; id: string | null };
  createdAt: string;
};

export type NotificationListResponse = {
  data: AppNotification[];
  unreadCount: number;
  pagination: { total: number; page: number; limit: number; totalPages: number };
};

export async function getNotifications(page = 1, limit = 20): Promise<NotificationListResponse> {
  const res = await fetch(`${BASE}?page=${page}&limit=${limit}`, {
    headers: await authHeaders(),
  });
  return readResponse(res);
}

export async function getUnreadCount(): Promise<number> {
  const res = await fetch(`${BASE}/unread-count`, {
    headers: await authHeaders(),
  });
  const json = await res.json();
  if (!res.ok) return 0;
  return json.count ?? 0;
}

export async function markAsRead(id: string): Promise<void> {
  const res = await fetch(`${BASE}/${id}/read`, {
    method: "PATCH",
    headers: await authHeaders(),
  });
  await readResponse(res);
}

export async function markAllRead(): Promise<void> {
  const res = await fetch(`${BASE}/read-all`, {
    method: "PATCH",
    headers: await authHeaders(),
  });
  await readResponse(res);
}
