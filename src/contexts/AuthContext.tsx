import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from "react";
import { authApi, setAccessToken, setRefreshToken, getAccessToken, getRefreshToken, getSelectedWorkspaceId, setSelectedWorkspaceId as persistSelectedWorkspaceId } from "@/lib/api";
import { connectSocket, disconnectSocket, reconnectSocketWithLatestToken } from "@/lib/socket";

interface Workspace {
  id: number;
  name: string;
  slug: string;
  [key: string]: any;
}

interface User {
  id: number;
  user_name: string;
  email: string;
  workspaces?: Workspace[];
  avatar?: string;
  [key: string]: any;
}

interface AuthContextType {
  user: User | null;
  selectedWorkspaceId: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<any>;
  register: (data: { user_name: string; email: string; password: string; confirmPassword: string }) => Promise<any>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  setSelectedWorkspaceId: (workspaceId: string | null) => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [selectedWorkspaceId, setSelectedWorkspaceIdState] = useState<string | null>(() => getSelectedWorkspaceId());
  const [loading, setLoading] = useState(true);
  const refreshingTokenRef = useRef(false);

  const setSelectedWorkspaceId = useCallback((workspaceId: string | null) => {
    setSelectedWorkspaceIdState(workspaceId);
    persistSelectedWorkspaceId(workspaceId);
  }, []);

  const refreshUser = useCallback(async () => {
    try {
      const data = await authApi.me();
      const profile = data.user || data;
      setUser(profile);

      const workspaceIds = (profile.workspaces || []).map((ws: Workspace) => String(ws.id));
      if (selectedWorkspaceId && !workspaceIds.includes(selectedWorkspaceId)) {
        setSelectedWorkspaceId(null);
      }

      connectSocket();
    } catch {
      setUser(null);
      setAccessToken(null);
      setRefreshToken(null);
      setSelectedWorkspaceId(null);
      disconnectSocket();
    }
  }, [selectedWorkspaceId, setSelectedWorkspaceId]);

  const forceLogout = useCallback(() => {
    setAccessToken(null);
    setRefreshToken(null);
    setUser(null);
    setSelectedWorkspaceId(null);
    disconnectSocket();
  }, [setSelectedWorkspaceId]);

  useEffect(() => {
    if (getAccessToken()) {
      refreshUser().finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [refreshUser]);

  useEffect(() => {
    if (!user || !getAccessToken()) return;

    const refreshAccessToken = async () => {
      if (refreshingTokenRef.current) return;
      if (!getAccessToken()) return;

      refreshingTokenRef.current = true;
      try {
        const currentRefreshToken = getRefreshToken();
        if (!currentRefreshToken) throw new Error("No refresh token available.");

        const res = await authApi.refreshToken({
          refreshToken: currentRefreshToken,
        });
        const token = res?.accessToken || res?.token || res?.data?.accessToken;
        const refresh = res?.refreshToken || res?.data?.refreshToken;
        if (!token) throw new Error("Refresh endpoint did not return access token.");
        const previous = getAccessToken();
        setAccessToken(token);
        if (refresh) setRefreshToken(refresh);
        if (token !== previous) reconnectSocketWithLatestToken();
      } catch {
        forceLogout();
      } finally {
        refreshingTokenRef.current = false;
      }
    };

    // Refresh every 9 minutes, starting 9 minutes after login/session start.
    const intervalId = window.setInterval(() => {
      void refreshAccessToken();
    }, 9 * 60 * 1000);

    return () => window.clearInterval(intervalId);
  }, [user, forceLogout]);

  // Keep Socket.IO connected for the whole logged-in session and heal after idle/network/tab changes.
  useEffect(() => {
    if (!user || !getAccessToken()) return;

    connectSocket();

    const onBecameActive = () => {
      if (!getAccessToken()) return;
      if (document.visibilityState === "visible") connectSocket();
    };

    const onOnline = () => {
      if (getAccessToken()) connectSocket();
    };

    const onUserActivity = () => {
      if (getAccessToken()) connectSocket();
    };

    document.addEventListener("visibilitychange", onBecameActive);
    window.addEventListener("online", onOnline);
    window.addEventListener("focus", onUserActivity);

    return () => {
      document.removeEventListener("visibilitychange", onBecameActive);
      window.removeEventListener("online", onOnline);
      window.removeEventListener("focus", onUserActivity);
    };
  }, [user]);

  const login = async (email: string, password: string) => {
    const res = await authApi.login({ email, password });
    const token = res.accessToken || res.token;
    const refresh = res.refreshToken || res.data?.refreshToken;
    if (token) {
      setAccessToken(token);
      if (refresh) setRefreshToken(refresh);
      await refreshUser();
    }
    return res;
  };

  const register = async (data: { user_name: string; email: string; password: string; confirmPassword: string }) => {
    return authApi.register(data);
  };

  const logout = async () => {
    try { await authApi.logout(); } catch {}
    setAccessToken(null);
    setRefreshToken(null);
    setUser(null);
    setSelectedWorkspaceId(null);
    disconnectSocket();
  };

  return (
    <AuthContext.Provider value={{ user, selectedWorkspaceId, loading, login, register, logout, refreshUser, setSelectedWorkspaceId }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
