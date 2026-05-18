import { useEffect, useState } from "react";
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
  const { refreshUser, lastAuthError } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const [googleLoading, setGoogleLoading] = useState(false);

  const handleGoogleLogin = () => {
    localStorage.setItem(PENDING_GOOGLE_LOGIN_KEY, "1");
    window.location.href = `${API_BASE_URL}/auth/google`;
  };

  useEffect(() => {
    async function completeGoogleLogin() {
      const inviteToken = getPendingInviteToken();
      const postLoginPath = inviteToken
        ? `/workspace/accept-invite?token=${encodeURIComponent(inviteToken)}`
        : "/dashboard";
      const sp = new URLSearchParams(location.search);
      const googleFlag = sp.get("google");
      const accessTokenFromQuery = sp.get("accessToken");

      if (googleFlag === "1" && accessTokenFromQuery) {
        setGoogleLoading(true);
        try {
          const refreshTokenFromQuery = sp.get("refreshToken");
          setAccessToken(accessTokenFromQuery);
          if (refreshTokenFromQuery) setRefreshToken(refreshTokenFromQuery);
          const meOk = await refreshUser();
          if (!meOk) {
            throw new Error(lastAuthError || "Could not verify login session.");
          }
          localStorage.removeItem(PENDING_GOOGLE_LOGIN_KEY);
          toastSuccess(t("toast.signedIn"), t("toast.googleLoginSuccess"));
          navigate(postLoginPath, { replace: true });
        } catch (err: unknown) {
          if (!isIgnorableGoogleCorsError(err)) {
            const errMsg = (err as { message?: string })?.message || "Please try again.";
            if (isInactiveAuthError(errMsg)) {
              onInactiveError?.(hintEmail);
            }
            toast({
              title: t("toast.googleLoginFailed"),
              description: errMsg,
              variant: "destructive",
            });
          }
        } finally {
          setGoogleLoading(false);
        }
        return;
      }

      if (localStorage.getItem(PENDING_GOOGLE_LOGIN_KEY) !== "1") return;

      setGoogleLoading(true);
      try {
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
        if (!meOk) {
          throw new Error(lastAuthError || "Could not verify login session.");
        }
        localStorage.removeItem(PENDING_GOOGLE_LOGIN_KEY);
        toastApiSuccess(data, {
          title: t("toast.signedIn"),
          fallbackDescription: t("toast.googleLoginSuccess"),
        });
        navigate(postLoginPath, { replace: true });
      } catch (err: unknown) {
        localStorage.removeItem(PENDING_GOOGLE_LOGIN_KEY);
        if (!isIgnorableGoogleCorsError(err)) {
          const errMsg = (err as { message?: string })?.message || "Please try again.";
          if (isInactiveAuthError(errMsg)) {
            onInactiveError?.(hintEmail);
          }
          toast({
            title: t("toast.googleLoginFailed"),
            description: errMsg,
            variant: "destructive",
          });
        }
      } finally {
        setGoogleLoading(false);
      }
    }

    void completeGoogleLogin();
  }, [hintEmail, lastAuthError, location.search, navigate, onInactiveError, refreshUser, t, toast]);

  return { googleLoading, handleGoogleLogin, GoogleIcon };
}
