import { useCallback, useEffect, useState } from "react";
import AppLayout from "@/components/AppLayout";
import AdminCrudTable from "@/components/admin/AdminCrudTable";
import { superAdminApi } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Eye, Video } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function SuperAdminWorkspacesPage() {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [selectedWorkspace, setSelectedWorkspace] = useState<any | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await superAdminApi.workspaces.list();
      setRows(res?.workspaces || res?.data || res || []);
    } catch (err: any) {
      toast({ title: "Error loading workspaces", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    void load();
  }, [load]);

  const openWorkspaceDetails = (workspace: any) => {
    setSelectedWorkspace(workspace || null);
    setDetailsOpen(true);
  };

  const activeSubscriptions = Array.isArray(selectedWorkspace?.subscriptions)
    ? selectedWorkspace.subscriptions.filter(
        (sub: any) => String(sub?.status || "").toLowerCase() === "active"
      )
    : [];
  const currentActiveSubscription =
    activeSubscriptions.length > 0
      ? [...activeSubscriptions].sort(
          (a, b) => new Date(b?.createdAt || 0).getTime() - new Date(a?.createdAt || 0).getTime()
        )[0]
      : null;

  return (
    <AppLayout>
      <div className="p-6 md:p-8 max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold mb-4">All Workspaces</h1>
        <AdminCrudTable
          title="Workspaces Table"
          rows={rows}
          loading={loading}
          onRefresh={load}
          showDefaultDetailsAction={false}
          renderRowActions={(row) => (
            <>
              <Button
                size="icon"
                variant="ghost"
                title="View workspace details"
                onClick={() => openWorkspaceDetails(row)}
              >
                <Eye className="h-4 w-4" />
              </Button>
              <Button
                size="icon"
                variant="ghost"
                title="View workspace recordings"
                onClick={() => navigate(`/super-admin/workspaces/${row?.id}/recordings`)}
              >
                <Video className="h-4 w-4" />
              </Button>
            </>
          )}
          onCreate={async (payload) => {
            await superAdminApi.workspaces.create(payload);
            toast({ title: "Workspace created", description: "Workspace was created successfully." });
            await load();
          }}
          onUpdate={async (id, payload) => {
            await superAdminApi.workspaces.update(id, payload);
            toast({ title: "Workspace updated", description: "Workspace was updated successfully." });
            await load();
          }}
          onDelete={async (id) => { await superAdminApi.workspaces.delete(id); await load(); }}
        />
      </div>

      <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>
              Workspace Details {selectedWorkspace?.name ? `- ${selectedWorkspace.name}` : ""}
            </DialogTitle>
            <DialogDescription>
              Members, subscriptions, and plan information for this workspace.
            </DialogDescription>
          </DialogHeader>

          {!selectedWorkspace ? (
            <p className="text-sm text-muted-foreground">No workspace selected.</p>
          ) : (
            <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-1">
              <div className="rounded-lg border border-border p-4 space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-sm text-muted-foreground">Workspace</p>
                    <p className="text-xl font-semibold">{selectedWorkspace.name || "—"}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      ID: {selectedWorkspace.id ?? "—"} | Owner: {selectedWorkspace.ownerId ?? "—"} | Slug:{" "}
                      {selectedWorkspace.slug || "—"}
                    </p>
                  </div>
                  <Badge variant={selectedWorkspace.status === "active" ? "default" : "secondary"}>
                    {String(selectedWorkspace.status || "unknown").toUpperCase()}
                  </Badge>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="rounded-md border border-border p-3">
                    <p className="text-xs uppercase tracking-wide text-muted-foreground">Videos count</p>
                    <p className="mt-1 text-sm font-medium">{selectedWorkspace.videosCount ?? "—"}</p>
                  </div>
                  <div className="rounded-md border border-border p-3">
                    <p className="text-xs uppercase tracking-wide text-muted-foreground">Current storage</p>
                    <p className="mt-1 text-sm font-medium">{selectedWorkspace.currentStorage ?? "—"}</p>
                  </div>
                  <div className="rounded-md border border-border p-3">
                    <p className="text-xs uppercase tracking-wide text-muted-foreground">Reset videos count at</p>
                    <p className="mt-1 text-sm font-medium">
                      {selectedWorkspace.resetVideosCountAt
                        ? new Date(selectedWorkspace.resetVideosCountAt).toLocaleString()
                        : "—"}
                    </p>
                  </div>
                  <div className="rounded-md border border-border p-3">
                    <p className="text-xs uppercase tracking-wide text-muted-foreground">Logo URL</p>
                    <p className="mt-1 text-sm font-medium break-all">{selectedWorkspace.logoUrl || "—"}</p>
                  </div>
                </div>
              </div>

              <div className="rounded-lg border border-border p-4 space-y-2">
                <p className="text-sm font-medium">
                  Members ({Array.isArray(selectedWorkspace.users) ? selectedWorkspace.users.length : 0})
                </p>
                {Array.isArray(selectedWorkspace.users) && selectedWorkspace.users.length > 0 ? (
                  <div className="space-y-2">
                    {selectedWorkspace.users.map((member: any) => (
                      <div key={member.id} className="rounded-md border border-border p-2">
                        <p className="text-sm font-medium">{member.user_name || `User #${member.id}`}</p>
                        <p className="text-xs text-muted-foreground">
                          {member.email || "—"} | Role: {member.membership?.role || member.role || "—"}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground">No members found.</p>
                )}
              </div>

              <div className="rounded-lg border border-border p-4 space-y-3">
                <p className="text-sm font-medium">Current Subscription (Active only)</p>
                {!currentActiveSubscription ? (
                  <p className="text-xs text-muted-foreground">
                    No active subscription found for this workspace.
                  </p>
                ) : (
                  <div className="rounded-md border border-border p-3">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-medium">
                        {currentActiveSubscription.plan?.name || `Plan #${currentActiveSubscription.planId ?? "—"}`}
                      </p>
                      <Badge className="gradient-primary border-0">
                        {String(currentActiveSubscription.status || "active").toUpperCase()}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Type: {currentActiveSubscription.type || "—"} | Auto renewal:{" "}
                      {typeof currentActiveSubscription.autoRenewal === "boolean"
                        ? currentActiveSubscription.autoRenewal
                          ? "On"
                          : "Off"
                        : "—"}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Monthly: ${Number(currentActiveSubscription.plan?.monthlyPrice || 0)} | Yearly: $
                      {Number(currentActiveSubscription.plan?.yearlyPrice || 0)} | Max members:{" "}
                      {currentActiveSubscription.plan?.maxTeamMembers ?? "—"}
                    </p>
                  </div>
                )}
              </div>

              <div className="rounded-lg border border-border p-4 space-y-2">
                <p className="text-sm font-medium">
                  Subscription History ({Array.isArray(selectedWorkspace.subscriptions) ? selectedWorkspace.subscriptions.length : 0})
                </p>
                {Array.isArray(selectedWorkspace.subscriptions) && selectedWorkspace.subscriptions.length > 0 ? (
                  <div className="rounded-xl border border-border/80 overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Plan</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Type</TableHead>
                          <TableHead>Auto Renewal</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {selectedWorkspace.subscriptions.map((sub: any) => (
                          <TableRow key={sub.id}>
                            <TableCell className="capitalize">{sub.plan?.name || `Plan #${sub.planId ?? "—"}`}</TableCell>
                            <TableCell className="capitalize">{sub.status || "—"}</TableCell>
                            <TableCell className="capitalize">{sub.type || "—"}</TableCell>
                            <TableCell>
                              {typeof sub.autoRenewal === "boolean" ? (sub.autoRenewal ? "On" : "Off") : "—"}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground">No subscriptions found.</p>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}
