import { useCallback, useEffect, useMemo, useState } from "react";
import AppLayout from "@/components/AppLayout";
import { authApi, workspaceApi } from "@/lib/api";
import { toastApiSuccess } from "@/lib/appToast";
import { useAuth } from "@/contexts/AuthContext";
import { WorkspaceActiveSubscriptionDetails } from "@/components/WorkspaceActiveSubscriptionDetails";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { useConfirmDialog } from "@/contexts/ConfirmDialogContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Loader2, UserCircle2 } from "lucide-react";
import { useAvatarSrc } from "@/hooks/useAvatarSrc";

export default function ProfilePage() {
  const { user, refreshUser, selectedWorkspaceId, logout } = useAuth();
  const navigate = useNavigate();
  const confirm = useConfirmDialog();
  const [selectedWorkspaceDetails, setSelectedWorkspaceDetails] = useState<any>(null);
  const [subscriptionDetailsLoading, setSubscriptionDetailsLoading] = useState(false);
  const { toast } = useToast();
  const [userName, setUserName] = useState("");
  const [email, setEmail] = useState("");
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [otp, setOtp] = useState("");
  const [pendingEmail, setPendingEmail] = useState("");
  const [saving, setSaving] = useState(false);
  const [verifyingEmail, setVerifyingEmail] = useState(false);
  const [otpDialogOpen, setOtpDialogOpen] = useState(false);
  const [avatarPreviewOpen, setAvatarPreviewOpen] = useState(false);
  const [avatarLoadFailed, setAvatarLoadFailed] = useState(false);
  const [deletingAccount, setDeletingAccount] = useState(false);

  useEffect(() => {
    if (!user) return;
    setUserName(user.user_name || "");
    setEmail(user.email || "");
  }, [user]);

  const rawAvatarUrl = useMemo(() => user?.avatar_url || user?.avatar || "", [user?.avatar_url, user?.avatar]);
  const serverAvatarUrl = useAvatarSrc(rawAvatarUrl);

  const avatarPreview = useMemo(() => {
    if (avatarFile) return URL.createObjectURL(avatarFile);
    return serverAvatarUrl;
  }, [avatarFile, serverAvatarUrl]);

  useEffect(() => {
    return () => {
      if (avatarFile && avatarPreview?.startsWith("blob:")) URL.revokeObjectURL(avatarPreview);
    };
  }, [avatarFile, avatarPreview]);

  useEffect(() => {
    setAvatarLoadFailed(false);
  }, [avatarPreview, rawAvatarUrl]);

  const selectedWorkspace = useMemo(() => {
    if (!selectedWorkspaceId) return null;
    return (user?.workspaces || []).find((ws: any) => String(ws.id) === selectedWorkspaceId) || null;
  }, [selectedWorkspaceId, user?.workspaces]);

  const mergedSelectedWorkspace = useMemo(() => {
    if (!selectedWorkspace) return null;
    return { ...selectedWorkspace, ...(selectedWorkspaceDetails || {}) };
  }, [selectedWorkspace, selectedWorkspaceDetails]);

  const loadSelectedWorkspaceSubscription = useCallback(async () => {
    if (!selectedWorkspaceId) {
      setSelectedWorkspaceDetails(null);
      return;
    }
    setSubscriptionDetailsLoading(true);
    try {
      const res = await workspaceApi.members(Number(selectedWorkspaceId));
      const workspace =
        res?.workspace || res?.data?.workspace || res?.members?.workspace || null;
      setSelectedWorkspaceDetails(workspace);
    } catch {
      setSelectedWorkspaceDetails(null);
    } finally {
      setSubscriptionDetailsLoading(false);
    }
  }, [selectedWorkspaceId]);

  useEffect(() => {
    loadSelectedWorkspaceSubscription();
  }, [loadSelectedWorkspaceSubscription]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setSaving(true);
    try {
      const nextUserName = userName.trim();
      const nextEmail = email.trim();
      const emailChanged = nextEmail !== user.email;

      const fd = new FormData();
      fd.append("user_name", nextUserName);
      fd.append("email", nextEmail);
      if (avatarFile) fd.append("avatar", avatarFile);

      const profileRes = await authApi.updateProfile(fd);
      await refreshUser();
      await loadSelectedWorkspaceSubscription();

      if (emailChanged) {
        setPendingEmail(nextEmail);
        setOtp("");
        setOtpDialogOpen(true);
        toastApiSuccess(profileRes, {
          title: "OTP required",
          fallbackDescription: "Enter the OTP sent to your new email to complete the update.",
        });
      } else {
        toastApiSuccess(profileRes, {
          title: "Profile updated",
          fallbackDescription: "Profile updated successfully.",
        });
      }
    } catch (err: any) {
      toast({ title: "Failed to update profile", description: err.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const handleConfirmEmailUpdate = async () => {
    if (!pendingEmail || !otp) return;
    setVerifyingEmail(true);
    try {
      const emailRes = await authApi.updateEmail({ email: pendingEmail, otp });
      setOtpDialogOpen(false);
      setPendingEmail("");
      setOtp("");
      await refreshUser();
      toastApiSuccess(emailRes, {
        title: "Email updated",
        fallbackDescription: "Your email was updated successfully.",
      });
    } catch (err: any) {
      toast({ title: "Email verification failed", description: err.message, variant: "destructive" });
    } finally {
      setVerifyingEmail(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (deletingAccount) return;
    const confirmed = await confirm({
      title: "Delete your account?",
      description:
        "This will permanently remove your account and cannot be undone.",
      confirmText: "Delete account",
      cancelText: "Keep account",
    });
    if (!confirmed) return;
    setDeletingAccount(true);
    try {
      const res = await authApi.deleteMe();
      toastApiSuccess(res, {
        title: "Account deleted",
        fallbackDescription: "Your account has been deleted.",
      });
      await logout();
      navigate("/login", { replace: true });
    } catch (err: any) {
      toast({
        title: "Delete account failed",
        description: err.message,
        variant: "destructive",
      });
    } finally {
      setDeletingAccount(false);
    }
  };

  return (
    <AppLayout>
      <div className="p-6 md:p-8 max-w-7xl mx-auto">
        <h1 className="text-2xl font-bold mb-2">Profile Details</h1>
        <p className="text-muted-foreground mb-8">Manage your account information</p>

        <Card className="glass">
          <CardHeader>
            <CardTitle>Edit Profile</CardTitle>
            <CardDescription>Update your name, email, and avatar.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSave} className="space-y-5">
              <div className="flex items-center gap-4">
                {avatarPreview && !avatarLoadFailed ? (
                  <button
                    type="button"
                    className="rounded-full"
                    onClick={() => setAvatarPreviewOpen(true)}
                    title="Preview avatar"
                  >
                    <img
                      src={avatarPreview}
                      alt="Avatar preview"
                      className="h-16 w-16 rounded-full object-cover border border-border"
                      onError={() => setAvatarLoadFailed(true)}
                    />
                  </button>
                ) : (
                  <div className="h-16 w-16 rounded-full bg-secondary flex items-center justify-center border border-border">
                    <UserCircle2 className="h-8 w-8 text-muted-foreground" />
                  </div>
                )}
                <div className="space-y-1">
                  <Label htmlFor="avatar">Avatar</Label>
                  <Input
                    id="avatar"
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      setAvatarLoadFailed(false);
                      setAvatarFile(e.target.files?.[0] || null);
                    }}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="user_name">Username</Label>
                <Input
                  id="user_name"
                  value={userName}
                  onChange={(e) => setUserName(e.target.value)}
                  minLength={3}
                  maxLength={50}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <div className="flex flex-wrap gap-3 pt-2">

              <Button type="submit" className="gradient-primary" disabled={saving}>
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save changes"}
              </Button>
              <div className="flex flex-wrap gap-3">
                <Button
                  type="button"
                  variant="destructive"
                  onClick={() => void handleDeleteAccount()}
                  disabled={deletingAccount}
                >
                  {deletingAccount ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
                  Delete account
                </Button>
              </div>
              </div>
            </form>
          </CardContent>
        </Card>

        <div className="mt-6">
          <WorkspaceActiveSubscriptionDetails
            workspace={mergedSelectedWorkspace}
            allWorkspaces={user?.workspaces}
            loading={subscriptionDetailsLoading}
            title="Active subscription"
            description="Current plan for the workspace you have selected in the app."
          />
        </div>
      </div>

      <Dialog open={otpDialogOpen} onOpenChange={setOtpDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Verify Email Update</DialogTitle>
            <DialogDescription>
              Enter the OTP sent to <span className="font-medium">{pendingEmail}</span>.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="otp">OTP</Label>
              <Input
                id="otp"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                placeholder="Enter OTP"
              />
            </div>
            <Button className="w-full gradient-primary" onClick={handleConfirmEmailUpdate} disabled={verifyingEmail || !otp}>
              {verifyingEmail ? <Loader2 className="h-4 w-4 animate-spin" /> : "Confirm Email"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={avatarPreviewOpen} onOpenChange={setAvatarPreviewOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Avatar Preview</DialogTitle>
            <DialogDescription>Current avatar image preview.</DialogDescription>
          </DialogHeader>
          {avatarPreview && !avatarLoadFailed ? (
            <img
              src={avatarPreview}
              alt="Current avatar"
              className="w-full max-h-[70vh] object-contain rounded-md border border-border"
            />
          ) : (
            <div className="h-48 rounded-md border border-border bg-secondary/40 flex items-center justify-center text-muted-foreground">
              No avatar available
            </div>
          )}
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}
