import { useCallback, useEffect, useState } from "react";
import AppLayout from "@/components/AppLayout";
import { superAdminApi } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { useConfirmDialog } from "@/contexts/ConfirmDialogContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { cn } from "@/lib/utils";
import { Loader2, Pencil, PauseCircle, PlayCircle, RefreshCw } from "lucide-react";

type PaymobPlanRow = Record<string, unknown>;

function pickPlanId(row: PaymobPlanRow): string {
  const id = row.id ?? row.plan_id;
  return id != null ? String(id) : "";
}

function coerceBool(v: unknown): boolean {
  if (typeof v === "boolean") return v;
  const s = String(v).trim().toLowerCase();
  return s === "true" || s === "1" || s === "yes";
}

function formatEgpFromCents(cents: unknown): string {
  const n = Number(cents ?? 0);
  if (!Number.isFinite(n)) return "—";
  return (n / 100).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function parsePlansPayload(res: unknown): PaymobPlanRow[] {
  if (!res || typeof res !== "object") return [];
  const r = res as Record<string, unknown>;
  const plans = r.plans;
  return Array.isArray(plans) ? (plans as PaymobPlanRow[]) : [];
}

export default function SuperAdminPaymobPlansPage() {
  const { toast } = useToast();
  const confirm = useConfirmDialog();
  const [rows, setRows] = useState<PaymobPlanRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [editOpen, setEditOpen] = useState(false);
  const [selected, setSelected] = useState<PaymobPlanRow | null>(null);
  const [amountEgp, setAmountEgp] = useState("");
  const [integration, setIntegration] = useState("");
  const [deductions, setDeductions] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await superAdminApi.paymobSubscriptionPlans.list();
      setRows(parsePlansPayload(res));
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Request failed";
      toast({ title: "Could not load Paymob plans", description: message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    void load();
  }, [load]);

  const openEdit = (row: PaymobPlanRow) => {
    setSelected(row);
    const cents = Number(row.amount_cents ?? 0);
    setAmountEgp(Number.isFinite(cents) ? String(cents / 100) : "");
    setIntegration(row.integration != null ? String(row.integration) : "");
    const nod = row.number_of_deductions;
    setDeductions(nod === null || nod === undefined || nod === "" ? "" : String(nod));
    setEditOpen(true);
  };

  const handleSaveEdit = async () => {
    if (!selected) return;
    const id = pickPlanId(selected);
    if (!id) return;
    const egp = Number(amountEgp);
    if (!Number.isFinite(egp) || egp <= 0) {
      toast({ title: "Invalid amount", description: "Enter a positive amount in EGP.", variant: "destructive" });
      return;
    }
    const integ = Number(integration);
    if (!Number.isFinite(integ) || integ <= 0) {
      toast({ title: "Invalid integration", description: "Enter the Paymob integration ID.", variant: "destructive" });
      return;
    }
    const amountCents = Math.max(1, Math.round(egp * 100));
    setSubmitting(true);
    try {
      const payload: {
        amountCents: number;
        integration: number;
        numberOfDeductions?: number | null;
      } = { amountCents, integration: integ };
      const d = deductions.trim();
      if (d === "") payload.numberOfDeductions = null;
      else {
        const n = Number(d);
        if (Number.isFinite(n) && n >= 0) payload.numberOfDeductions = n;
      }
      await superAdminApi.paymobSubscriptionPlans.update(id, payload);
      toast({ title: "Plan updated", description: "Paymob subscription plan was updated." });
      setEditOpen(false);
      await load();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Update failed";
      toast({ title: "Update failed", description: message, variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  const handleSuspend = async (row: PaymobPlanRow) => {
    const id = pickPlanId(row);
    if (!id) return;
    const ok = await confirm({
      title: "Suspend this plan?",
      description: "New subscriptions using this Paymob plan may be blocked until you resume it.",
      confirmText: "Suspend",
      cancelText: "Cancel",
    });
    if (!ok) return;
    try {
      await superAdminApi.paymobSubscriptionPlans.suspend(id);
      toast({ title: "Plan suspended" });
      await load();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Request failed";
      toast({ title: "Suspend failed", description: message, variant: "destructive" });
    }
  };

  const handleResume = async (row: PaymobPlanRow) => {
    const id = pickPlanId(row);
    if (!id) return;
    const ok = await confirm({
      title: "Resume this plan?",
      description: "This re-enables the plan on Paymob for new checkouts.",
      confirmText: "Resume",
      cancelText: "Cancel",
    });
    if (!ok) return;
    try {
      await superAdminApi.paymobSubscriptionPlans.resume(id);
      toast({ title: "Plan resumed" });
      await load();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Request failed";
      toast({ title: "Resume failed", description: message, variant: "destructive" });
    }
  };

  return (
    <AppLayout>
      <div className="mx-auto flex h-[90vh] max-h-[90vh] min-h-0 w-full max-w-7xl flex-col gap-4 overflow-hidden p-6 md:p-8">
        <div className="flex shrink-0 flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Paymob subscription plans</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Plans hosted on Paymob Accept — enable, suspend, or adjust amounts and integration without using the Paymob dashboard.
            </p>
          </div>
          <Button variant="outline" className="shrink-0 gap-2" onClick={() => void load()} disabled={loading}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
            Refresh
          </Button>
        </div>

        <div className="min-h-0 flex-1 overflow-hidden rounded-xl border border-border/80 bg-gradient-to-b from-card/80 to-card/40 shadow-sm">
          <div className="h-full overflow-y-auto overscroll-contain">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="w-[72px]">ID</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead className="whitespace-nowrap">Frequency</TableHead>
                  <TableHead className="whitespace-nowrap">Amount (EGP)</TableHead>
                  <TableHead className="whitespace-nowrap">Integration</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="py-16 text-center">
                      <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary opacity-80" />
                    </TableCell>
                  </TableRow>
                ) : rows.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="py-16 text-center text-muted-foreground">
                      No Paymob subscription plans returned. Create plans from{" "}
                      <span className="font-medium text-foreground">All Plans</span> or verify{" "}
                      <code className="rounded bg-muted px-1 py-0.5 text-xs">PAYMOB_API_KEY</code>.
                    </TableCell>
                  </TableRow>
                ) : (
                  rows.map((row) => {
                    const id = pickPlanId(row);
                    const active = coerceBool(row.is_active);
                    return (
                      <TableRow key={id || JSON.stringify(row)}>
                        <TableCell className="font-mono text-xs text-muted-foreground">{id || "—"}</TableCell>
                        <TableCell className="max-w-[220px] font-medium leading-snug">
                          <span className="line-clamp-2">{String(row.name ?? "—")}</span>
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {row.frequency != null ? `${row.frequency} days` : "—"}
                        </TableCell>
                        <TableCell>{formatEgpFromCents(row.amount_cents)}</TableCell>
                        <TableCell className="font-mono text-xs">{row.integration != null ? String(row.integration) : "—"}</TableCell>
                        <TableCell>
                          <span
                            className={cn(
                              "inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium",
                              active
                                ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400"
                                : "bg-amber-500/15 text-amber-800 dark:text-amber-300",
                            )}
                          >
                            {active ? "Active" : "Suspended"}
                          </span>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-wrap justify-end gap-1">
                            <Button size="sm" variant="ghost" className="h-8 px-2" onClick={() => openEdit(row)}>
                              <Pencil className="mr-1 h-3.5 w-3.5" />
                              Edit
                            </Button>
                            {active ? (
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-8 px-2 text-amber-700 dark:text-amber-400"
                                onClick={() => void handleSuspend(row)}
                              >
                                <PauseCircle className="mr-1 h-3.5 w-3.5" />
                                Suspend
                              </Button>
                            ) : (
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-8 px-2 text-emerald-700 dark:text-emerald-400"
                                onClick={() => void handleResume(row)}
                              >
                                <PlayCircle className="mr-1 h-3.5 w-3.5" />
                                Resume
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      </div>

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="flex max-h-[90vh] max-w-lg flex-col gap-0 overflow-hidden p-0">
          <div className="border-b border-border/60 px-6 pb-3 pt-6 pr-12">
            <DialogHeader>
              <DialogTitle>Update Paymob plan</DialogTitle>
              <DialogDescription>
                Amount is in <strong>EGP</strong> (major units). Paymob stores{" "}
                <code className="rounded bg-muted px-1 text-xs">amount_cents</code>. Integration must match your MOTO /
                subscription integration on Paymob.
              </DialogDescription>
            </DialogHeader>
          </div>
          <div className="space-y-4 overflow-y-auto px-6 py-4">
            <div className="space-y-1">
              <label className="text-sm font-medium">Amount (EGP)</label>
              <Input value={amountEgp} onChange={(e) => setAmountEgp(e.target.value)} inputMode="decimal" placeholder="e.g. 267.80" />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium">Integration ID</label>
              <Input value={integration} onChange={(e) => setIntegration(e.target.value)} inputMode="numeric" />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium">Number of deductions (optional)</label>
              <Input
                value={deductions}
                onChange={(e) => setDeductions(e.target.value)}
                placeholder="Leave empty for Paymob default / null"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2 border-t border-border/60 px-6 py-4">
            <Button variant="outline" onClick={() => setEditOpen(false)}>
              Cancel
            </Button>
            <Button className="gradient-primary" onClick={() => void handleSaveEdit()} disabled={submitting}>
              {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save changes"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}
