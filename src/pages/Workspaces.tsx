import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import type { TFunction } from "i18next";
import { workspaceApi } from "@/lib/api";
import { getSocket } from "@/lib/socket";
import { useAuth } from "@/contexts/AuthContext";
import AppLayout from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { toastApiSuccess, toastSuccess } from "@/lib/appToast";
import { useConfirmDialog } from "@/contexts/ConfirmDialogContext";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Users, Mail, UserMinus, Loader2, CheckCircle2, LogOut, AlertTriangle } from "lucide-react";
import { buildAvatarSrc } from "@/hooks/useAvatarSrc";

const formatBytes = (bytes: number | null | undefined, t: TFunction) => {
  if (!bytes || bytes <= 0) return t("common:storage.zero");
  const units = [
    t("common:storage.b"),
    t("common:storage.kb"),
    t("common:storage.mb"),
    t("common:storage.gb"),
    t("common:storage.tb"),
  ];
  let size = bytes;
  let unitIndex = 0;
  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex += 1;
  }
  return `${size.toFixed(unitIndex === 0 ? 0 : 2)} ${units[unitIndex]}`;
};

const buildWorkspaceLogoSrc = (rawUrl?: string | null) => {
  return buildAvatarSrc(rawUrl);
};

const getWorkspaceLogoRaw = (workspace?: any) => {
  if (!workspace) return "";
  return workspace.logoUrl || workspace.logo_url || workspace.logo || "";
};

const getWorkspaceOwnerId = (workspace?: any): number | null => {
  if (!workspace) return null;
  const raw =
    workspace.ownerId ??
    workspace.owner_id ??
    workspace.owner?.id ??
    workspace.owner?.userId ??
    workspace.owner?.user_id;
  if (raw === undefined || raw === null || raw === "") return null;
  const n = Number(raw);
  return Number.isFinite(n) ? n : null;
};

