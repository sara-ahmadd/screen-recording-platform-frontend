import { useEffect, useState } from "react";
import { Link, useSearchParams, useNavigate } from "react-router-dom";
import { workspaceApi } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { toastApiSuccess } from "@/lib/appToast";
import { useAuth } from "@/contexts/AuthContext";
import { Loader2 } from "lucide-react";
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

const INVITE_TOKEN_STORAGE_KEY = "pending_invite_token";

export default function AcceptInvitePage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, refreshUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [showSignupDialog, setShowSignupDialog] = useState(false);

  useEffect(() => {
    async function accept() {
      const token = searchParams.get("token");
      if (!token) {
        toast({ title: "Invalid invitation link", variant: "destructive" });
        setLoading(false);
        return;
      }

      localStorage.setItem(INVITE_TOKEN_STORAGE_KEY, token);

      if (!user) {
        setShowSignupDialog(true);
        setLoading(false);
        return;
      }

      try {
        const acceptRes = await workspaceApi.acceptInvite(token);
        localStorage.removeItem(INVITE_TOKEN_STORAGE_KEY);
        await refreshUser();
        toastApiSuccess(acceptRes, {
          title: "Invitation accepted",
          fallbackDescription: "You've joined the workspace.",
        });
        navigate("/workspaces");
      } catch (err: any) {
        toast({ title: "Invitation not accepted", description: err.message, variant: "destructive" });
        setShowSignupDialog(true);
      } finally {
        setLoading(false);
      }
    }

    accept();
  }, [user, searchParams, navigate, toast, refreshUser]);

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
    </>
  );
}
