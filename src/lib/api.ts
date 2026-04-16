const BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";
const isBrowser = typeof window !== "undefined";

const readStorage = (key: string) => (isBrowser ? window.localStorage.getItem(key) : null);
const writeStorage = (key: string, value: string | null) => {
  if (!isBrowser) return;
  if (value) window.localStorage.setItem(key, value);
  else window.localStorage.removeItem(key);
};

let accessToken: string | null = readStorage("access_token");
let refreshTokenValue: string | null = readStorage("refresh_token");
let refreshPromise: Promise<string | null> | null = null;
const WORKSPACE_STORAGE_KEY = "selected_workspace_id";

export function setAccessToken(token: string | null) {
  accessToken = token;
  writeStorage("access_token", token);
}

export function getAccessToken() {
  return accessToken;
}

export function setRefreshToken(token: string | null) {
  refreshTokenValue = token;
  writeStorage("refresh_token", token);
}

export function getRefreshToken() {
  return refreshTokenValue;
}

export function getSelectedWorkspaceId() {
  return readStorage(WORKSPACE_STORAGE_KEY);
}

export function setSelectedWorkspaceId(workspaceId: string | null) {
  writeStorage(WORKSPACE_STORAGE_KEY, workspaceId);
}

async function refreshToken(): Promise<string | null> {
  try {
    const refreshHeaders: Record<string, string> = accessToken
      ? { Authorization: `Bearer ${accessToken}` }
      : {};
    if (refreshTokenValue)
      refreshHeaders["x-refresh-token"] = refreshTokenValue;

    let res = await fetch(`${BASE_URL}/refresh-token`, {
      method: "GET",
      credentials: "include",
      headers: refreshHeaders,
    });
    if (!res.ok) {
      res = await fetch(`${BASE_URL}/auth/refresh-token`, {
        method: "GET",
        credentials: "include",
        headers: refreshHeaders,
      });
    }
    if (!res.ok) return null;
    const data = await res.json();
    const newToken = data.accessToken || data.token;
    const newRefreshToken = data.refreshToken || data.data?.refreshToken;
    if (newToken) {
      setAccessToken(newToken);
      if (newRefreshToken) setRefreshToken(newRefreshToken);
      return newToken;
    }
    return null;
  } catch {
    return null;
  }
}

export async function apiFetch<T = any>(
  path: string,
  options: RequestInit & { skipAuth?: boolean } = {},
): Promise<T> {
  const { skipAuth, ...fetchOptions } = options;
  const method = (fetchOptions.method || "GET").toUpperCase();
  let requestBody = fetchOptions.body;
  const headers = new Headers(fetchOptions.headers);
  const selectedWorkspaceId = getSelectedWorkspaceId();

  if (!skipAuth && accessToken) {
    headers.set("Authorization", `Bearer ${accessToken}`);
  }

  if (
    !skipAuth &&
    selectedWorkspaceId &&
    method !== "GET" &&
    method !== "HEAD" &&
    method !== "OPTIONS" &&
    requestBody &&
    !(requestBody instanceof FormData) &&
    !path.startsWith("/auth") &&
    !path.startsWith("/plan") &&
    !path.startsWith("/promocode") &&
    !path.startsWith("/promocodes") &&
    !path.startsWith("/super-admin/plans") &&
    !/\/workspace\/\d+\/invite$/.test(path) &&
    !/\/workspace\/members\/\d+\/edit\/\d+$/.test(path) &&
    path !== "/accept-invite" &&
    !path.startsWith("/workspace/accept-invite")
  ) {
    try {
      const parsed = JSON.parse(String(requestBody));
      if (
        parsed &&
        typeof parsed === "object" &&
        parsed.workspaceId === undefined
      ) {
        requestBody = JSON.stringify({
          ...parsed,
          workspaceId: selectedWorkspaceId,
        });
      }
    } catch {
      // Ignore non-JSON payloads.
    }
  }

  if (
    !headers.has("Content-Type") &&
    !(fetchOptions.body instanceof FormData)
  ) {
    headers.set("Content-Type", "application/json");
  }

  let res = await fetch(`${BASE_URL}${path}`, {
    ...fetchOptions,
    body: requestBody,
    headers,
    credentials: "include",
  });

  if (res.status === 401 && !skipAuth) {
    if (!refreshPromise) refreshPromise = refreshToken();
    const newToken = await refreshPromise;
    refreshPromise = null;

    if (newToken) {
      headers.set("Authorization", `Bearer ${newToken}`);
      res = await fetch(`${BASE_URL}${path}`, {
        ...fetchOptions,
        body: requestBody,
        headers,
        credentials: "include",
      });
    } else {
      setAccessToken(null);
      setRefreshToken(null);
      if (isBrowser) window.location.href = "/login";
      throw new Error("Session expired");
    }
  }

  if (!res.ok) {
    const error = await res.json().catch(() => ({ message: res.statusText }));
    const backendError =
      error?.error ||
      error?.message ||
      error?.data?.error ||
      error?.data?.message ||
      `Request failed: ${res.status}`;
    throw new Error(backendError);
  }

  const text = await res.text();
  return text ? JSON.parse(text) : ({} as T);
}

