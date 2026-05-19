import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { toastApiSuccess, toastSuccess } from "@/lib/appToast";
import { setAccessToken, setRefreshToken } from "@/lib/api";
import { getPendingInviteToken } from "@/lib/inviteFlow";
import GoogleIcon from "@/components/GoogleIcon";

const PENDING_GOOGLE_LOGIN_KEY = "pending_google_login";
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

const isIgnorableGoogleCorsError = (err: unknown) => {
  const msg = String((err as { message?: string })?.message || "").toLowerCase();
  return (
    msg.includes("failed to fetch") ||
    msg.includes("networkerror") ||
    msg.includes("cors") ||
    msg.includes("accounts.google.com/o/oauth2/v2/auth")
  );
};

export const isInactiveAuthError = (message?: string) =>
  String(message || "").toLowerCase().includes("inactive");

type UseGoogleAuthOptions = {
  hintEmail?: string;
  onInactiveError?: (email: string) => void;
};

export function useGoogleAuth(options: UseGoogleAuthOptions = {}) {
  const { hintEmail = "", onInactiveError } = options;
  const { t } = useTranslation("auth");
  const { refreshUser } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const [googleLoading, setGoogleLoading] = useState(false);

  const hintEmailRef = useRef(hintEmail);
  const onInactiveErrorRef = useRef(onInactiveError);
  const handledSearchRef = useRef<string | null>(null);
  const inFlightRef = useRef(false);

  hintEmailRef.current = hintEmail;
  onInactiveErrorRef.current = onInactiveError;

  const handleGoogleLogin = () => {
    handledSearchRef.current = null;
    localStorage.setItem(PENDING_GOOGLE_LOGIN_KEY, "1");
    window.location.href = `${API_BASE_URL}/auth/google`;
  };

  useEffect(() => {
    const search = location.search;
    if (handledSearchRef.current === search) return;

    async function completeGoogleLogin() {
      const inviteToken = getPendingInviteToken();
      const postLoginPath = inviteToken
        ? `/workspace/accept-invite?token=${encodeURIComponent(inviteToken)}`
        : "/dashboard";
      const sp = new URLSearchParams(search);
      const googleFlag = sp.get("google");
      const accessTokenFromQuery = sp.get("accessToken");
      const hasQueryTokens = googleFlag === "1" && Boolean(accessTokenFromQuery);
      const hasPendingCallback = localStorage.getItem(PENDING_GOOGLE_LOGIN_KEY) === "1";

      if (!hasQueryTokens && !hasPendingCallback) return;
      if (inFlightRef.current) return;

      inFlightRef.current = true;
      handledSearchRef.current = search;
      setGoogleLoading(true);

      try {
        if (hasQueryTokens && accessTokenFromQuery) {
          const refreshTokenFromQuery = sp.get("refreshToken");
          setAccessToken(accessTokenFromQuery);
          if (refreshTokenFromQuery) setRefreshToken(refreshTokenFromQuery);
        } else if (hasPendingCallback) {
          const res = await fetch(`${API_BASE_URL}/auth/google/callback`, {
            method: "GET",
            credentials: "include",
          });
          if (!res.ok) throw new Error("Google login callback failed");

          const data = await res.json();
          const token =
            data?.accessToken ||
            data?.token ||
            data?.data?.accessToken ||
            data?.user?.accessToken;
          const refresh =
            data?.refreshToken || data?.data?.refreshToken || data?.user?.refreshToken;
          if (!token) throw new Error("No access token returned");

          setAccessToken(token);
          if (refresh) setRefreshToken(refresh);

          const meOk = await refreshUser();
          if (!meOk) throw new Error("Could not verify login session.");

          localStorage.removeItem(PENDING_GOOGLE_LOGIN_KEY);
          toastApiSuccess(data, {
            title: t("toast.signedIn"),
            fallbackDescription: t("toast.googleLoginSuccess"),
          });
          navigate(postLoginPath, { replace: true });
          return;
        }

        const meOk = await refreshUser();
        if (!meOk) throw new Error("Could not verify login session.");

        localStorage.removeItem(PENDING_GOOGLE_LOGIN_KEY);
        toastSuccess(t("toast.signedIn"), t("toast.googleLoginSuccess"));
        navigate(postLoginPath, { replace: true });
      } catch (err: unknown) {
        handledSearchRef.current = null;
        localStorage.removeItem(PENDING_GOOGLE_LOGIN_KEY);
        if (!isIgnorableGoogleCorsError(err)) {
          const errMsg = (err as { message?: string })?.message || "Please try again.";
          if (isInactiveAuthError(errMsg)) {
            onInactiveErrorRef.current?.(hintEmailRef.current);
          }
          toast({
            title: t("toast.googleLoginFailed"),
            description: errMsg,
            variant: "destructive",
          });
        }
      } finally {
        inFlightRef.current = false;
        setGoogleLoading(false);
      }
    }

    void completeGoogleLogin();
  }, [location.search, navigate, refreshUser, t, toast]);

  return { googleLoading, handleGoogleLogin, GoogleIcon };
}
