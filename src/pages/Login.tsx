import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate, Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { toastApiSuccess, toastSuccess } from "@/lib/appToast";
import { authApi, setAccessToken, setRefreshToken } from "@/lib/api";
import { getPendingInviteToken } from "@/lib/inviteFlow";
import { Loader2, Monitor } from "lucide-react";

export default function LoginPage() {
  const { login, refreshUser, lastAuthError } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [showActivateAccount, setShowActivateAccount] = useState(false);
  const [requestActivationDialogOpen, setRequestActivationDialogOpen] = useState(false);
  const [activationDialogOpen, setActivationDialogOpen] = useState(false);
  const [requestActivationEmail, setRequestActivationEmail] = useState("");
  const [activationEmail, setActivationEmail] = useState("");
  const [activationOtp, setActivationOtp] = useState("");
  const [sendingActivationOtp, setSendingActivationOtp] = useState(false);
  const [activatingAccount, setActivatingAccount] = useState(false);
  const PENDING_GOOGLE_LOGIN_KEY = "pending_google_login";
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";
  const isIgnorableGoogleCorsError = (err: unknown) => {
    const msg = String((err as any)?.message || "").toLowerCase();
    return (
      msg.includes("failed to fetch") ||
      msg.includes("networkerror") ||
      msg.includes("cors") ||
      msg.includes("accounts.google.com/o/oauth2/v2/auth")
    );
  };
  const isInactiveError = (message?: string) =>
    String(message || "").toLowerCase().includes("inactive");

  const handleRequestActivation = async () => {
    const targetEmail = requestActivationEmail.trim();
    if (!targetEmail) {
      toast({
        title: "Email required",
        description: "Enter your email first.",
        variant: "destructive",
      });
      return;
    }
    setSendingActivationOtp(true);
    try {
      const res = await authApi.activateAccount({ email: targetEmail });
      setRequestActivationDialogOpen(false);
      setActivationEmail(targetEmail);
      setActivationOtp("");
      setActivationDialogOpen(true);
      toastApiSuccess(res, {
        title: "Activation OTP sent",
        fallbackDescription: "Check your email and enter OTP to activate your account.",
      });
    } catch (err: any) {
      toast({
        title: "Activation request failed",
        description: err.message || "Please try again.",
        variant: "destructive",
      });
    } finally {
      setSendingActivationOtp(false);
    }
  };

  const handleVerifyActivation = async () => {
    if (!activationEmail.trim() || !activationOtp.trim()) return;
    setActivatingAccount(true);
    try {
      const res = await authApi.verify({
        email: activationEmail.trim(),
        otp: activationOtp.trim(),
      });
      setActivationDialogOpen(false);
      setShowActivateAccount(false);
      setActivationOtp("");
      toastApiSuccess(res, {
        title: "Account activated",
        fallbackDescription: "Your account is now active. You can sign in.",
      });
    } catch (err: any) {
      toast({
        title: "Activation failed",
        description: err.message || "Invalid OTP.",
        variant: "destructive",
      });
    } finally {
      setActivatingAccount(false);
    }
  };

  const GoogleIcon = () => (
    <svg className="h-4 w-4" viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M21.805 10.023h-9.83v3.955h5.643c-.243 1.267-.973 2.34-2.07 3.055v2.537h3.35c1.96-1.806 3.087-4.47 3.087-7.57 0-.667-.06-1.307-.18-1.977z"
        fill="#4285F4"
      />
      <path
        d="M11.975 22c2.79 0 5.13-.923 6.84-2.43l-3.35-2.537c-.93.622-2.12.997-3.49.997-2.68 0-4.95-1.807-5.76-4.237H2.76v2.662A10.33 10.33 0 0011.975 22z"
        fill="#34A853"
      />
      <path
        d="M6.215 13.793a6.214 6.214 0 010-3.586V7.545H2.76a10.333 10.333 0 000 8.91l3.455-2.662z"
        fill="#FBBC05"
      />
      <path
        d="M11.975 6.97c1.518 0 2.88.522 3.952 1.547l2.963-2.963C17.1 3.86 14.76 3 11.975 3A10.33 10.33 0 002.76 7.545l3.455 2.662c.81-2.43 3.08-4.237 5.76-4.237z"
        fill="#EA4335"
      />
    </svg>
  );

  const handleGoogleLogin = () => {
    localStorage.setItem(PENDING_GOOGLE_LOGIN_KEY, "1");
    window.location.href = `${API_BASE_URL}/auth/google`;
  };

  useEffect(() => {
    const sp = new URLSearchParams(location.search);
    const inactiveFlag = sp.get("inactive");
    const hintedEmail = sp.get("email");
    if (inactiveFlag === "1") {
      setShowActivateAccount(true);
      if (hintedEmail) {
        setEmail(hintedEmail);
        setRequestActivationEmail(hintedEmail);
        setActivationEmail(hintedEmail);
      }
    }
  }, [location.search]);

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
          const meOk = await refreshUser(); // Calls GET /auth/me
          if (!meOk) {
            throw new Error(lastAuthError || "Could not verify login session.");
          }
          localStorage.removeItem(PENDING_GOOGLE_LOGIN_KEY);
          toastSuccess("Signed in", "Google login successful.");
          navigate(postLoginPath, { replace: true });
        } catch (err: any) {
          if (!isIgnorableGoogleCorsError(err)) {
            const errMsg = err?.message || "Please try again.";
            if (isInactiveError(errMsg)) {
              setShowActivateAccount(true);
              setActivationEmail((prev) => prev || email);
            }
            toast({
              title: "Google login failed",
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
          data?.refreshToken ||
          data?.data?.refreshToken ||
          data?.user?.refreshToken;
        if (!token) throw new Error("No access token returned");

        setAccessToken(token);
        if (refresh) setRefreshToken(refresh);
        const meOk = await refreshUser(); // Calls GET /auth/me
        if (!meOk) {
          throw new Error(lastAuthError || "Could not verify login session.");
        }
        localStorage.removeItem(PENDING_GOOGLE_LOGIN_KEY);
        toastApiSuccess(data, {
          title: "Signed in",
          fallbackDescription: "Google login successful.",
        });
        navigate(postLoginPath, { replace: true });
      } catch (err: any) {
        localStorage.removeItem(PENDING_GOOGLE_LOGIN_KEY);
        if (!isIgnorableGoogleCorsError(err)) {
          const errMsg = err?.message || "Please try again.";
          if (isInactiveError(errMsg)) {
            setShowActivateAccount(true);
            setActivationEmail((prev) => prev || email);
          }
          toast({
            title: "Google login failed",
            description: errMsg,
            variant: "destructive",
          });
        }
      } finally {
        setGoogleLoading(false);
      }
    }

    completeGoogleLogin();
  }, [API_BASE_URL, lastAuthError, location.search, navigate, refreshUser, toast]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const loginRes = await login(email, password);
      setShowActivateAccount(false);
      toastApiSuccess(loginRes, { title: "Signed in", fallbackDescription: "Welcome back." });
      const inviteToken = getPendingInviteToken();
      if (inviteToken) {
        navigate(`/workspace/accept-invite?token=${encodeURIComponent(inviteToken)}`);
      } else {
        navigate("/dashboard");
      }
    } catch (err: any) {
      const errMsg = err?.message || "Please try again.";
      if (isInactiveError(errMsg)) {
        setShowActivateAccount(true);
        setActivationEmail(email.trim());
      } else {
        setShowActivateAccount(false);
      }
      toast({ title: "Login failed", description: errMsg, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md animate-fade-in">
        <Link to="/" className="flex items-center justify-center gap-2 mb-8">
          <div className="gradient-primary rounded-xl p-2">
            <Monitor className="h-6 w-6 text-primary-foreground" />
          </div>
          <span className="text-2xl font-bold gradient-text">theRec</span>
        </Link>
        <Card className="glass">
          <CardHeader className="text-center">
            <CardTitle className="text-xl">Welcome back</CardTitle>
            <CardDescription>Sign in to your account</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <PasswordInput id="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" required />
              </div>
              <Button type="submit" className="w-full gradient-primary" disabled={loading || googleLoading}>
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Sign in"}
              </Button>
              <Button type="button" variant="outline" className="w-full" onClick={handleGoogleLogin} disabled={googleLoading}>
                {googleLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                {!googleLoading ? <GoogleIcon /> : null}
                {!googleLoading ? <span className="ml-2">Continue with Google</span> : "Continue with Google"}
              </Button>
              {showActivateAccount && (
                <Button
                  type="button"
                  variant="secondary"
                  className="w-full"
                  onClick={() => {
                    setRequestActivationEmail((prev) => prev || email.trim());
                    setRequestActivationDialogOpen(true);
                  }}
                >
                  Activate account
                </Button>
              )}
            </form>
            <div className="mt-4 text-center text-sm text-muted-foreground space-y-1">
              <Link to="/forgot-password" className="text-primary hover:underline block">Forgot password?</Link>
              <p>Don't have an account? <Link to="/register" className="text-primary hover:underline">Sign up</Link></p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Dialog open={requestActivationDialogOpen} onOpenChange={setRequestActivationDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Activate Account</DialogTitle>
            <DialogDescription>
              Enter the email address you want to activate.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="request_activation_email">Email</Label>
              <Input
                id="request_activation_email"
                type="email"
                value={requestActivationEmail}
                onChange={(e) => setRequestActivationEmail(e.target.value)}
                placeholder="you@example.com"
              />
            </div>
            <Button
              className="w-full gradient-primary"
              onClick={() => void handleRequestActivation()}
              disabled={sendingActivationOtp || !requestActivationEmail.trim()}
            >
              {sendingActivationOtp ? <Loader2 className="h-4 w-4 animate-spin" /> : "Send OTP"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={activationDialogOpen} onOpenChange={setActivationDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Activate Account</DialogTitle>
            <DialogDescription>
              Enter your email and the OTP sent to activate your account.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="activation_email">Email</Label>
              <Input
                id="activation_email"
                type="email"
                value={activationEmail}
                onChange={(e) => setActivationEmail(e.target.value)}
                placeholder="you@example.com"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="activation_otp">OTP</Label>
              <Input
                id="activation_otp"
                value={activationOtp}
                onChange={(e) => setActivationOtp(e.target.value)}
                placeholder="Enter OTP"
              />
            </div>
            <Button
              className="w-full gradient-primary"
              onClick={() => void handleVerifyActivation()}
              disabled={activatingAccount || !activationEmail.trim() || !activationOtp.trim()}
            >
              {activatingAccount ? <Loader2 className="h-4 w-4 animate-spin" /> : "Verify & Activate"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