// Auth
export const authApi = {
  register: (data: {
    user_name: string;
    email: string;
    password: string;
    confirmPassword: string;
  }) =>
    apiFetch("/auth/register", {
      method: "POST",
      body: JSON.stringify(data),
      skipAuth: true,
    }),
  verify: (data: { email: string; otp: string }) =>
    apiFetch("/auth/verify", {
      method: "POST",
      body: JSON.stringify(data),
      skipAuth: true,
    }),
  resendOtp: (email: string) =>
    apiFetch("/auth/resend-otp", {
      method: "POST",
      body: JSON.stringify({ email }),
      skipAuth: true,
    }),
  login: (data: { email: string; password: string }) =>
    apiFetch("/auth/login", {
      method: "POST",
      body: JSON.stringify(data),
      skipAuth: true,
    }),
  logout: () => apiFetch("/auth/logout", { method: "GET" }),

  refreshToken: (data: { refreshToken: string }) =>
    apiFetch("/auth/refresh-token", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  me: () => apiFetch("/auth/me"),
  updateProfile: (data: FormData) =>
    apiFetch("/auth/me", { method: "PATCH", body: data }),
  updateEmail: (data: { email: string; otp: string }) =>
    apiFetch("/auth/update-email", {
      method: "PATCH",
      body: JSON.stringify(data),
    }),
  forgotPassword: (email: string) =>
    apiFetch("/auth/forgot-password", {
      method: "POST",
      body: JSON.stringify({ email }),
      skipAuth: true,
    }),
  resetPassword: (data: {
    email: string;
    otp: string;
    password: string;
    confirmPassword: string;
  }) =>
    apiFetch("/auth/reset-password", {
      method: "PATCH",
      body: JSON.stringify(data),
      skipAuth: true,
    }),
  updatePassword: (data: { password: string; confirmPassword: string }) =>
    apiFetch("/auth/update-password", {
      method: "PATCH",
      body: JSON.stringify(data),
    }),
};

// Recordings
export const recordingsApi = {
  create: (title: string) =>
    apiFetch("/recordings", {
      method: "POST",
      body: JSON.stringify({ title }),
    }),
  initUpload: (id: number, data: { fileName: string; contentType: string }) =>
    apiFetch(`/recordings/uploads/${id}/init`, {
      method: "POST",
      body: JSON.stringify(data),
    }),
  getPresignedUrls: (
    id: number,
    uploadId: string,
    partNumbers: number[],
    chunkSize?: number,
  ) =>
    apiFetch(`/recordings/${id}/uploads/${uploadId}/parts`, {
      method: "POST",
      body: JSON.stringify(
        chunkSize ? { partNumbers, chunkSize } : { partNumbers },
      ),
    }),
  getUploadedParts: (id: number, uploadId: string) =>
    apiFetch(`/recordings/${id}/uploads/${uploadId}/parts`, { method: "GET" }),
  completeUpload: (
    id: number,
    uploadId: string,
    data: {
      data: { partNumber: number; eTag: string }[];
      chunkSize?: number;
      workspaceId?: string;
    },
  ) =>
    apiFetch(`/recordings/${id}/uploads/${uploadId}/complete`, {
      method: "POST",
      body: JSON.stringify(data),
    }),
  initCameraTrackUpload: (
    id: number,
    payload: {
      fileName: string;
      contentType: string;
      durationSec: number;
      workspaceId: string;
      cameraPosition: "top-left" | "top-right" | "bottom-left" | "bottom-right";
      cameraShape: "circle" | "rounded-rect";
      cameraScale: number;
    },
  ) =>
    apiFetch(`/recordings/${id}/camera-track`, {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  getCameraTrackPresignedUrls: (
    id: number,
    uploadId: string,
    payload: { workspaceId: string; partNumbers: number[] },
  ) =>
    apiFetch(`/recordings/${id}/camera-track/uploads/${uploadId}/parts`, {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  getCameraTrackUploadedParts: (id: number, uploadId: string) =>
    apiFetch(`/recordings/${id}/camera-track/uploads/${uploadId}/parts`, {
      method: "GET",
    }),
  completeCameraTrackUpload: (
    id: number,
    uploadId: string,
    payload: {
      workspaceId: string;
      data: { partNumber: number; eTag: string }[];
    },
  ) =>
    apiFetch(`/recordings/${id}/camera-track/uploads/${uploadId}/complete`, {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  abortCameraTrackUpload: (id: number, uploadId: string) =>
    apiFetch(`/recordings/${id}/camera-track/uploads/${uploadId}`, {
      method: "DELETE",
      body: JSON.stringify({}),
    }),
  myRecordings: (
    params: {
      limit?: number;
      page?: number;
      order?: string;
      filters?: {
        status?: string;
        title?: string;
        visibility?: string;
        startDate?: string;
        endDate?: string;
      };
    } = {},
  ) => {
    const sp = new URLSearchParams();
    const selectedWorkspaceId = getSelectedWorkspaceId();
    if (params.limit) sp.set("limit", String(params.limit));
    if (params.page) sp.set("page", String(params.page));
    if (params.order) sp.set("order", params.order);
    if (selectedWorkspaceId) sp.set("workspaceId", selectedWorkspaceId);
    if (params.filters?.status)
      sp.set("filters[status]", params.filters.status);
    if (params.filters?.title) sp.set("filters[title]", params.filters.title);
    if (params.filters?.visibility)
      sp.set("filters[visibility]", params.filters.visibility);
    if (params.filters?.startDate)
      sp.set("filters[startDate]", params.filters.startDate);
    if (params.filters?.endDate) {
      sp.set("filters[endDate]", params.filters.endDate);
      // Keep compatibility with backends expecting singular 'filter' key.
      sp.set("filters[endDate]", params.filters.endDate);
    }
    return apiFetch(`/recordings/my-recordings?${sp}`);
  },
  update: (id: number, data: { title?: string; visibility?: string }) =>
    apiFetch(`/recordings/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    }),
  delete: (id: number, workspaceId?: string) =>
    apiFetch(`/recordings/${id}`, {
      method: "DELETE",
      body: JSON.stringify(workspaceId ? { workspaceId } : {}),
    }),
  removeWatermark: (id: number, workspaceId?: string) =>
    apiFetch(`/recordings/remove-watermark/${id}`, {
      method: "POST",
      body: JSON.stringify(workspaceId ? { workspaceId } : {}),
    }),
  downloadVideo: (id: number, workspaceId?: string) =>
    apiFetch(`/recordings/download-video/${id}`, {
      method: "POST",
      body: JSON.stringify(workspaceId ? { workspaceId } : {}),
    }),
  getPublicLink: (id: number) => apiFetch(`/recordings/public-link/${id}`),
  previewLink: (token: string) =>
    apiFetch(`/recordings/preview-link/${token}`, { skipAuth: true }),
};

// Subscriptions
export const subscriptionApi = {
  create: (data: {
    type: "monthly" | "yearly" | "null";
    planId: string;
    workspaceId: string;
  }) =>
    apiFetch("/subscription", { method: "POST", body: JSON.stringify(data) }),
  update: (id: number) =>
    apiFetch(`/subscription/update/${id}`, { method: "PATCH" }),
  details: (id: number) => apiFetch(`/subscription/details/${id}`),
  upgrade: (
    id: number,
    data: { type: string; planId: string; id: string; workspaceId: string },
  ) =>
    apiFetch(`/subscription/upgrade/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    }),
};

// Plans
export const plansApi = {
  getAll: () => apiFetch("/plan/all"),
  getById: (id: number) => apiFetch(`/plan/details/${id}`),
};

// Workspace
export const workspaceApi = {
  create: (data: FormData) =>
    apiFetch("/workspace", { method: "POST", body: data }),
  invite: (workspaceId: number, invitedEmail: string) =>
    apiFetch(`/workspace/${workspaceId}/invite`, {
      method: "POST",
      body: JSON.stringify({ invitedEmail }),
    }),
  acceptInvite: async (token: string) => {
    try {
      return await apiFetch("/accept-invite", {
        method: "PATCH",
        body: JSON.stringify({ token }),
      });
    } catch {
      return apiFetch(`/workspace/accept-invite?token=${token}`, {
        method: "PATCH",
        body: JSON.stringify({}),
      });
    }
  },
  members: (workspaceId: number) =>
    apiFetch(`/workspace/members/${workspaceId}`),
  updateMember: (userId: number, workspaceId: number, newMembership: string) =>
    apiFetch(`/workspace/members/${workspaceId}/edit/${userId}`, {
      method: "PATCH",
      body: JSON.stringify({ newMembership }),
    }),
  update: (workspaceId: number, data: FormData) =>
    apiFetch(`/workspace/update/${workspaceId}`, {
      method: "PATCH",
      body: data,
    }),
  removeMember: (workspaceId: number, userId: number) =>
    apiFetch(`/workspace/members/${workspaceId}/remove/${userId}`, {
      method: "DELETE",
    }),
  recordings: (workspaceId: number) =>
    apiFetch(`/workspace/${workspaceId}/recordings`),
  leave: (workspaceId: number) =>
    apiFetch(`/workspace/leave-workspace/${workspaceId}`, { method: "PATCH" }),
  delete: (workspaceId: number) =>
    apiFetch(`/workspace/delete/${workspaceId}`, { method: "DELETE" }),
};

// Notifications
export const notificationsApi = {
  getAll: (params: { page?: number; limit?: number; order?: "DESC" | "ASC" } = {}) => {
    const sp = new URLSearchParams();
    if (params.page) sp.set("page", String(params.page));
    if (params.limit) sp.set("limit", String(params.limit));
    if (params.order) sp.set("order", params.order);
    const query = sp.toString();
    return apiFetch(`/notifications/all${query ? `?${query}` : ""}`);
  },
  markAllAsRead: () =>
    apiFetch("/notifications/all/mark-read", {
      method: "PATCH",
      body: JSON.stringify({}),
    }),
  getUnreadCount: () => apiFetch("/notifications/unread-count"),
  getById: (id: number) => apiFetch(`/notifications/${id}`),
  markAsRead: (id: number) =>
    apiFetch(`/notifications/${id}/read`, {
      method: "PATCH",
      body: JSON.stringify({}),
    }),
  delete: (id: number) =>
    apiFetch(`/notifications/${id}`, {
      method: "DELETE",
      body: JSON.stringify({}),
    }),
};

// Super Admin
export const superAdminApi = {
  recordings: {
    list: (
      params: {
        limit?: number;
        page?: number;
        order?: string;
        filters?: {
          status?: string;
          title?: string;
          visibility?: string;
          startDate?: string;
          endDate?: string;
        };
      } = {},
    ) => {
      const sp = new URLSearchParams();
      if (params.limit) sp.set("limit", String(params.limit));
      if (params.page) sp.set("page", String(params.page));
      if (params.order) sp.set("order", params.order);
      if (params.filters?.status)
        sp.set("filters[status]", params.filters.status);
      if (params.filters?.title) sp.set("filters[title]", params.filters.title);
      if (params.filters?.visibility)
        sp.set("filters[visibility]", params.filters.visibility);
      if (params.filters?.startDate)
        sp.set("filters[startDate]", params.filters.startDate);
      if (params.filters?.endDate)
        sp.set("filters[endDate]", params.filters.endDate);
      return apiFetch(`/recordings/all?${sp}`);
    },
    create: (data: Record<string, any>) =>
      apiFetch("/recordings", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    update: (id: number, data: Record<string, any>) =>
      apiFetch(`/recordings/${id}`, {
        method: "PATCH",
        body: JSON.stringify(data),
      }),
    delete: (id: number) =>
      apiFetch(`/recordings/${id}`, {
        method: "DELETE",
        body: JSON.stringify({}),
      }),
  },
  workspaces: {
    list: () => apiFetch("/workspace/all"),
    create: (data: Record<string, any>) =>
      apiFetch("/workspace", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    update: (id: number, data: Record<string, any>) =>
      apiFetch(`/workspace/update/${id}`, {
        method: "PATCH",
        body: JSON.stringify(data),
      }),
    delete: (id: number) =>
      apiFetch(`/workspace/${id}`, {
        method: "DELETE",
        body: JSON.stringify({}),
      }),
  },
  users: {
    list: (params: { role?: string; email?: string; name?: string } = {}) => {
      const sp = new URLSearchParams();
      if (params.role) sp.set("role", params.role);
      if (params.email) sp.set("email", params.email);
      if (params.name) sp.set("name", params.name);
      const query = sp.toString();
      return apiFetch(`/auth/users${query ? `?${query}` : ""}`);
    },
    create: (data: Record<string, any>) =>
      apiFetch("/auth/", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    update: (id: number, data: Record<string, any>) =>
      apiFetch(`/users/${id}`, {
        method: "PATCH",
        body: JSON.stringify(data),
      }),
    delete: (id: number) =>
      apiFetch(`/users/${id}`, {
        method: "DELETE",
        body: JSON.stringify({}),
      }),
  },
  plans: {
    list: () => apiFetch("/plan/all"),
    create: (data: FormData) =>
      apiFetch("/plan/new", {
        method: "POST",
        body: data,
      }),
    update: (id: number, data: FormData) =>
      apiFetch(`/plan/edit/${id}`, {
        method: "PATCH",
        body: data,
      }),
    delete: (id: number) =>
      apiFetch(`/plan/delete/${id}`, {
        method: "DELETE",
        body: JSON.stringify({}),
      }),
  },
  promocodes: {
    list: () => apiFetch("/promocode/all"),
    details: (promoId: number) => apiFetch(`/promocode/details/${promoId}`),
    create: (data: Record<string, any>) =>
      apiFetch("/promocode/", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    update: (promoId: number, data: Record<string, any>) =>
      apiFetch(`/promocode/update/${promoId}`, {
        method: "PATCH",
        body: JSON.stringify(data),
      }),
    delete: (promoId: number) =>
      apiFetch(`/promocode/delete/${promoId}`, {
        method: "DELETE",
        body: JSON.stringify({}),
      }),
  },
};
