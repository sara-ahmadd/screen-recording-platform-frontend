import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { toastApiSuccess } from "@/lib/appToast";
import { useGoogleAuth } from "@/hooks/useGoogleAuth";
import { Loader2 } from "lucide-react";
import Logo from "@/components/Logo";
import AuthPageShell from "@/components/AuthPageShell";

export default function RegisterPage() {
  const { t } = useTranslation(["auth", "common"]);
  const { register } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [form, setForm] = useState({ user_name: "", email: "", password: "", confirmPassword: "" });
  const [loading, setLoading] = useState(false);
  const { googleLoading, handleGoogleLogin, GoogleIcon } = useGoogleAuth({ hintEmail: form.email });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.password !== form.confirmPassword) {
      toast({ title: t("auth:toast.passwordsMismatch"), variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      const res = await register(form);
      toastApiSuccess(res, {
        title: t("auth:toast.accountCreated"),
        fallbackDescription: t("auth:toast.checkEmailRegister"),
      });
      navigate("/verify", { state: { email: form.email } });
    } catch (err: any) {
      toast({ title: t("auth:toast.registrationFailed"), description: err.message, variant: "destructive" });
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
              <CardTitle className="text-xl">{t("auth:register.title")}</CardTitle>
              <CardDescription>{t("auth:register.subtitle")}</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label>{t("common:labels.username")}</Label>
                  <Input
                    value={form.user_name}
                    onChange={(e) => setForm({ ...form, user_name: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>{t("common:labels.email")}</Label>
                  <Input
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>{t("common:labels.password")}</Label>
                  <PasswordInput
                    value={form.password}
                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>{t("common:labels.confirmPassword")}</Label>
                  <PasswordInput
                    value={form.confirmPassword}
                    onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
                    required
                  />
                </div>
                <Button type="submit" className="w-full gradient-primary" disabled={loading || googleLoading}>
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : t("auth:register.createAccount")}
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
              </form>
              <p className="mt-4 text-center text-sm text-muted-foreground">
                {t("auth:register.hasAccount")}{" "}
                <Link to="/login" className="text-primary hover:underline">
                  {t("common:actions.signIn")}
                </Link>
              </p>
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
      </div>
    </AuthPageShell>
  );
}
