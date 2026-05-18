import { useTranslation } from "react-i18next";
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
  const { t } = useTranslation(["admin", "common"]);
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
  const [integritySummary, setIntegritySummary] = useState<string>("");
  const [integrityLoading, setIntegrityLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await superAdminApi.paymobSubscriptionPlans.list();
      setRows(parsePlansPayload(res));
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : t("requestFailed");
      toast({ title: t("couldNotLoadPaymob"), description: message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [toast, t]);

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
      toast({ title: t("invalidAmount"), description: t("invalidAmountDesc"), variant: "destructive" });
      return;
    }
    const integ = Number(integration);
    if (!Number.isFinite(integ) || integ <= 0) {
      toast({ title: t("invalidIntegration"), description: t("invalidIntegrationDesc"), variant: "destructive" });
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
      toast({ title: t("paymobUpdated"), description: t("paymobUpdatedDesc") });
      setEditOpen(false);
      await load();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : t("updateFailed");
      toast({ title: t("updateFailed"), description: message, variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  const handleSuspend = async (row: PaymobPlanRow) => {
    const id = pickPlanId(row);
    if (!id) return;
    const ok = await confirm({
      title: t("suspendTitle"),
      description: t("suspendDesc"),
      confirmText: t("suspend"),
      cancelText: t("common:actions.cancel"),
    });
    if (!ok) return;
    try {
      await superAdminApi.paymobSubscriptionPlans.suspend(id);
      toast({ title: t("planSuspended") });
      await load();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : t("requestFailed");
      toast({ title: t("suspendFailed"), description: message, variant: "destructive" });
    }
  };

  const handleResume = async (row: PaymobPlanRow) => {
    const id = pickPlanId(row);
    if (!id) return;
    const ok = await confirm({
      title: t("resumeTitle"),
      description: t("resumeDesc"),
      confirmText: t("resume"),
      cancelText: t("common:actions.cancel"),
    });
    if (!ok) return;
    try {
      await superAdminApi.paymobSubscriptionPlans.resume(id);
      toast({ title: t("planResumed") });
      await load();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : t("requestFailed");
      toast({ title: t("resumeFailed"), description: message, variant: "destructive" });
    }
  };

  const handleAuditIncomplete = async () => {
    setIntegrityLoading(true);
    try {
      const res = await superAdminApi.paymobSubscriptions.incomplete();
      const count = Number((res as any)?.count ?? (res as any)?.data?.count ?? 0);
      setIntegritySummary(t("integrityIncomplete", { count }));
      toast({
        title: t("auditComplete"),
        description: t("paymob.auditCompleteDesc", { count }),
      });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : t("auditFailed");
      toast({ title: t("auditFailed"), description: message, variant: "destructive" });
    } finally {
      setIntegrityLoading(false);
    }
  };

  const handleRepairIncomplete = async (mode: "relink" | "mark_invalid") => {
    const ok = await confirm({
      title: mode === "relink" ? t("relinkTitle") : t("markInvalidTitle"),
      description: mode === "relink" ? t("relinkDesc") : t("markInvalidDesc"),
      confirmText: mode === "relink" ? t("runRelink") : t("markInvalid"),
      cancelText: t("common:actions.cancel"),
    });
    if (!ok) return;

    setIntegrityLoading(true);
    try {
      const res = await superAdminApi.paymobSubscriptions.repair(mode);
      const payload = (res as any)?.data ?? res;
      const relinked = Number(payload?.relinked ?? 0);
      const unresolved = Number(payload?.unresolved ?? 0);
      const markedInvalid = Number(payload?.markedInvalid ?? 0);
      setIntegritySummary(
        t("repairResult", { relinked, unresolved, markedInvalid }),
      );
      toast({
        title: t("repairCompleted"),
        description:
          mode === "relink"
            ? t("repairRelinked", { relinked, unresolved })
            : t("repairMarkedInvalid", { markedInvalid }),
      });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : t("repairFailed");
      toast({ title: t("repairFailed"), description: message, variant: "destructive" });
    } finally {
      setIntegrityLoading(false);
    }
  };

  return (
    <AppLayout>
      <div className="mx-auto flex h-[90vh] max-h-[90vh] min-h-0 w-full max-w-7xl flex-col gap-4 overflow-hidden p-6 md:p-8">
        <div className="flex shrink-0 flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{t("paymobPlans")}</h1>
            <p className="mt-1 text-sm text-muted-foreground">{t("paymob.description")}</p>
          </div>
          <Button variant="outline" className="shrink-0 gap-2" onClick={() => void load()} disabled={loading}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
            {t("refresh")}
          </Button>
        </div>

        <div className="shrink-0 rounded-xl border border-border/80 bg-card/60 p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-sm font-semibold">{t("paymob.integrityTitle")}</h2>
              <p className="text-xs text-muted-foreground">{t("paymob.integrityDesc")}</p>
              {integritySummary ? (
                <p className="mt-1 text-xs text-foreground">{integritySummary}</p>
              ) : null}
            </div>
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" size="sm" onClick={() => void handleAuditIncomplete()} disabled={integrityLoading}>
                {integrityLoading ? <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" /> : null}
                {t("paymob.auditIncomplete")}
              </Button>
              <Button variant="outline" size="sm" onClick={() => void handleRepairIncomplete("relink")} disabled={integrityLoading}>
                {t("paymob.relinkMissing")}
              </Button>
              <Button variant="outline" size="sm" onClick={() => void handleRepairIncomplete("mark_invalid")} disabled={integrityLoading}>
                {t("paymob.markUnresolved")}
              </Button>
            </div>
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-hidden rounded-xl border border-border/80 bg-gradient-to-b from-card/80 to-card/40 shadow-sm">
          <div className="h-full overflow-y-auto overscroll-contain">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="w-[72px]">{t("table.id")}</TableHead>
                  <TableHead>{t("table.name")}</TableHead>
                  <TableHead className="whitespace-nowrap">{t("table.frequency")}</TableHead>
                  <TableHead className="whitespace-nowrap">{t("table.amountEgp")}</TableHead>
                  <TableHead className="whitespace-nowrap">{t("table.integration")}</TableHead>
                  <TableHead>{t("status")}</TableHead>
                  <TableHead className="text-right">{t("table.actions")}</TableHead>
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
                      {t("paymob.noPlansEmpty", {
                        allPlans: t("paymob.allPlansLink"),
                        envKey: "PAYMOB_API_KEY",
                      })}
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
                          {row.frequency != null ? t("paymob.frequencyDays", { count: row.frequency }) : "—"}
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
                            {active ? t("active") : t("suspended")}
                          </span>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-wrap justify-end gap-1">
                            <Button size="sm" variant="ghost" className="h-8 px-2" onClick={() => openEdit(row)}>
                              <Pencil className="mr-1 h-3.5 w-3.5" />
                              {t("edit")}
                            </Button>
                            {active ? (
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-8 px-2 text-amber-700 dark:text-amber-400"
                                onClick={() => void handleSuspend(row)}
                              >
                                <PauseCircle className="mr-1 h-3.5 w-3.5" />
                                {t("suspend")}
                              </Button>
                            ) : (
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-8 px-2 text-emerald-700 dark:text-emerald-400"
                                onClick={() => void handleResume(row)}
                              >
                                <PlayCircle className="mr-1 h-3.5 w-3.5" />
                                {t("resume")}
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
              <DialogTitle>{t("paymob.updateDialogTitle")}</DialogTitle>
              <DialogDescription>{t("paymob.updateDialogDesc")}</DialogDescription>
            </DialogHeader>
          </div>
          <div className="space-y-4 overflow-y-auto px-6 py-4">
            <div className="space-y-1">
              <label className="text-sm font-medium">{t("paymob.amountEgpLabel")}</label>
              <Input value={amountEgp} onChange={(e) => setAmountEgp(e.target.value)} inputMode="decimal" placeholder={t("paymob.amountPlaceholder")} />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium">{t("paymob.integrationIdLabel")}</label>
              <Input value={integration} onChange={(e) => setIntegration(e.target.value)} inputMode="numeric" />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium">{t("paymob.deductionsLabel")}</label>
              <Input
                value={deductions}
                onChange={(e) => setDeductions(e.target.value)}
                placeholder={t("paymobDefaultPlaceholder")}
              />
            </div>
          </div>
          <div className="flex justify-end gap-2 border-t border-border/60 px-6 py-4">
            <Button variant="outline" onClick={() => setEditOpen(false)}>
              {t("common:actions.cancel")}
            </Button>
            <Button className="gradient-primary" onClick={() => void handleSaveEdit()} disabled={submitting}>
              {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : t("saveChanges")}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}
