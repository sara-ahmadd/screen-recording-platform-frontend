const BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";
const isBrowser = typeof window !== "undefined";

const readStorage = (key: string) =>
  isBrowser ? window.localStorage.getItem(key) : null;
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
    !path.startsWith("/super-admin/paymob") &&
    !/\/workspace\/\d+\/invite$/.test(path) &&
    !/\/workspace\/members\/\d+\/edit\/\d+$/.test(path) &&
    path !== "/accept-invite" &&
    !path.startsWith("/workspace/accept-invite") &&
    path !== "/analytics/events" &&
    !path.startsWith("/feedback")
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
  googleOneTap: (data: { idToken: string }) =>
    apiFetch("/auth/google/one-tap", {
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
  activateAccount: (data: { email: string }) =>
    apiFetch("/auth/activate-account", {
      method: "POST",
      body: JSON.stringify(data),
      skipAuth: true,
    }),
  deleteMe: () =>
    apiFetch("/auth/me", {
      method: "DELETE",
      body: JSON.stringify({}),
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
  getUploadedParts: (
    id: number,
    uploadId: string,
    workspaceId?: string | number,
  ) => {
    const sp = new URLSearchParams();
    if (workspaceId != null && workspaceId !== "") {
      sp.set("workspaceId", String(workspaceId));
    }
    const query = sp.toString();
    return apiFetch(
      `/recordings/${id}/uploads/${uploadId}/parts${query ? `?${query}` : ""}`,
      {
        method: "GET",
      },
    );
  },
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
  /** Abort main screen-recording multipart when uploadId is known (e.g. in-session failure). */
  abortUpload: (id: number, uploadId: string) =>
    apiFetch(`/recordings/${id}/uploads/${uploadId}`, {
      method: "DELETE",
      body: JSON.stringify({}),
    }),
  /** Abort using server-stored multipartUploadId (tab closed / recovery / dashboard). */
  abortMultipartUpload: (id: number) =>
    apiFetch(`/recordings/${id}/multipart-upload`, {
      method: "DELETE",
      body: JSON.stringify({}),
    }),
  /** Main + camera multipart sessions still open (recovery UI). */
  getRecordingUploadState: (id: number) =>
    apiFetch(`/recordings/${id}/upload-state`, { method: "GET" }),
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
  getCameraTrackUploadedParts: (
    id: number,
    uploadId: string,
    workspaceId?: string | number,
  ) => {
    const sp = new URLSearchParams();
    if (workspaceId != null && workspaceId !== "") {
      sp.set("workspaceId", String(workspaceId));
    }
    const query = sp.toString();
    return apiFetch<{
      status: string;
      message: string;
      parts: unknown[];
    }>(
      `/recordings/${id}/camera-track/uploads/${uploadId}/parts${query ? `?${query}` : ""}`,
      {
        method: "GET",
      },
    );
  },
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
        /** Backend: recordings that need main or camera multipart completion */
        unfinishedMultipart?: boolean;
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
    if (params.filters?.unfinishedMultipart) {
      sp.set("filters[unfinishedMultipart]", "true");
    }
    return apiFetch(`/recordings/my-recordings?${sp}`);
  },
  myTrashRecordings: () => {
    const selectedWorkspaceId = getSelectedWorkspaceId();
    return apiFetch(
      `/recordings/trash-recordings?workspaceId=${selectedWorkspaceId}`,
      {
        method: "GET",
      },
    );
  },
  myTrashRecordingsWithFilters: (
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
        unfinishedMultipart?: boolean;
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
    if (params.filters?.endDate)
      sp.set("filters[endDate]", params.filters.endDate);
    if (params.filters?.unfinishedMultipart) {
      sp.set("filters[unfinishedMultipart]", "true");
    }
    return apiFetch(`/recordings/trash-recordings?${sp}`, { method: "GET" });
  },
  update: (id: number, data: { title?: string; visibility?: string }) =>
    apiFetch(`/recordings/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    }),
  delete: (
    id: number,
    workspaceId?: string,
    options?: { permanent?: boolean },
  ) =>
    apiFetch(
      `/recordings/${id}${options?.permanent ? "?permanent=true" : ""}`,
      {
        method: "DELETE",
        body: JSON.stringify(workspaceId ? { workspaceId } : {}),
      },
    ),
  removeWatermark: (id: number, workspaceId?: string) =>
    apiFetch(`/recordings/remove-watermark/${id}`, {
      method: "POST",
      body: JSON.stringify(workspaceId ? { workspaceId } : {}),
    }),
  reprocess: (id: number, workspaceId?: string | number) => {
    const resolvedWorkspaceId = workspaceId ?? getSelectedWorkspaceId();
    return apiFetch(`/recordings/reprocess/${id}`, {
      method: "POST",
      body: JSON.stringify(
        resolvedWorkspaceId != null && resolvedWorkspaceId !== ""
          ? { workspaceId: String(resolvedWorkspaceId) }
          : {},
      ),
    });
  },
  downloadVideo: (id: number, workspaceId?: string) =>
    apiFetch(`/recordings/download-video/${id}`, {
      method: "POST",
      body: JSON.stringify(workspaceId ? { workspaceId } : {}),
    }),
  getPublicLink: (id: number) => apiFetch(`/recordings/public-link/${id}`),
  previewLink: (token: string) =>
    apiFetch(`/recordings/preview-link/${token}`, { skipAuth: true }),
  restore: (id: number, workspaceId?: string) =>
    apiFetch(`/recordings/restore/${id}`, {
      method: "PATCH",
      body: JSON.stringify(workspaceId ? { workspaceId } : {}),
    }),
};

// Subscriptions
export const subscriptionApi = {
  create: (data: {
    type: "monthly" | "yearly" | "null";
    planId: string;
    workspaceId: string;
    recurringConsent?: boolean;
    country?: string;
    billingData?: {
      first_name?: string;
      last_name?: string;
      email?: string;
      phone_number?: string;
      apartment?: string;
      floor?: string;
      street?: string;
      building?: string;
      shipping_method?: string;
      postal_code?: string;
      city?: string;
      country?: string;
      state?: string;
    };
  }) =>
    apiFetch("/subscription", { method: "POST", body: JSON.stringify(data) }),
  update: (id: number) =>
    apiFetch(`/subscription/update/${id}`, { method: "PATCH" }),
  downgrade: (
    id: number,
    data: {
      type: "null";
      planId: string;
      workspaceId: string;
      subscriptionId: string;
    },
  ) =>
    apiFetch(`/subscription/downgrade/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    }),
  details: (id: number) => apiFetch(`/subscription/details/${id}`),
  paymobStatus: (id: number) => apiFetch(`/subscription/paymob/status/${id}`),
  upgrade: (
    id: number,
    data: {
      type: string;
      planId: string;
      id: string;
      workspaceId: string;
      country?: string;
      billingData?: {
        first_name?: string;
        last_name?: string;
        email?: string;
        phone_number?: string;
        apartment?: string;
        floor?: string;
        street?: string;
        building?: string;
        shipping_method?: string;
        postal_code?: string;
        city?: string;
        country?: string;
        state?: string;
      };
    },
  ) =>
    apiFetch(`/subscription/upgrade/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    }),
};

export const paymentsApi = {
  createCheckoutSession: (data: {
    planId: string;
    workspaceId: string;
    type?: "monthly" | "yearly";
    recurringConsent?: boolean;
    country?: string;
    promoCode?: string;
    billingData?: {
      first_name?: string;
      last_name?: string;
      email?: string;
      phone_number?: string;
      apartment?: string;
      floor?: string;
      street?: string;
      building?: string;
      shipping_method?: string;
      postal_code?: string;
      city?: string;
      country?: string;
      state?: string;
    };
    subscriptionId?: number;
  }) =>
    apiFetch("/subscription/checkout-session", {
      method: "POST",
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
  getAll: (
    params: { page?: number; limit?: number; order?: "DESC" | "ASC" } = {},
  ) => {
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

// Analytics
export const analyticsApi = {
  trackEvent: (data: {
    eventType: "click" | "recording_created" | "recording_completed";
    eventName: string;
    metadata?: Record<string, unknown>;
  }) =>
    apiFetch("/analytics/events", {
      method: "POST",
      body: JSON.stringify(data),
    }),
};

// Feedback
export const feedbackApi = {
  create: (data: {
    rating: number;
    comment: string;
    isWebsiteSuccessful: boolean;
  }) =>
    apiFetch("/feedback", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  getMy: (
    params: { page?: number; limit?: number; order?: "DESC" | "ASC" } = {},
  ) => {
    const sp = new URLSearchParams();
    if (params.page) sp.set("page", String(params.page));
    if (params.limit) sp.set("limit", String(params.limit));
    if (params.order) sp.set("order", params.order);
    const query = sp.toString();
    return apiFetch(`/feedback/my${query ? `?${query}` : ""}`);
  },
  update: (
    feedbackId: number,
    data: {
      rating?: number;
      comment?: string;
      isWebsiteSuccessful?: boolean;
    },
  ) =>
    apiFetch(`/feedback/${feedbackId}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    }),
  delete: (feedbackId: number) =>
    apiFetch(`/feedback/${feedbackId}`, {
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
        workspaceId?: string;
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
      if (params.workspaceId) sp.set("workspaceId", params.workspaceId);
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
    trashList: (
      params: {
        limit?: number;
        page?: number;
        order?: string;
        workspaceId?: string;
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
      if (params.workspaceId) sp.set("workspaceId", params.workspaceId);
      if (params.filters?.status)
        sp.set("filters[status]", params.filters.status);
      if (params.filters?.title) sp.set("filters[title]", params.filters.title);
      if (params.filters?.visibility)
        sp.set("filters[visibility]", params.filters.visibility);
      if (params.filters?.startDate)
        sp.set("filters[startDate]", params.filters.startDate);
      if (params.filters?.endDate)
        sp.set("filters[endDate]", params.filters.endDate);
      return apiFetch(`/recordings/trash-recordings?${sp}`);
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
  paymobSubscriptionPlans: {
    list: () => apiFetch("/super-admin/paymob/subscription-plans"),
    update: (
      planId: string | number,
      data: {
        amountCents: number;
        integration: number;
        numberOfDeductions?: number | null;
      },
    ) =>
      apiFetch(`/super-admin/paymob/subscription-plans/${planId}`, {
        method: "PATCH",
        body: JSON.stringify(data),
      }),
    suspend: (planId: string | number) =>
      apiFetch(`/super-admin/paymob/subscription-plans/${planId}/suspend`, {
        method: "POST",
        body: JSON.stringify({}),
      }),
    resume: (planId: string | number) =>
      apiFetch(`/super-admin/paymob/subscription-plans/${planId}/resume`, {
        method: "POST",
        body: JSON.stringify({}),
      }),
  },
  paymobSubscriptions: {
    incomplete: () => apiFetch("/subscription/paymob/incomplete"),
    repair: (mode: "relink" | "mark_invalid" = "relink") =>
      apiFetch(`/subscription/paymob/repair?mode=${encodeURIComponent(mode)}`, {
        method: "POST",
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
  analytics: {
    overview: () => apiFetch("/analytics/overview"),
    events: (
      params: {
        page?: number;
        limit?: number;
        order?: "DESC" | "ASC";
        filters?: { eventType?: string };
      } = {},
    ) => {
      const sp = new URLSearchParams();
      if (params.page) sp.set("page", String(params.page));
      if (params.limit) sp.set("limit", String(params.limit));
      if (params.order) sp.set("order", params.order);
      if (params.filters?.eventType) {
        sp.set("filters[eventType]", params.filters.eventType);
      }
      return apiFetch(`/analytics/events?${sp}`);
    },
  },
  feedback: {
    overview: () => apiFetch("/feedback/overview"),
    list: (
      params: {
        page?: number;
        limit?: number;
        order?: "DESC" | "ASC";
        filters?: { rating?: number; isWebsiteSuccessful?: boolean };
      } = {},
    ) => {
      const sp = new URLSearchParams();
      if (params.page) sp.set("page", String(params.page));
      if (params.limit) sp.set("limit", String(params.limit));
      if (params.order) sp.set("order", params.order);
      if (params.filters?.rating != null) {
        sp.set("filters[rating]", String(params.filters.rating));
      }
      if (params.filters?.isWebsiteSuccessful != null) {
        sp.set(
          "filters[isWebsiteSuccessful]",
          String(params.filters.isWebsiteSuccessful),
        );
      }
      return apiFetch(`/feedback/all?${sp}`);
    },
  },
  subscriptions: {
    list: (
      params: {
        page?: number;
        limit?: number;
        order?: "DESC" | "ASC";
        status?: "active" | "canceled" | "past_due" | "pending";
        type?: "monthly" | "yearly" | "none";
        dateFrom?: string;
        dateTo?: string;
      } = {},
    ) => {
      const sp = new URLSearchParams();
      if (params.page) sp.set("page", String(params.page));
      if (params.limit) sp.set("limit", String(params.limit));
      if (params.order) sp.set("order", params.order);
      if (params.status) sp.set("status", params.status);
      if (params.type) sp.set("type", params.type);
      if (params.dateFrom) sp.set("dateFrom", params.dateFrom);
      if (params.dateTo) sp.set("dateTo", params.dateTo);
      const query = sp.toString();
      return apiFetch(`/super-admin/subscriptions${query ? `?${query}` : ""}`);
    },
  },
};
