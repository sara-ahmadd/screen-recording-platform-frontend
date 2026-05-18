import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useLocation, useNavigate, Link } from "react-router-dom";
import { authApi } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { toastApiSuccess } from "@/lib/appToast";
import { Loader2 } from "lucide-react";
import Logo from "@/components/Logo";
import AuthPageShell from "@/components/AuthPageShell";

export default function VerifyPage() {
  const { t } = useTranslation(["auth", "common"]);
  const location = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [email, setEmail] = useState((location.state as any)?.email || "");
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await authApi.verify({ email, otp });
      toastApiSuccess(res, {
        title: t("auth:toast.emailVerified"),
        fallbackDescription: t("auth:toast.canLogin"),
      });
      navigate("/login");
    } catch (err: any) {
      toast({ title: t("auth:toast.verificationFailed"), description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setResending(true);
    try {
      const res = await authApi.resendOtp(email);
      toastApiSuccess(res, { title: t("auth:toast.otpResent"), fallbackDescription: t("auth:toast.checkEmail") });
    } catch (err: any) {
      toast({ title: t("auth:toast.resendFailed"), description: err.message, variant: "destructive" });
    } finally {
      setResending(false);
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
              <CardTitle className="text-xl">{t("auth:verify.title")}</CardTitle>
              <CardDescription>{t("auth:verify.subtitle")}</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleVerify} className="space-y-4">
                <div className="space-y-2">
                  <Label>{t("common:labels.email")}</Label>
                  <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
                </div>
                <div className="space-y-2">
                  <Label>{t("auth:verify.codeLabel")}</Label>
                  <Input
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    placeholder={t("common:placeholders.otp")}
                    required
                  />
                </div>
                <Button type="submit" className="w-full gradient-primary" disabled={loading}>
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : t("auth:verify.verify")}
                </Button>
              </form>
              <Button
                variant="ghost"
                className="w-full mt-2 text-muted-foreground"
                onClick={handleResend}
                disabled={resending}
              >
                {resending ? t("common:actions.sending") : t("auth:verify.resend")}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </AuthPageShell>
  );
}
