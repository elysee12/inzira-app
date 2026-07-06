// ============================================================
// IMIRIRE ADMIN — Real API client
// All calls hit the NestJS backend at localhost:3000
// ============================================================

export const BASE_URL =
  (typeof import.meta !== "undefined" && (import.meta as any).env?.VITE_API_BASE_URL) ||
  "http://localhost:3000";

// All NestJS routes are prefixed with /api (set in main.ts via app.setGlobalPrefix)
export const API_BASE_URL = `${BASE_URL}/api`;

// ── Types ─────────────────────────────────────────────────────────────────────

export type Role = "ADMIN" | "PARENT" | "CHW";
export type ContentType = "text" | "audio" | "video";

export interface User {
  id: number;
  email: string;
  phone: string;
  name: string;
  role: Role;
  province?: string | null;
  district?: string | null;
  sector?: string | null;
  cell?: string | null;
  village?: string | null;
  assignedCHWId?: number | null;
  createdAt: string;
  updatedAt?: string;
}

export interface CHW extends User {
  _count?: { assignedParents: number };
}

export interface AgeCategory {
  id: string;
  label: string;
  sublabel: string;
  color: string;
  bgColor: string;
  iconName: string;
  description: string;
  imageUrl?: string | null;
  contentCount?: number;
}

export interface Content {
  id: number;
  title: string;
  description: string;
  type: ContentType;
  duration?: string | null;
  fileUrl?: string | null;
  textContent?: string | null;
  ageGroup: string;
  postedById: number;
  postedByName?: string;
  postedAt: string;
  isNew: boolean;
  ageCategory?: AgeCategory;
  postedBy?: { id: number; name: string };
}

export interface AuthSession {
  access_token: string;
  user: User;
}

export interface DashboardStats {
  documents: number;
  audio: number;
  video: number;
  total: number;
  parents: number;
  chws: number;
  categories: number;
  totalMessages: number;
}

export interface Conversation {
  partner: { id: number; name: string; role: string };
  lastMessage: Message;
  unreadCount: number;
}

export interface Message {
  id: number;
  senderId: number;
  receiverId: number;
  content: string;
  isRead: boolean;
  createdAt: string;
  sender: { id: number; name: string; role: string };
  receiver: { id: number; name: string; role: string };
}

export interface UserStats {
  total: number;
  byRole: Record<string, number>;
  byDate?: number;
}

// ── Request helper ─────────────────────────────────────────────────────────────

function authHeaders(): Record<string, string> {
  if (typeof window === "undefined") return {};
  const token = window.localStorage.getItem("admin_token");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export async function apiFetch<T>(path: string, init: RequestInit = {}): Promise<T> {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...authHeaders(),
      ...(init.headers ?? {}),
    },
  });
  if (!res.ok) {
    let msg = `API ${res.status}`;
    try {
      const body = await res.json();
      msg = body?.message ?? msg;
    } catch {}
    throw new Error(msg);
  }
  // 204 No Content
  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

/** Multipart upload helper (no Content-Type header so browser sets boundary) */
export async function apiUpload<T>(path: string, form: FormData, method = "POST"): Promise<T> {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    method,
    headers: { ...authHeaders() },
    body: form,
  });
  if (!res.ok) {
    let msg = `API ${res.status}`;
    try {
      const body = await res.json();
      msg = body?.message ?? msg;
    } catch {}
    throw new Error(msg);
  }
  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

// ── Auth ───────────────────────────────────────────────────────────────────────

export const authApi = {
  async login(email: string, password: string): Promise<AuthSession> {
    const data = await apiFetch<{ access_token: string; user: User }>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
    return { access_token: data.access_token, user: data.user };
  },

  async changePassword(
    currentPassword: string,
    newPassword: string,
    confirmPassword: string
  ): Promise<{ message: string }> {
    return apiFetch("/auth/change-password", {
      method: "POST",
      body: JSON.stringify({ currentPassword, newPassword, confirmPassword }),
    });
  },

  logout() {
    if (typeof window !== "undefined") {
      window.localStorage.removeItem("admin_token");
      window.localStorage.removeItem("admin_user");
    }
  },
};

// ── Content / Lessons ──────────────────────────────────────────────────────────

export const contentApi = {
  list: (): Promise<Content[]> => apiFetch("/content"),

  get: (id: number): Promise<Content> => apiFetch(`/content/${id}`),

  /** Create with optional file upload */
  create: (data: Partial<Content> & { postedById: number }, file?: File): Promise<Content> => {
    const form = new FormData();
    form.append("title", data.title ?? "");
    form.append("description", data.description ?? "");
    form.append("type", data.type ?? "text");
    form.append("ageGroup", data.ageGroup ?? "");
    form.append("postedById", String(data.postedById));
    if (data.duration) form.append("duration", data.duration);
    if (data.textContent) form.append("textContent", data.textContent);
    if (data.fileUrl) form.append("fileUrl", data.fileUrl);
    if (file) form.append("file", file);
    return apiUpload("/content", form, "POST");
  },

  /** Update with optional file replacement */
  update: (id: number, data: Partial<Content>, file?: File): Promise<Content> => {
    const form = new FormData();
    if (data.title) form.append("title", data.title);
    if (data.description) form.append("description", data.description);
    if (data.type) form.append("type", data.type);
    if (data.ageGroup) form.append("ageGroup", data.ageGroup);
    if (data.duration) form.append("duration", data.duration);
    if (data.textContent !== undefined) form.append("textContent", data.textContent ?? "");
    if (data.fileUrl) form.append("fileUrl", data.fileUrl);
    if (file) form.append("file", file);
    return apiUpload(`/content/${id}`, form, "PATCH");
  },

  remove: (id: number): Promise<void> =>
    apiFetch(`/content/${id}`, { method: "DELETE" }),
};

