import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate, Link } from "react-router-dom";
import { authApi } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { toastApiSuccess } from "@/lib/appToast";
import { Loader2 } from "lucide-react";
import Logo from "@/components/Logo";
import AuthPageShell from "@/components/AuthPageShell";

export default function ForgotPasswordPage() {
  const { t } = useTranslation(["auth", "common"]);
  const navigate = useNavigate();
  const { toast } = useToast();
  const [step, setStep] = useState<"email" | "reset">("email");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await authApi.forgotPassword(email);
      toastApiSuccess(res, {
        title: t("auth:toast.codeSent"),
        fallbackDescription: t("auth:toast.checkEmailReset"),
      });
      setStep("reset");
    } catch (err: any) {
      toast({ title: t("common:toast.error"), description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      toast({ title: t("auth:toast.passwordsMismatch"), variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      const res = await authApi.resetPassword({ email, otp, password, confirmPassword });
      toastApiSuccess(res, {
        title: t("auth:toast.passwordReset"),
        fallbackDescription: t("auth:toast.canLoginNow"),
      });
      navigate("/login");
    } catch (err: any) {
      toast({ title: t("common:toast.error"), description: err.message, variant: "destructive" });
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
              <CardTitle className="text-xl">
                {step === "email" ? t("auth:forgot.titleForgot") : t("auth:forgot.titleReset")}
              </CardTitle>
              <CardDescription>
                {step === "email" ? t("auth:forgot.subtitleSend") : t("auth:forgot.subtitleEnter")}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {step === "email" ? (
                <form onSubmit={handleSendOtp} className="space-y-4">
                  <div className="space-y-2">
                    <Label>{t("common:labels.email")}</Label>
                    <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
                  </div>
                  <Button type="submit" className="w-full gradient-primary" disabled={loading}>
                    {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : t("auth:forgot.sendCode")}
                  </Button>
                </form>
              ) : (
                <form onSubmit={handleReset} className="space-y-4">
                  <div className="space-y-2">
                    <Label>{t("auth:forgot.code")}</Label>
                    <Input value={otp} onChange={(e) => setOtp(e.target.value)} required />
                  </div>
                  <div className="space-y-2">
                    <Label>{t("auth:forgot.newPassword")}</Label>
                    <PasswordInput value={password} onChange={(e) => setPassword(e.target.value)} required />
                  </div>
                  <div className="space-y-2">
                    <Label>{t("common:labels.confirmPassword")}</Label>
                    <PasswordInput
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                    />
                  </div>
                  <Button type="submit" className="w-full gradient-primary" disabled={loading}>
                    {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : t("auth:forgot.resetPassword")}
                  </Button>
                </form>
              )}
              <p className="mt-4 text-center text-sm text-muted-foreground">
                <Link to="/login" className="text-primary hover:underline">
                  {t("auth:forgot.backToLogin")}
                </Link>
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </AuthPageShell>
  );
}
