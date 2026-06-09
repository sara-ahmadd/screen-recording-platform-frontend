import { useCallback, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import AppLayout from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/contexts/AuthContext";
import { meetingsApi } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { toastApiSuccess } from "@/lib/appToast";
import { Loader2, Video } from "lucide-react";

export default function MeetingsLobby() {
  const { t } = useTranslation(["meetings", "common"]);
  const { user, selectedWorkspaceId } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [title, setTitle] = useState("");
  const [meetingIdInput, setMeetingIdInput] = useState("");
  const [creating, setCreating] = useState(false);
  const [joining, setJoining] = useState(false);

  const workspaceId = Number(selectedWorkspaceId);

  const handleCreate = useCallback(async () => {
    if (!workspaceId) {
      toast({ title: t("meetings:noWorkspace"), variant: "destructive" });
      return;
    }
    setCreating(true);
    try {
      const res = await meetingsApi.create({
        workspaceId,
        title: title.trim() || undefined,
      });
      const meeting = res.meeting || res.data?.meeting;
      const token = res.meetingToken || res.data?.meetingToken;
      toastApiSuccess(toast, res, t("meetings:created"));
      navigate(`/meetings/${meeting.id}`, {
        state: { meetingToken: token },
      });
    } catch (err) {
      toast({
        title: t("common:error"),
        description: (err as Error).message,
        variant: "destructive",
      });
    } finally {
      setCreating(false);
    }
  }, [workspaceId, title, toast, t, navigate]);

  const handleJoin = useCallback(async () => {
    const id = Number(meetingIdInput.trim());
    if (!id) return;
    setJoining(true);
    try {
      const res = await meetingsApi.join(id);
      const token = res.meetingToken || res.data?.meetingToken;
      navigate(`/meetings/${id}`, { state: { meetingToken: token } });
    } catch (err) {
      toast({
        title: t("common:error"),
        description: (err as Error).message,
        variant: "destructive",
      });
    } finally {
      setJoining(false);
    }
  }, [meetingIdInput, toast, t, navigate]);

  const displayName = user?.user_name || user?.email || "You";

  return (
    <AppLayout>
      <div className="mx-auto max-w-2xl space-y-6">
        <div>
          <h1 className="text-2xl font-bold">{t("meetings:lobby.title")}</h1>
          <p className="text-muted-foreground">{t("meetings:lobby.subtitle")}</p>
        </div>

        <Card className="glass">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Video className="h-5 w-5" />
              {t("meetings:lobby.startTitle")}
            </CardTitle>
            <CardDescription>{t("meetings:lobby.startDesc")}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={t("meetings:lobby.titlePlaceholder")}
            />
            <Button
              className="gradient-primary w-full"
              onClick={() => void handleCreate()}
              disabled={creating || !workspaceId}
            >
              {creating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {t("meetings:lobby.startButton")}
            </Button>
          </CardContent>
        </Card>

        <Card className="glass">
          <CardHeader>
            <CardTitle>{t("meetings:lobby.joinTitle")}</CardTitle>
            <CardDescription>{t("meetings:lobby.joinDesc")}</CardDescription>
          </CardHeader>
          <CardContent className="flex gap-2">
            <Input
              value={meetingIdInput}
              onChange={(e) => setMeetingIdInput(e.target.value)}
              placeholder={t("meetings:lobby.joinPlaceholder")}
              type="number"
            />
            <Button
              variant="secondary"
              onClick={() => void handleJoin()}
              disabled={joining || !meetingIdInput}
            >
              {joining && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {t("meetings:lobby.joinButton")}
            </Button>
          </CardContent>
        </Card>

        <p className="text-center text-sm text-muted-foreground">
          {t("meetings:lobby.joiningAs", { name: displayName })}
        </p>
      </div>
    </AppLayout>
  );
}
