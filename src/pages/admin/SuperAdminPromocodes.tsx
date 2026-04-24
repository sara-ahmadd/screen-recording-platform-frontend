import { useCallback, useEffect, useState } from "react";
import AppLayout from "@/components/AppLayout";
import AdminCrudTable from "@/components/admin/AdminCrudTable";
import { plansApi, superAdminApi } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

export default function SuperAdminPromocodesPage() {
  const { toast } = useToast();
  const [rows, setRows] = useState<any[]>([]);
  const [plans, setPlans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

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
          createDefaults={{
            type: "percentage",
            duration: 30,
            amount: 0,
            code: "",
            expirationDate: "",
            usageLimit: 1,
            usagePerUserLimit: 1,
            planId: "",
          }}
          hiddenFormFields={["status"]}
          fieldOptions={{
            type: ["percentage", "fixed"],
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
              const updatePayload = {
                ...(payload.status != null && payload.status !== "" ? { status: payload.status } : {}),
                ...(payload.usagePerUserLimit != null && payload.usagePerUserLimit !== ""
                  ? { usagePerUserLimit: Number(payload.usagePerUserLimit) }
                  : {}),
                ...(payload.planId != null && payload.planId !== "" ? { planId: Number(payload.planId) } : {}),
              };
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
