import { useTranslation } from "react-i18next";
import { useCallback, useEffect, useState } from "react";
import AppLayout from "@/components/AppLayout";
import AdminCrudTable from "@/components/admin/AdminCrudTable";
import { superAdminApi } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";

export default function SuperAdminUsersPage() {
  const { t } = useTranslation(["admin", "common"]);
  const { toast } = useToast();
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [roleFilter, setRoleFilter] = useState("");
  const [emailSearch, setEmailSearch] = useState("");
  const [nameSearch, setNameSearch] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await superAdminApi.users.list({
        role: roleFilter || undefined,
        email: emailSearch.trim() || undefined,
        name: nameSearch.trim() || undefined,
      });
      setRows(res?.users || res?.data || res || []);
    } catch (err: any) {
      toast({
        title: t("errorLoadingUsers"),
        description: err?.message || t("common:errors.tryAgain"),
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [roleFilter, emailSearch, nameSearch, toast, t]);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <AppLayout>
      <div className="p-6 md:p-8 max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold mb-4">{t("allUsers")}</h1>
        <div className="flex flex-wrap gap-2 mb-4">
          <Select value={roleFilter || "__all"} onValueChange={(v) => setRoleFilter(v === "__all" ? "" : v)}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder={t("filterByRole")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__all">{t("allRoles")}</SelectItem>
              <SelectItem value="superAdmin">{t("superAdmin")}</SelectItem>
              <SelectItem value="workspaceOwner">{t("workspaceOwner")}</SelectItem>
              <SelectItem value="workspaceAdmin">{t("workspaceAdmin")}</SelectItem>
              <SelectItem value="workspaceMember">{t("workspaceMember")}</SelectItem>
            </SelectContent>
          </Select>
          <Input
            placeholder={t("searchByEmail")}
            value={emailSearch}
            onChange={(e) => setEmailSearch(e.target.value)}
            className="max-w-xs"
          />
          <Input
            placeholder={t("searchByName")}
            value={nameSearch}
            onChange={(e) => setNameSearch(e.target.value)}
            className="max-w-xs"
          />
          <Button variant="outline" onClick={() => void load()}>
            {t("applyFilters")}
          </Button>
          <Button
            variant="outline"
            onClick={() => {
              setRoleFilter("");
              setEmailSearch("");
              setNameSearch("");
            }}
          >
            {t("resetFilters")}
          </Button>
        </div>
        <AdminCrudTable
          title={t("usersTable")}
          hiddenColumns={["password"]}
          allowCreate={false}
          showSearchInput={false}
          rows={rows}
          loading={loading}
          onRefresh={load}
          onCreate={async (payload) => {
            await superAdminApi.users.create(payload);
            toast({ title: t("users.created"), description: t("users.createdDesc") });
            await load();
          }}
          onUpdate={async (id, payload) => {
            await superAdminApi.users.update(id, payload);
            toast({ title: t("users.updated"), description: t("users.updatedDesc") });
            await load();
          }}
          onDelete={async (id) => { await superAdminApi.users.delete(id); await load(); }}
        />
      </div>
    </AppLayout>
  );
}
