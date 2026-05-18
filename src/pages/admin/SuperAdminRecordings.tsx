import { useTranslation } from "react-i18next";
import { useCallback, useEffect, useState } from "react";
import AppLayout from "@/components/AppLayout";
import AdminCrudTable from "@/components/admin/AdminCrudTable";
import { superAdminApi } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Label } from "@radix-ui/react-label";

export default function SuperAdminRecordingsPage() {
  const { t } = useTranslation(["admin", "common"]);
  const { toast } = useToast();
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [title, setTitle] = useState("");
  const [status, setStatus] = useState("");
  const [visibility, setVisibility] = useState("");
  const [workspaceId, setWorkspaceId] = useState("");
  const [order, setOrder] = useState<"ASC" | "DESC">("DESC");
  const [trashView, setTrashView] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const payload = trashView
        ? await superAdminApi.recordings.trashList({
            page: 1,
            limit: 100,
            order,
            workspaceId: workspaceId.trim() || undefined,
            filters: {
              title: title || undefined,
              status: status || undefined,
              visibility: visibility || undefined,
            },
          })
        : await superAdminApi.recordings.list({
            page: 1,
            limit: 100,
            order,
            workspaceId: workspaceId.trim() || undefined,
            filters: {
              title: title || undefined,
              status: status || undefined,
              visibility: visibility || undefined,
            },
          });
      setRows(payload?.recordings || payload?.data?.data || payload?.data || payload || []);
    } catch (err: any) {
      toast({ title: t("errorLoadingRecordings"), description: err?.message || t("common:errors.tryAgain"), variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [order, status, title, visibility, workspaceId, trashView, toast]);

  useEffect(() => {
    void load();
  }, [load]);

  const onCreate = async (payload: Record<string, any>) => {
    await superAdminApi.recordings.create(payload);
    toast({ title: t("recordingCreated"), description: t("recordingCreatedDesc") });
    await load();
  };
  const onUpdate = async (id: number, payload: Record<string, any>) => {
    await superAdminApi.recordings.update(id, payload);
    toast({ title: t("recordingUpdated"), description: t("recordingUpdatedDesc") });
    await load();
  };
  const onDelete = async (id: number) => {
    await superAdminApi.recordings.delete(id);
    await load();
  };

  return (
    <AppLayout>
      <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-4">
        <h1 className="text-3xl font-bold">{t("allRecordings")}</h1>
        <div className="flex flex-wrap gap-2">
          <Input placeholder={t("filterByTitle")} value={title} onChange={(e) => setTitle(e.target.value)} className="max-w-xs" />
          <Input placeholder={t("filterByStatus")} value={status} onChange={(e) => setStatus(e.target.value)} className="max-w-xs" />
          <Input placeholder={t("filterByVisibility")} value={visibility} onChange={(e) => setVisibility(e.target.value)} className="max-w-xs" />
          <div className="flex flex-col gap-2">
            <Label>{t("targetWorkspaceId")}</Label>
            <Input
              placeholder={t("targetWorkspaceId")}
              value={workspaceId}
              onChange={(e) => setWorkspaceId(e.target.value)}
              className="max-w-xs"
            />
          </div>
          <Select value={order} onValueChange={(v: "ASC" | "DESC") => setOrder(v)}>
            <SelectTrigger className="w-[140px]"><SelectValue placeholder={t("order")} /></SelectTrigger>
            <SelectContent>
              <SelectItem value="DESC">{t("newest")}</SelectItem>
              <SelectItem value="ASC">{t("oldest")}</SelectItem>
            </SelectContent>
          </Select>
          <Button
            variant="outline"
            onClick={() => {
              setTrashView((prev) => !prev);
            }}
          >
            {trashView ? t("activeRecordings") : t("trash")}
          </Button>
          <Button variant="outline" onClick={() => void load()}>{t("applyFilters")}</Button>
        </div>
        <AdminCrudTable
          title={t("recordingsTable")}
          rows={rows}
          loading={loading}
          onRefresh={load}
          onCreate={onCreate}
          onUpdate={onUpdate}
          onDelete={onDelete}
        />
      </div>
    </AppLayout>
  );
}
