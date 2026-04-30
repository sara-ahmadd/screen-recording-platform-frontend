import { useCallback, useEffect, useMemo, useState } from "react";
import AppLayout from "@/components/AppLayout";
import AdminCrudTable from "@/components/admin/AdminCrudTable";
import { plansApi, superAdminApi } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

export default function SuperAdminPromocodesPage() {
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
      toast({ title: "Error loading promocodes", description: err.message, variant: "destructive" });
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
        toast({ title: "Error loading plans", description: err.message, variant: "destructive" });
      }
    };
    void loadPlans();
  }, [toast]);

  return (
    <AppLayout>
      <div className="p-6 md:p-8 max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold mb-4">All Promocodes</h1>
        <AdminCrudTable
          title="Promocodes Table"
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
              label: plan?.name ? `${plan.name} (ID: ${plan.id})` : `Plan ${plan.id}`,
              value: String(plan.id),
            })),
          }}
          fieldInputTypes={{
            expirationDate: "date",
          }}
          onRefresh={load}
          onCreate={async (payload) => {
            try {
              const createPayload = {
                type: payload.type,
                ...(payload.status != null && payload.status !== "" ? { status: payload.status } : {}),
                duration: Number(payload.duration || 0),
                amount: Number(payload.amount || 0),
                code: payload.code,
                expirationDate: payload.expirationDate,
                usageLimit: Number(payload.usageLimit || 0),
                usagePerUserLimit: Number(payload.usagePerUserLimit || 0),
                ...(payload.planId != null && payload.planId !== "" ? { planId: Number(payload.planId) } : {}),
              };
              await superAdminApi.promocodes.create(createPayload);
              toast({ title: "Success", description: "Promocode created successfully." });
              await load();
            } catch (err: any) {
              toast({ title: "Failed", description: err?.message || "Could not create promocode.", variant: "destructive" });
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
                toast({ title: "No changes", description: "No promo code fields were updated." });
                return;
              }
              await superAdminApi.promocodes.update(id, updatePayload);
              toast({ title: "Success", description: "Promocode updated successfully." });
              await load();
            } catch (err: any) {
              toast({ title: "Failed", description: err?.message || "Could not update promocode.", variant: "destructive" });
              throw err;
            }
          }}
          onDelete={async (id) => { await superAdminApi.promocodes.delete(id); await load(); }}
        />
      </div>
    </AppLayout>
  );
}
