import { useTranslation } from "react-i18next";
import { useEffect, useRef, useState } from "react";
import { Link, useSearchParams, useNavigate } from "react-router-dom";
import { workspaceApi } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { CheckCircle2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  bindInviteTokenForSession,
  clearInviteFlowStorage,
} from "@/lib/inviteFlow";

export default function AcceptInvitePage() {
  const { t } = useTranslation(["errors", "common", "auth"]);
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, refreshUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [showSignupDialog, setShowSignupDialog] = useState(false);
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const inviteAcceptedRef = useRef(false);

  useEffect(() => {
    async function accept() {
      const token = searchParams.get("token");
      if (!token) {
        toast({ title: t("invalidInvite"), variant: "destructive" });
        setLoading(false);
        return;
      }

      if (inviteAcceptedRef.current) {
        setLoading(false);
        return;
      }

      bindInviteTokenForSession(token);

      if (!user) {
        setShowSignupDialog(true);
        setLoading(false);
        return;
      }

      try {
        await workspaceApi.acceptInvite(token);
        inviteAcceptedRef.current = true;
        clearInviteFlowStorage();
        await refreshUser();
        setShowSuccessDialog(true);
      } catch (err: any) {
        toast({
          title: t("inviteNotAccepted"),
          description: err.message,
          variant: "destructive",
        });
        setShowSignupDialog(true);
      } finally {
        setLoading(false);
      }
    }

    void accept();
  }, [user, searchParams, toast, refreshUser]);

  const goHome = () => {
    setShowSuccessDialog(false);
    navigate("/", { replace: true });
  };

  return (
    <>
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <div className="text-center">
          {loading ? (
            <>
              <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
              <p className="text-sm text-muted-foreground mt-3">{t("inviteProcessing")}</p>
            </>
          ) : (
            !showSuccessDialog && (
              <>
                <p className="text-lg font-semibold">{t("invitePending")}</p>
                <p className="text-sm text-muted-foreground mt-2">
                  {t("inviteComplete")}
                </p>
                <div className="flex items-center justify-center gap-2 mt-4">
                  <Link to="/register">
                    <Button className="gradient-primary">{t("common:actions.signUp")}</Button>
                  </Link>
                  <Link to="/login">
                    <Button variant="outline">{t("common:actions.signIn")}</Button>
                  </Link>
                </div>
              </>
            )
          )}
        </div>
      </div>

      <AlertDialog open={showSignupDialog} onOpenChange={setShowSignupDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("signupRequired")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("signupDialogDesc")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction onClick={() => navigate("/register")}>{t("goSignup")}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={showSuccessDialog} onOpenChange={() => {}}>
        <AlertDialogContent
          className="sm:max-w-md"
          onEscapeKeyDown={(e) => e.preventDefault()}
          onPointerDownOutside={(e) => e.preventDefault()}
        >
          <AlertDialogHeader className="sm:text-center">
            <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/15">
              <CheckCircle2 className="h-7 w-7 text-emerald-600 dark:text-emerald-400" aria-hidden />
            </div>
            <AlertDialogTitle className="text-center">{t("inviteAccepted")}</AlertDialogTitle>
            <AlertDialogDescription className="text-center">
              {t("inviteAcceptedDesc")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="sm:justify-center">
            <AlertDialogAction className="gradient-primary w-full sm:w-auto" onClick={goHome}>
              {t("goHomepage")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