// ── Age Categories ─────────────────────────────────────────────────────────────

export const categoryApi = {
  list: (): Promise<AgeCategory[]> => apiFetch("/age-categories"),

  get: (id: string): Promise<AgeCategory> => apiFetch(`/age-categories/${id}`),

  create: (data: Partial<AgeCategory>, image?: File): Promise<AgeCategory> => {
    const form = new FormData();
    Object.entries(data).forEach(([k, v]) => v != null && form.append(k, String(v)));
    if (image) form.append("image", image);
    return apiUpload("/age-categories", form, "POST");
  },

  update: (id: string, data: Partial<AgeCategory>, image?: File): Promise<AgeCategory> => {
    const form = new FormData();
    Object.entries(data).forEach(([k, v]) => v != null && form.append(k, String(v)));
    if (image) form.append("image", image);
    return apiUpload(`/age-categories/${id}`, form, "PATCH");
  },
};

// ── CHW Management ─────────────────────────────────────────────────────────────

export const chwApi = {
  list: (): Promise<CHW[]> => apiFetch("/chw"),

  get: (id: number): Promise<CHW> => apiFetch(`/chw/${id}`),

  /** Creates CHW — auto-generates temp password, sends welcome email */
  create: (data: {
    name: string;
    email: string;
    phone: string;
    province: string;
    district: string;
    sector: string;
    cell: string;
    village: string;
  }): Promise<{ chw: CHW; temporaryPassword: string }> =>
    apiFetch("/chw", { method: "POST", body: JSON.stringify(data) }),

  update: (
    id: number,
    data: Partial<Pick<CHW, "name" | "email" | "phone" | "province" | "district" | "sector" | "cell" | "village">>
  ): Promise<CHW> =>
    apiFetch(`/chw/${id}`, { method: "PUT", body: JSON.stringify(data) }),

  remove: (id: number): Promise<void> =>
    apiFetch(`/chw/${id}`, { method: "DELETE" }),

  parents: (id: number): Promise<User[]> => apiFetch(`/chw/${id}/parents`),
};

// ── User / Parent Management ───────────────────────────────────────────────────

export const userApi = {
  listAll: (): Promise<User[]> => apiFetch("/users"),

  listByRole: (role: Role): Promise<User[]> => apiFetch(`/users/by-role?role=${role}`),

  get: (id: number): Promise<User> => apiFetch(`/users/${id}`),

  stats: (params?: { role?: string; startDate?: string; endDate?: string }): Promise<UserStats> => {
    const q = new URLSearchParams();
    if (params?.role) q.set("role", params.role);
    if (params?.startDate) q.set("startDate", params.startDate);
    if (params?.endDate) q.set("endDate", params.endDate);
    return apiFetch(`/users/stats${q.toString() ? "?" + q : ""}`);
  },

  update: (id: number, data: Partial<User>): Promise<User> =>
    apiFetch(`/users/${id}`, { method: "PATCH", body: JSON.stringify(data) }),

  remove: (id: number): Promise<void> =>
    apiFetch(`/users/${id}`, { method: "DELETE" }),

  getAssignedCHW: (parentId: number): Promise<CHW | null> =>
    apiFetch(`/users/${parentId}/chw`),

  /** Create a parent account (via register) */
  createParent: (data: {
    name: string;
    email: string;
    phone: string;
    password: string;
    province?: string;
    district?: string;
    sector?: string;
    cell?: string;
    village?: string;
  }): Promise<User> =>
    apiFetch("/auth/register", { method: "POST", body: JSON.stringify(data) }),
};

// ── Messages ───────────────────────────────────────────────────────────────────

export const messageApi = {
  conversations: (userId: number): Promise<Conversation[]> =>
    apiFetch(`/messages/conversations/${userId}`),

  conversation: (userId: number, otherUserId: number): Promise<Message[]> =>
    apiFetch(`/messages/conversation?userId=${userId}&otherUserId=${otherUserId}`),

  send: (senderId: number, receiverId: number, content: string): Promise<Message> =>
    apiFetch("/messages", {
      method: "POST",
      body: JSON.stringify({ senderId, receiverId, content }),
    }),

  unread: (userId: number): Promise<{ unreadCount: number }> =>
    apiFetch(`/messages/unread/${userId}`),

  markRead: (messageId: number, userId: number): Promise<void> =>
    apiFetch(`/messages/${messageId}/read`, {
      method: "POST",
      body: JSON.stringify({ userId }),
    }),

  chwForParent: (parentId: number): Promise<CHW | null> =>
    apiFetch(`/messages/chw-for-parent/${parentId}`),
};

// ── Dashboard stats ────────────────────────────────────────────────────────────

export const statsApi = {
  overview: async (): Promise<DashboardStats> => {
    const [contents, userStats, categories] = await Promise.all([
      contentApi.list(),
      userApi.stats(),
      categoryApi.list(),
    ]);

    return {
      documents: contents.filter((c) => c.type === "text").length,
      audio: contents.filter((c) => c.type === "audio").length,
      video: contents.filter((c) => c.type === "video").length,
      total: contents.length,
      parents: userStats.byRole?.PARENT ?? 0,
      chws: userStats.byRole?.CHW ?? 0,
      categories: categories.length,
      totalMessages: 0,
    };
  },
};

// ── Helpers ────────────────────────────────────────────────────────────────────

export function fileUrl(path: string | null | undefined): string | undefined {
  if (!path) return undefined;
  if (path.startsWith("http")) return path;
  // File uploads are served directly from the backend root, not under /api
  return `${BASE_URL}${path}`;
}
