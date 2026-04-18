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
        toast({ title: "Invalid invitation link", variant: "destructive" });
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
          title: "Invitation not accepted",
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
              <p className="text-sm text-muted-foreground mt-3">Processing invitation...</p>
            </>
          ) : (
            !showSuccessDialog && (
              <>
                <p className="text-lg font-semibold">Invitation Pending</p>
                <p className="text-sm text-muted-foreground mt-2">
                  Complete signup/login to accept this workspace invitation.
                </p>
                <div className="flex items-center justify-center gap-2 mt-4">
                  <Link to="/register">
                    <Button className="gradient-primary">Sign up</Button>
                  </Link>
                  <Link to="/login">
                    <Button variant="outline">Login</Button>
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
            <AlertDialogTitle>Signup required first</AlertDialogTitle>
            <AlertDialogDescription>
              You need to create an account first to accept this invitation. After signup and login,
              you will be redirected back to this invitation automatically.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction onClick={() => navigate("/register")}>Go to Sign up</AlertDialogAction>
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
            <AlertDialogTitle className="text-center">Invitation accepted</AlertDialogTitle>
            <AlertDialogDescription className="text-center">
              You have joined the workspace successfully. Continue to the homepage &mdash; sign in any time to open
              your dashboard and workspaces.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="sm:justify-center">
            <AlertDialogAction className="gradient-primary w-full sm:w-auto" onClick={goHome}>
              Go to homepage
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
