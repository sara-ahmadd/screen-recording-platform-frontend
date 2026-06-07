import { useTranslation } from "react-i18next";
import { useCallback, useEffect, useMemo, useState } from "react";
import AppLayout from "@/components/AppLayout";
import AdminCrudTable from "@/components/admin/AdminCrudTable";
import { plansApi, superAdminApi } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

export default function SuperAdminPromocodesPage() {
  const { t } = useTranslation(["admin", "common"]);
  const { toast } = useToast();
  const [rows, setRows] = useState<any[]>([]);
  const [plans, setPlans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const statusOptions = useMemo(() => {
    const discovered = Array.from(
      new Set(
        rows
          .map((row) => String(row?.status || "").trim().toLowerCase())
          .filter(Boolean),
      ),
    );
    const base = ["active", "inactive", "disabled", "expired"];
    return Array.from(new Set([...base, ...discovered]));
  }, [rows]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await superAdminApi.promocodes.list();
      setRows(res?.promocodes || res?.data || res || []);
    } catch (err: any) {
      toast({ title: t("errorLoadingPromocodes"), description: err?.message || t("common:errors.tryAgain"), variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    const loadPlans = async () => {
      try {
        const res = await plansApi.getAll();
        setPlans(res?.plans || res?.data || res || []);
      } catch (err: any) {
        toast({ title: t("errorLoadingPlansList"), description: err?.message || t("common:errors.tryAgain"), variant: "destructive" });
      }
    };
    void loadPlans();
  }, [toast]);

  return (
    <AppLayout>
      <div className="p-6 md:p-8 max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold mb-4">{t("allPromocodes")}</h1>
        <AdminCrudTable
          title={t("promocodesTable")}
          rows={rows}
          loading={loading}
          pinnedColumns={["code", "status", "type", "amount", "duration", "planId"]}
          createDefaults={{
            type: "percentage",
            status: "active",
            duration: 30,
            amount: 0,
            code: "",
            expirationDate: "",
            usageLimit: 1,
            usagePerUserLimit: 1,
            planId: "",
          }}
          fieldOptions={{
            type: ["percentage", "fixed"],
            status: statusOptions,
          }}
          fieldSelectOptions={{
            planId: plans.map((plan: any) => ({
              label: plan?.name ? t("planLabel", { name: plan.name, id: plan.id }) : t("plans.planFallback", { id: plan.id }),
              value: String(plan.id),
            })),
          }}
          fieldInputTypes={{
            expirationDate: "date",
          }}
          onRefresh={load}
          onCreate={async (payload) => {
            try {
              const code = String(payload.code ?? "").trim();
              const expirationDate = String(payload.expirationDate ?? "").trim();
              if (!code) {
                toast({
                  title: t("failed"),
                  description: t("promocodeCodeRequired"),
                  variant: "destructive",
                });
                throw new Error(t("promocodeCodeRequired"));
              }
              if (!expirationDate) {
                toast({
                  title: t("failed"),
                  description: t("promocodeExpirationRequired"),
                  variant: "destructive",
                });
                throw new Error(t("promocodeExpirationRequired"));
              }
              const createPayload = {
                type: payload.type,
                ...(payload.status != null && payload.status !== ""
                  ? { status: payload.status }
                  : {}),
                duration: Number(payload.duration || 0),
                amount: Number(payload.amount || 0),
                code,
                expirationDate,
                usageLimit: Number(payload.usageLimit || 0),
                usagePerUserLimit: Number(payload.usagePerUserLimit || 0),
                ...(payload.planId != null && payload.planId !== ""
                  ? { planId: Number(payload.planId) }
                  : {}),
              };
              await superAdminApi.promocodes.create(createPayload);
              toast({ title: t("success"), description: t("promocodeCreated") });
              await load();
            } catch (err: any) {
              if (
                err?.message !== t("promocodeCodeRequired") &&
                err?.message !== t("promocodeExpirationRequired")
              ) {
                toast({
                  title: t("failed"),
                  description: err?.message || t("promocodeCreateFailed"),
                  variant: "destructive",
                });
              }
              throw err;
            }
          }}
          onUpdate={async (id, payload) => {
            try {
              const current = rows.find((row) => Number(row?.id) === Number(id)) || {};
              const normalizeDate = (value: any) => {
                if (!value) return "";
                const asString = String(value);
                return asString.length >= 10 ? asString.slice(0, 10) : asString;
              };
              const normalizedCurrent = {
                type: String(current?.type || ""),
                duration: current?.duration == null ? null : Number(current.duration),
                amount: current?.amount == null ? null : Number(current.amount),
                code: String(current?.code || ""),
                expirationDate: normalizeDate(current?.expirationDate),
                usageLimit: current?.usageLimit == null ? null : Number(current.usageLimit),
                usagePerUserLimit: current?.usagePerUserLimit == null ? null : Number(current.usagePerUserLimit),
                planId: current?.planId == null || current?.planId === "" ? null : Number(current.planId),
                status: String(current?.status || ""),
              };
              const normalizedNext = {
                type: String(payload?.type || ""),
                duration: payload?.duration == null || payload?.duration === "" ? null : Number(payload.duration),
                amount: payload?.amount == null || payload?.amount === "" ? null : Number(payload.amount),
                code: String(payload?.code || ""),
                expirationDate: normalizeDate(payload?.expirationDate),
                usageLimit: payload?.usageLimit == null || payload?.usageLimit === "" ? null : Number(payload.usageLimit),
                usagePerUserLimit:
                  payload?.usagePerUserLimit == null || payload?.usagePerUserLimit === ""
                    ? null
                    : Number(payload.usagePerUserLimit),
                planId: payload?.planId == null || payload?.planId === "" ? null : Number(payload.planId),
                status: String(payload?.status || ""),
              };
              const keys: Array<keyof typeof normalizedNext> = [
                "type",
                "duration",
                "amount",
                "code",
                "expirationDate",
                "usageLimit",
                "usagePerUserLimit",
                "planId",
                "status",
              ];
              const updatePayload = keys.reduce<Record<string, any>>((acc, key) => {
                if (normalizedNext[key] !== normalizedCurrent[key]) {
                  acc[key] = normalizedNext[key];
                }
                return acc;
              }, {});
              if (Object.keys(updatePayload).length === 0) {
                toast({ title: t("noChanges"), description: t("promocodeNoChanges") });
                return;
              }
              await superAdminApi.promocodes.update(id, updatePayload);
              toast({ title: t("success"), description: t("promocodeUpdated") });
              await load();
            } catch (err: any) {
              toast({ title: t("failed"), description: err?.message || t("promocodeUpdateFailed"), variant: "destructive" });
              throw new Error(err?.message || t("promocodeUpdateFailed"));
            }
          }}
          onDelete={async (id) => { await superAdminApi.promocodes.delete(id); await load(); }}
        />
      </div>
    </AppLayout>
  );
}
