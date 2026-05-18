import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate, Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { toastApiSuccess } from "@/lib/appToast";
import { authApi } from "@/lib/api";
import { getPendingInviteToken } from "@/lib/inviteFlow";
import { isInactiveAuthError, useGoogleAuth } from "@/hooks/useGoogleAuth";
import { Loader2 } from "lucide-react";
import Logo from "@/components/Logo";
import AuthPageShell from "@/components/AuthPageShell";

export default function LoginPage() {
  const { t } = useTranslation(["auth", "common"]);
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showActivateAccount, setShowActivateAccount] = useState(false);
  const [requestActivationDialogOpen, setRequestActivationDialogOpen] = useState(false);
  const [activationDialogOpen, setActivationDialogOpen] = useState(false);
  const [requestActivationEmail, setRequestActivationEmail] = useState("");
  const [activationEmail, setActivationEmail] = useState("");
  const [activationOtp, setActivationOtp] = useState("");
  const [sendingActivationOtp, setSendingActivationOtp] = useState(false);
  const [activatingAccount, setActivatingAccount] = useState(false);
  const { googleLoading, handleGoogleLogin, GoogleIcon } = useGoogleAuth({
    hintEmail: email,
    onInactiveError: (hint) => {
      setShowActivateAccount(true);
      setActivationEmail((prev) => prev || hint);
    },
  });

  const handleRequestActivation = async () => {
    const targetEmail = requestActivationEmail.trim();
    if (!targetEmail) {
      toast({
        title: t("auth:toast.emailRequired"),
        description: t("auth:toast.enterEmail"),
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
        title: t("auth:toast.activationOtpSent"),
        fallbackDescription: t("auth:toast.checkEmailActivate"),
      });
    } catch (err: any) {
      toast({
        title: t("auth:toast.activationFailed"),
        description: err.message,
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
        title: t("auth:toast.accountActivated"),
        fallbackDescription: t("auth:toast.canLogin"),
      });
    } catch (err: any) {
      toast({
        title: t("auth:toast.activationVerifyFailed"),
        description: err.message,
        variant: "destructive",
      });
    } finally {
      setActivatingAccount(false);
    }
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const loginRes = await login(email, password);
      setShowActivateAccount(false);
      toastApiSuccess(loginRes, {
        title: t("auth:toast.signedIn"),
        fallbackDescription: t("auth:toast.welcomeBack"),
      });
      const inviteToken = getPendingInviteToken();
      if (inviteToken) {
        navigate(`/workspace/accept-invite?token=${encodeURIComponent(inviteToken)}`);
      } else {
        navigate("/dashboard");
      }
    } catch (err: any) {
      const errMsg = err?.message || "Please try again.";
      if (isInactiveAuthError(errMsg)) {
        setShowActivateAccount(true);
        setActivationEmail(email.trim());
      } else {
        setShowActivateAccount(false);
      }
      toast({ title: t("auth:toast.loginFailed"), description: errMsg, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthPageShell>
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="w-full max-w-md animate-fade-in">
          <Link to="/" className="flex items-center justify-center gap-2 mb-8">
            <Logo imageClassName="h-auto" />
          </Link>
          <Card className="glass">
            <CardHeader className="text-center">
              <CardTitle className="text-xl">{t("auth:login.title")}</CardTitle>
              <CardDescription>{t("auth:login.subtitle")}</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">{t("common:labels.email")}</Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder={t("common:placeholders.email")}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">{t("common:labels.password")}</Label>
                  <PasswordInput
                    id="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder={t("common:placeholders.password")}
                    required
                  />
                </div>
                <Button type="submit" className="w-full gradient-primary" disabled={loading || googleLoading}>
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : t("auth:login.signIn")}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  onClick={handleGoogleLogin}
                  disabled={googleLoading}
                >
                  {googleLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                  {!googleLoading ? <GoogleIcon /> : null}
                  <span className={googleLoading ? "" : "ml-2"}>{t("auth:login.google")}</span>
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
                    {t("auth:login.activateAccount")}
                  </Button>
                )}
              </form>
              <div className="mt-4 text-center text-sm text-muted-foreground space-y-1">
                <Link to="/forgot-password" className="text-primary hover:underline block">
                  {t("auth:login.forgotPassword")}
                </Link>
                <p>
                  {t("auth:login.noAccount")}{" "}
                  <Link to="/register" className="text-primary hover:underline">
                    {t("common:actions.signUp")}
                  </Link>
                </p>
              </div>
              <div className="mt-4 text-center text-sm text-muted-foreground flex gap-4 justify-center border-t pt-3">
                <Link to="/privacy-policy" className="text-primary underline">
                  {t("common:nav.privacyPolicy")}
                </Link>
                <Link to="/terms-and-conditions" className="text-primary underline">
                  {t("auth:login.termsLink")}
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>

        <Dialog open={requestActivationDialogOpen} onOpenChange={setRequestActivationDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{t("auth:activate.title")}</DialogTitle>
              <DialogDescription>{t("auth:activate.requestDescription")}</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="request_activation_email">{t("common:labels.email")}</Label>
                <Input
                  id="request_activation_email"
                  type="email"
                  value={requestActivationEmail}
                  onChange={(e) => setRequestActivationEmail(e.target.value)}
                  placeholder={t("common:placeholders.email")}
                />
              </div>
              <Button
                className="w-full gradient-primary"
                onClick={() => void handleRequestActivation()}
                disabled={sendingActivationOtp || !requestActivationEmail.trim()}
              >
                {sendingActivationOtp ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  t("auth:activate.sendOtp")
                )}
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        <Dialog open={activationDialogOpen} onOpenChange={setActivationDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{t("auth:activate.title")}</DialogTitle>
              <DialogDescription>{t("auth:activate.verifyDescription")}</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="activation_email">{t("common:labels.email")}</Label>
                <Input
                  id="activation_email"
                  type="email"
                  value={activationEmail}
                  onChange={(e) => setActivationEmail(e.target.value)}
                  placeholder={t("common:placeholders.email")}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="activation_otp">{t("common:labels.otp")}</Label>
                <Input
                  id="activation_otp"
                  value={activationOtp}
                  onChange={(e) => setActivationOtp(e.target.value)}
                  placeholder={t("common:placeholders.otp")}
                />
              </div>
              <Button
                className="w-full gradient-primary"
                onClick={() => void handleVerifyActivation()}
                disabled={activatingAccount || !activationEmail.trim() || !activationOtp.trim()}
              >
                {activatingAccount ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  t("auth:activate.verifyActivate")
                )}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </AuthPageShell>
  );
}