export default function WorkspacesPage() {
  const { t } = useTranslation(["workspaces", "common"]);
  const formatStorage = useCallback(
    (bytes?: number | null) => formatBytes(bytes, t),
    [t],
  );
  const { user, selectedWorkspaceId, setSelectedWorkspaceId, refreshUser } = useAuth();
  const { toast } = useToast();
  const confirm = useConfirmDialog();
  const [members, setMembers] = useState<any[]>([]);
  const [newWsName, setNewWsName] = useState("");
  const [inviteEmail, setInviteEmail] = useState("");
  const [creating, setCreating] = useState(false);
  const [workspaceMembersMap, setWorkspaceMembersMap] = useState<Record<number, any[]>>({});
  const [workspaceDetailsMap, setWorkspaceDetailsMap] = useState<Record<number, any>>({});
  const [hiddenWorkspaceLogos, setHiddenWorkspaceLogos] = useState<Record<string, boolean>>({});
  const [openedWorkspaceMembersId, setOpenedWorkspaceMembersId] = useState<number | null>(null);
  const [editingWorkspaceId, setEditingWorkspaceId] = useState<number | null>(null);
  const [editingWorkspaceName, setEditingWorkspaceName] = useState("");
  const [editingWorkspaceLogoFile, setEditingWorkspaceLogoFile] = useState<File | null>(null);
  const [editingWorkspaceLogoPreview, setEditingWorkspaceLogoPreview] = useState("");
  const [updatingWorkspace, setUpdatingWorkspace] = useState(false);
  const [isLogoPreviewOpen, setIsLogoPreviewOpen] = useState(false);

  // For now, workspace list comes from user's data - we'll use a simple approach
  const [wsId, setWsId] = useState<number | null>(null);

  const loadMembers = async (id: number) => {
    try {
      const res = await workspaceApi.members(id);
      const fetchedWorkspace =
        res?.workspace ||
        res?.data?.workspace ||
        res?.members?.workspace ||
        null;
      const nextMembers =
        fetchedWorkspace?.users ||
        res?.members?.users ||
        res?.workspace?.users ||
        res?.data?.users ||
        res?.users ||
        res?.members ||
        res?.data ||
        [];
      setMembers(nextMembers);
      setWorkspaceMembersMap((prev) => ({ ...prev, [id]: nextMembers }));
      if (fetchedWorkspace) {
        setWorkspaceDetailsMap((prev) => ({ ...prev, [id]: fetchedWorkspace }));
        const fetchedLogoRaw = getWorkspaceLogoRaw(fetchedWorkspace);
        const fetchedLogoSrc = buildWorkspaceLogoSrc(fetchedLogoRaw);
        if (fetchedLogoSrc) {
          setHiddenWorkspaceLogos((prev) => ({ ...prev, [`${id}:${fetchedLogoSrc}`]: false }));
        }
      }
    } catch {}
  };

  const handleViewWorkspaceMembers = async (workspace: any) => {
    const wsId = Number(workspace.id);
    const currentlyOpen = openedWorkspaceMembersId === wsId;
    if (currentlyOpen) {
      setOpenedWorkspaceMembersId(null);
      return;
    }

    setOpenedWorkspaceMembersId(wsId);
    const membersFromMe = workspace.users || workspace.members || workspace.workspaceMembers || [];
    if (Array.isArray(membersFromMe) && membersFromMe.length > 0) {
      setWorkspaceMembersMap((prev) => ({ ...prev, [wsId]: membersFromMe }));
      setWorkspaceDetailsMap((prev) => ({ ...prev, [wsId]: workspace }));
      return;
    }

    await loadMembers(wsId);
  };

  const handleCreate = async () => {
    if (!newWsName) return;
    setCreating(true);
    try {
      const fd = new FormData();
      fd.append("name", newWsName);
      const res = await workspaceApi.create(fd);
      toastApiSuccess(res, { title: t("created"), fallbackDescription: t("createdDesc") });
      setNewWsName("");
      const id = res.workspace?.id || res.id;
      setWsId(id);
      await refreshUser();
      if (id != null) setSelectedWorkspaceId(String(id));
      loadMembers(id);
    } catch (err: any) {
      toast({ title: t("common:toast.error"), description: err.message, variant: "destructive" });
    } finally {
      setCreating(false);
    }
  };

  const handleInvite = async () => {
    if (!wsId || !inviteEmail) return;
    try {
      const inviteRes = await workspaceApi.invite(wsId, inviteEmail);
      toastApiSuccess(inviteRes, { title: t("inviteSent"), fallbackDescription: t("inviteDesc") });
      setInviteEmail("");
    } catch (err: any) {
      toast({ title: t("common:toast.error"), description: err.message, variant: "destructive" });
    }
  };

  const handleLeaveWorkspace = async () => {
    if (!wsId) return;
    const confirmed = await confirm({
      title: t("leaveTitle"),
      description: t("leaveDesc"),
      confirmText: t("leaveAction"),
      cancelText: t("common:actions.cancel"),
    });
    if (!confirmed) return;
    try {
      const leaveRes = await workspaceApi.leave(wsId);
      toastApiSuccess(leaveRes, {
        title: t("left"),
        fallbackDescription: t("leftDesc"),
      });
      setWorkspaceMembersMap((prev) => {
        const next = { ...prev };
        delete next[wsId];
        return next;
      });
      setMembers([]);
      setOpenedWorkspaceMembersId(null);
      if (selectedWorkspaceId === String(wsId)) {
        setSelectedWorkspaceId(null);
      }
      setWsId(null);
      await refreshUser();
    } catch (err: any) {
      toast({ title: t("common:toast.error"), description: err.message, variant: "destructive" });
    }
  };

  const handleDeleteWorkspace = async () => {
    if (!wsId) return;
    const confirmed = await confirm({
      title: t("deleteTitle"),
      description: t("deleteDesc"),
      confirmText: t("common:actions.delete"),
      cancelText: t("common:actions.cancel"),
    });
    if (!confirmed) return;

    try {
      const deleteRes = await workspaceApi.delete(wsId);
      toastApiSuccess(deleteRes, {
        title: t("deleted"),
        fallbackDescription: t("deletedDesc"),
      });
      setWorkspaceMembersMap((prev) => {
        const next = { ...prev };
        delete next[wsId];
        return next;
      });
      setWorkspaceDetailsMap((prev) => {
        const next = { ...prev };
        delete next[wsId];
        return next;
      });
      setMembers([]);
      setOpenedWorkspaceMembersId(null);
      if (selectedWorkspaceId === String(wsId)) {
        setSelectedWorkspaceId(null);
      }
      setWsId(null);
      await refreshUser();
    } catch (err: any) {
      toast({ title: t("common:toast.error"), description: err.message, variant: "destructive" });
    }
  };

  const handleUpdateRole = async (userId: number, role: string) => {
    if (!wsId) return;
    try {
      const roleRes = await workspaceApi.updateMember(userId, wsId, role);
      toastApiSuccess(roleRes, { title: t("roleUpdated"), fallbackDescription: t("roleUpdatedDesc") });
      loadMembers(wsId);
    } catch (err: any) {
      toast({ title: t("common:toast.error"), description: err.message, variant: "destructive" });
    }
  };

  const handleRemoveMember = async (member: any) => {
    if (!wsId) return;
    const memberUserId = member.userId || member.id;
    if (!memberUserId) return;

    const confirmed = await confirm({
      title: t("removeMemberTitle"),
      description: t("removeMemberDesc", {
        name: member.user_name || member.email || t("removeMemberFallback"),
      }),
      confirmText: t("removeAction"),
      cancelText: t("common:actions.cancel"),
    });
    if (!confirmed) return;

    try {
      const removeRes = await workspaceApi.removeMember(wsId, Number(memberUserId));
      toastApiSuccess(removeRes, { title: t("memberRemoved"), fallbackDescription: t("memberRemovedDesc") });
      loadMembers(wsId);
    } catch (err: any) {
      toast({ title: t("common:toast.error"), description: err.message, variant: "destructive" });
    }
  };

  const openWorkspaceEditor = (workspace: any) => {
    const id = Number(workspace.id);
    setEditingWorkspaceId(id);
    setEditingWorkspaceName(workspace.name || "");
    setEditingWorkspaceLogoFile(null);
    setEditingWorkspaceLogoPreview(buildWorkspaceLogoSrc(getWorkspaceLogoRaw(workspace)));
  };

  const closeWorkspaceEditor = () => {
    setEditingWorkspaceId(null);
    setEditingWorkspaceName("");
    setEditingWorkspaceLogoFile(null);
    setEditingWorkspaceLogoPreview("");
  };

  const handleLogoFileChange = (file?: File | null) => {
    if (!file) return;
    setEditingWorkspaceLogoFile(file);
    setEditingWorkspaceLogoPreview(URL.createObjectURL(file));
  };

  const handleUpdateWorkspace = async () => {
    if (!editingWorkspaceId) return;
    const trimmedName = editingWorkspaceName.trim();
    if (!trimmedName) {
      toast({ title: t("nameRequired"), variant: "destructive" });
      return;
    }

    setUpdatingWorkspace(true);
    try {
      const fd = new FormData();
      fd.append("name", trimmedName);
      if (editingWorkspaceLogoFile) {
        fd.append("logo", editingWorkspaceLogoFile);
      }

      const res = await workspaceApi.update(editingWorkspaceId, fd);
      const updatedWorkspace = res?.workspace || res?.data?.workspace || {};
      const updatedLogoRaw = getWorkspaceLogoRaw(updatedWorkspace);

      setWorkspaceDetailsMap((prev) => ({
        ...prev,
        [editingWorkspaceId]: {
          ...(prev[editingWorkspaceId] || {}),
          ...updatedWorkspace,
          id: editingWorkspaceId,
          name: updatedWorkspace.name || trimmedName,
          logoUrl: updatedLogoRaw || getWorkspaceLogoRaw(prev[editingWorkspaceId]),
        },
      }));
      if (updatedLogoRaw) {
        const updatedLogoSrc = buildWorkspaceLogoSrc(updatedLogoRaw);
        setHiddenWorkspaceLogos((prev) => ({ ...prev, [`${editingWorkspaceId}:${updatedLogoSrc}`]: false }));
      }

      toastApiSuccess(res, { title: t("updated"), fallbackDescription: t("updatedDesc") });
      await refreshUser();
      await loadMembers(editingWorkspaceId);
      closeWorkspaceEditor();
    } catch (err: any) {
      toast({ title: t("common:toast.error"), description: err.message, variant: "destructive" });
    } finally {
      setUpdatingWorkspace(false);
    }
  };

  // Socket events
  useEffect(() => {
    const socket = getSocket();
    const onNewMember = () => {
      if (wsId) loadMembers(wsId);
      toastSuccess(t("memberJoined"));
    };
    const onRemoved = () => { if (wsId) loadMembers(wsId); };
    const onRoleUpdated = () => { if (wsId) loadMembers(wsId); };
    const onStorageLimit = (data: any) => { toast({ title: t("storageLimit"), description: data?.message || t("storageLimitDesc"), variant: "destructive" }); };

    socket.on("new_member", onNewMember);
    socket.on("member_removed", onRemoved);
    socket.on("member_role_updated", onRoleUpdated);
    socket.on("storage_limit", onStorageLimit);
    socket.on("invitation_accepted", onNewMember);

    return () => {
      socket.off("new_member", onNewMember);
      socket.off("member_removed", onRemoved);
      socket.off("member_role_updated", onRoleUpdated);
      socket.off("storage_limit", onStorageLimit);
      socket.off("invitation_accepted", onNewMember);
    };
  }, [wsId, toast]);

  useEffect(() => {
    if (!selectedWorkspaceId) return;
    const numericId = Number(selectedWorkspaceId);
    if (!Number.isNaN(numericId) && numericId > 0) {
      setWsId(numericId);
      loadMembers(numericId);
    }
  }, [selectedWorkspaceId]);

  useEffect(() => {
    const workspaces = user?.workspaces || [];
    if (!Array.isArray(workspaces) || workspaces.length === 0) return;

    // Keep local workspace details in sync and fetch full details for cards that miss logo.
    setWorkspaceDetailsMap((prev) => {
      const next = { ...prev };
      for (const ws of workspaces) {
        next[ws.id] = { ...(next[ws.id] || {}), ...ws };
      }
      return next;
    });

    for (const ws of workspaces) {
      if (!getWorkspaceLogoRaw(ws)) {
        loadMembers(Number(ws.id));
      }
    }
  }, [user?.workspaces]);

  return (
    <AppLayout>
      <div className="p-6 md:p-8 max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold">{t("title")}</h1>
            <p className="text-muted-foreground text-sm mt-1">{t("subtitle")}</p>
          </div>
        </div>

        <Card className="glass mb-6">
          <CardHeader>
            <CardTitle className="text-base">{t("yourWorkspaces")}</CardTitle>
          </CardHeader>
          <CardContent>
            {(user?.workspaces?.length || 0) === 0 ? (
              <div
                role="alert"
                className="mb-4 flex gap-3 rounded-lg border border-amber-500/45 bg-amber-500/[0.12] px-3 py-3 shadow-sm dark:border-amber-500/35 dark:bg-amber-950/50"
              >
                <AlertTriangle
                  className="mt-0.5 h-5 w-5 shrink-0 text-amber-600 dark:text-amber-400"
                  aria-hidden
                />
                <p className="text-sm leading-relaxed text-amber-950 dark:text-amber-50/95">
                  {t("needOneAlert")}
                </p>
              </div>
            ) : null}
            <div className="space-y-3">
              {(user?.workspaces || []).map((ws: any) => {
                const isCurrent = String(ws.id) === selectedWorkspaceId;
                const workspaceMembers = workspaceMembersMap[ws.id] || [];
                const workspaceData = { ...ws, ...(workspaceDetailsMap[ws.id] || {}) };
                const ownerId = getWorkspaceOwnerId(workspaceData);
                const currentUserId =
                  user?.id != null ? Number(user.id) : Number.NaN;
                const isOwnWorkspace =
                  Number.isFinite(currentUserId) &&
                  ownerId != null &&
                  ownerId === currentUserId;
                const logoSrc = buildWorkspaceLogoSrc(getWorkspaceLogoRaw(workspaceData));
                const hideLogo = hiddenWorkspaceLogos[`${ws.id}:${logoSrc}`];
                const showMembers = openedWorkspaceMembersId === ws.id;
                return (
                  <div key={ws.id} className="rounded-lg border border-border p-4 space-y-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3 min-w-0">
                        <button
                          type="button"
                          className="shrink-0"
                          onClick={() => openWorkspaceEditor(workspaceData)}
                          title={t("viewUpdateLogo")}
                        >
                          {logoSrc && !hideLogo ? (
                            <img
                              src={logoSrc}
                              alt={t("workspaceLogoAlt", { name: workspaceData.name || ws.name || t("title") })}
                              className="h-11 w-11 rounded-md object-contain border border-border"
                              onError={() => {
                                setHiddenWorkspaceLogos((prev) => ({ ...prev, [`${ws.id}:${logoSrc}`]: true }));
                              }}
                            />
                          ) : (
                            <div className="h-11 w-11 rounded-md bg-secondary/70 border border-border flex items-center justify-center text-sm font-semibold text-muted-foreground">
                              {(workspaceData.name || ws.name || "W")[0].toUpperCase()}
                            </div>
                          )}
                        </button>
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 min-w-0">
                            <button
                              type="button"
                              className="font-medium truncate text-left hover:underline min-w-0"
                              onClick={() => openWorkspaceEditor(workspaceData)}
                              title={t("editWorkspaceName")}
                            >
                              {workspaceData.name || ws.name}
                            </button>
                            {isOwnWorkspace ? (
                              <span className="text-xs text-muted-foreground shrink-0">
                                {t("yourWorkspace")}
                              </span>
                            ) : null}
                          </div>
                          <p className="text-xs text-muted-foreground truncate">{workspaceData.slug || ws.slug || "-"}</p>
                          <p className="text-xs mt-1">
                            <span className="inline-flex rounded-full bg-secondary px-2 py-0.5 text-muted-foreground">
                              {workspaceData.status || t("statusActive")}
                            </span>
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <Button
                          variant="outline"
                          onClick={() => handleViewWorkspaceMembers(workspaceData)}
                        >
                          {showMembers ? t("hideMembers") : t("viewMembers")}
                        </Button>
                        <Button
                          variant={isCurrent ? "outline" : "default"}
                          className={isCurrent ? "gap-2" : "gradient-primary"}
                          onClick={() => {
                            setSelectedWorkspaceId(String(ws.id));
                            setWsId(ws.id);
                            loadMembers(ws.id);
                            toastSuccess(t("workspaceSelected"), ws.name);
                          }}
                        >
                          {isCurrent ? <CheckCircle2 className="h-4 w-4" /> : null}
                          {isCurrent ? t("current") : t("useWorkspace")}
                        </Button>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
                      <div className="rounded-md border border-border p-2">
                        <p className="text-muted-foreground">{t("workspaceId")}</p>
                        <p className="font-medium mt-1">{workspaceData.id || ws.id || "-"}</p>
                      </div>
                      <div className="rounded-md border border-border p-2">
                        <p className="text-muted-foreground">{t("ownerId")}</p>
                        <p className="font-medium mt-1">{workspaceData.ownerId ?? "-"}</p>
                      </div>
                      <div className="rounded-md border border-border p-2">
                        <p className="text-muted-foreground">{t("subscriptionId")}</p>
                        <p className="font-medium mt-1">{workspaceData.subscriptionId ?? "-"}</p>
                      </div>
                      <div className="rounded-md border border-border p-2">
                        <p className="text-muted-foreground">{t("videosCount")}</p>
                        <p className="font-medium mt-1">{workspaceData.videosCount ?? 0}</p>
                      </div>
                      <div className="rounded-md border border-border p-2">
                        <p className="text-muted-foreground">{t("storageUsed")}</p>
                        <p className="font-medium mt-1">{formatStorage(workspaceData.currentStorage)}</p>
                      </div>
                      <div className="rounded-md border border-border p-2">
                        <p className="text-muted-foreground">{t("resetVideosAt")}</p>
                        <p className="font-medium mt-1">{workspaceData.resetVideosCountAt ? new Date(workspaceData.resetVideosCountAt).toLocaleDateString() : "-"}</p>
                      </div>
                      <div className="rounded-md border border-border p-2">
                        <p className="text-muted-foreground">{t("createdAt")}</p>
                        <p className="font-medium mt-1">{workspaceData.createdAt ? new Date(workspaceData.createdAt).toLocaleDateString() : "-"}</p>
                      </div>
                    </div>

                    {showMembers && (
                      <div className="space-y-2 rounded-md border border-border bg-secondary/20 p-3">
                        <p className="text-xs font-medium text-muted-foreground">{t("members")}</p>
                        {workspaceMembers.length > 0 ? (
                          workspaceMembers.map((member: any) => (
                            <div key={member.id || member.userId || member.email} className="flex items-center justify-between text-sm gap-3">
                              <div className="flex items-center gap-2 min-w-0">
                                {member.avatar_url ? (
                                  <img
                                    src={buildAvatarSrc(member.avatar_url)}
                                    alt={member.user_name || t("memberAvatarAlt")}
                                    className="h-7 w-7 rounded-full object-cover border border-border shrink-0"
                                  />
                                ) : (
                                  <div className="h-7 w-7 rounded-full gradient-primary flex items-center justify-center text-[10px] font-bold text-primary-foreground shrink-0">
                                    {(member.user_name || member.email || "U")[0].toUpperCase()}
                                  </div>
                                )}
                                <div className="min-w-0">
                                  <p className="truncate">{member.user_name || member.name || t("memberFallback")}</p>
                                  <p className="text-xs text-muted-foreground truncate">{member.email || "-"}</p>
                                </div>
                              </div>
                              <span className="text-xs text-muted-foreground whitespace-nowrap">{member.membership?.role || member.role || ""}</span>
                            </div>
                          ))
                        ) : (
                          <p className="text-xs text-muted-foreground">{t("noMembersFound")}</p>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
              {(user?.workspaces?.length || 0) === 0 && (
                <p className="text-sm text-muted-foreground">{t("noWorkspaces")}</p>
              )}
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-6 md:grid-cols-2">
          {/* Create workspace */}
          <Card className="glass">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2"><Plus className="h-4 w-4" /> {t("create")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>{t("workspaceName")}</Label>
                <Input value={newWsName} onChange={(e) => setNewWsName(e.target.value)} placeholder={t("placeholderName")} />
              </div>
              <Button className="w-full gradient-primary" onClick={handleCreate} disabled={creating || !newWsName}>
                {creating ? <Loader2 className="h-4 w-4 animate-spin" /> : t("create")}
              </Button>
            </CardContent>
          </Card>

          {/* Invite members */}
          <Card className="glass">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2"><Mail className="h-4 w-4" /> {t("invite")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>{t("workspaceId")}</Label>
                <Input type="number" value={wsId || ""} onChange={(e) => { setWsId(Number(e.target.value)); loadMembers(Number(e.target.value)); }} placeholder={t("placeholderId")} />
              </div>
              <div className="space-y-2">
                <Label>{t("common:labels.email")}</Label>
                <Input type="email" value={inviteEmail} onChange={(e) => setInviteEmail(e.target.value)} placeholder={t("invitePlaceholder")} />
              </div>
              <Button className="w-full" variant="outline" onClick={handleInvite} disabled={!wsId || !inviteEmail}>
                {t("sendInvite")}
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Members list */}
        {members.length > 0 && (
          <Card className="glass mt-6">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2"><Users className="h-4 w-4" /> {t("members")}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {(() => {
                  const currentMember = members.find((m: any) => (m.id === user?.id || m.userId === user?.id));
                  const isCurrentUserOwner = (currentMember?.membership?.role || currentMember?.role) === "workspaceOwner";

                  return members.map((member: any) => {
                    const role = member.membership?.role || member.role || "workspaceMember";
                    const isOwner = role === "workspaceOwner";
                    const isMe = member.id === user?.id || member.userId === user?.id;
                    const canRemove = isCurrentUserOwner && !isOwner;

                    return (
                      <div key={member.id || member.userId} className="flex items-center justify-between p-3 rounded-lg bg-secondary/30">
                        <div className="flex items-center gap-3 min-w-0">
                          {isMe && !isOwner && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0 text-muted-foreground hover:bg-primary hover:text-white shrink-0"
                              onClick={handleLeaveWorkspace}
                              title={t("leaveWorkspaceTitle")}
                            >
                              <LogOut className="h-3.5" />
                            </Button>
                          )}
                          {canRemove && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive shrink-0"
                              onClick={() => handleRemoveMember(member)}
                              title={t("removeMemberTitle")}
                            >
                              <UserMinus className="h-3.5 w-3.5" />
                            </Button>
                          )}
                          <div className="h-8 w-8 rounded-full gradient-primary flex items-center justify-center text-xs font-bold text-primary-foreground">
                            {(member.user_name || member.email || "U")[0].toUpperCase()}
                          </div>
                          <div>
                            <p className="text-sm font-medium">{member.user_name || member.email}</p>
                            <p className="text-xs text-muted-foreground">{member.email}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Select
                            value={role}
                            onValueChange={(v) => handleUpdateRole(member.userId || member.id, v)}
                          >
                            <SelectTrigger className="w-36 h-8 text-xs">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="workspaceMember">{t("member")}</SelectItem>
                              <SelectItem value="workspaceAdmin">{t("admin")}</SelectItem>
                              <SelectItem value="workspaceOwner">{t("owner")}</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    );
                  });
                })()}
              </div>
            </CardContent>
          </Card>
        )}
        {(() => {
          if (!wsId || members.length === 0) return null;
          const currentMember = members.find((m: any) => m.id === user?.id || m.userId === user?.id);
          const isCurrentUserOwner = (currentMember?.membership?.role || currentMember?.role) === "workspaceOwner";
          if (!isCurrentUserOwner) return null;

          return (
            <Card className="glass mt-6">
              <CardHeader>
                <CardTitle className="text-base text-destructive">{t("dangerZone")}</CardTitle>
              </CardHeader>
              <CardContent>
                <Button variant="destructive" onClick={handleDeleteWorkspace}>
                  {t("deleteWorkspace")}
                </Button>
              </CardContent>
            </Card>
          );
        })()}
      </div>
      <Dialog open={editingWorkspaceId !== null} onOpenChange={(open) => !open && closeWorkspaceEditor()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("editWorkspaceDialog")}</DialogTitle>
            <DialogDescription>{t("editDialogDesc")}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>{t("logo")}</Label>
              <div className="flex items-center gap-3">
                {editingWorkspaceLogoPreview ? (
                  <button
                    type="button"
                    onClick={() => setIsLogoPreviewOpen(true)}
                    className="rounded-md"
                    title={t("previewLogo")}
                  >
                    <img
                      src={editingWorkspaceLogoPreview}
                      alt={t("logoPreview")}
                      className="h-16 w-16 rounded-md object-contain border border-border"
                    />
                  </button>
                ) : (
                  <div className="h-16 w-16 rounded-md bg-secondary/70 border border-border flex items-center justify-center text-lg font-semibold text-muted-foreground">
                    {editingWorkspaceName?.[0]?.toUpperCase() || "W"}
                  </div>
                )}
                <Input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleLogoFileChange(e.target.files?.[0] || null)}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>{t("workspaceName")}</Label>
              <Input
                value={editingWorkspaceName}
                onChange={(e) => setEditingWorkspaceName(e.target.value)}
                placeholder={t("workspaceName")}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={closeWorkspaceEditor} disabled={updatingWorkspace}>
              {t("common:actions.cancel")}
            </Button>
            <Button className="gradient-primary" onClick={handleUpdateWorkspace} disabled={updatingWorkspace || !editingWorkspaceName.trim()}>
              {updatingWorkspace ? <Loader2 className="h-4 w-4 animate-spin" /> : t("saveWorkspace")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <Dialog open={isLogoPreviewOpen} onOpenChange={setIsLogoPreviewOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{t("logoPreviewTitle")}</DialogTitle>
            <DialogDescription>{t("logoFullPreviewDesc")}</DialogDescription>
          </DialogHeader>
          {editingWorkspaceLogoPreview ? (
            <img
              src={editingWorkspaceLogoPreview}
              alt={t("workspaceLogoFullPreview")}
              className="w-full max-h-[70vh] object-contain rounded-md border border-border"
            />
          ) : (
            <div className="h-48 rounded-md border border-border bg-secondary/40 flex items-center justify-center text-muted-foreground">
              {t("noLogo")}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}
