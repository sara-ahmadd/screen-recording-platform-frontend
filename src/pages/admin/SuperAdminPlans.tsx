import { useTranslation } from "react-i18next";
import { useCallback, useEffect, useState } from "react";
import AppLayout from "@/components/AppLayout";
import { superAdminApi } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { useConfirmDialog } from "@/contexts/ConfirmDialogContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
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
import { Eye, Loader2, Pencil, Plus, Trash2 } from "lucide-react";

type BillingProviderChoice = "paddle";

const defaultPlanBillingProvider = (): BillingProviderChoice => "paddle";

type PlanForm = {
  name: string;
  description: string;
  billingProvider: BillingProviderChoice;
  defaultBillingCycle: "" | "monthly" | "yearly";
  monthlyPrice: number;
  yearlyPrice: number;
  monthlyPriceId: string;
  yearlyPriceId: string;
  paddleProductId: string;
  maxVideosPerMonth: number;
  maxVideoDuration: number;
  maxStorageGB: number;
  maxTeamMembers: number;
  canDownloadVideos: boolean;
  canRemoveWaterMark: boolean;
  canSharePublicLink: boolean;
  teamAccess: boolean;
};

const emptyForm = (): PlanForm => ({
  name: "",
  description: "",
  billingProvider: defaultPlanBillingProvider(),
  defaultBillingCycle: "",
  monthlyPrice: 0,
  yearlyPrice: 0,
  monthlyPriceId: "",
  yearlyPriceId: "",
  paddleProductId: "",
  maxVideosPerMonth: 0,
  maxVideoDuration: 0,
  maxStorageGB: 0,
  maxTeamMembers: 0,
  canDownloadVideos: false,
  canRemoveWaterMark: false,
  canSharePublicLink: false,
  teamAccess: false,
});

export default function SuperAdminPlansPage() {
  const { t } = useTranslation(["admin", "common"]);
  const { toast } = useToast();
  const confirm = useConfirmDialog();
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingPlanId, setEditingPlanId] = useState<number | null>(null);
  const [form, setForm] = useState<PlanForm>(emptyForm());
  const [originalEditForm, setOriginalEditForm] = useState<PlanForm | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [detailsPlan, setDetailsPlan] = useState<any | null>(null);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string>("");

  const ensureNumericInput = (value: string): number | null => {
    if (value.trim() === "") return null;
    const n = Number(value);
    if (!Number.isFinite(n)) return null;
    return n;
  };

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await superAdminApi.plans.list();
      setRows(res?.plans || res?.data || res || []);
    } catch (err: any) {
      toast({ title: t("errorLoadingPlans"), description: err?.message || t("common:errors.tryAgain"), variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    void load();
  }, [load]);

  const openCreateDialog = () => {
    setEditingPlanId(null);
    setForm(emptyForm());
    setOriginalEditForm(null);
    setLogoFile(null);
    setLogoPreview("");
    setDialogOpen(true);
  };

  const openEditDialog = (plan: any) => {
    setEditingPlanId(Number(plan?.id));
    const billingProvider: BillingProviderChoice = defaultPlanBillingProvider();
    const dbc = String(plan?.defaultBillingCycle ?? "").toLowerCase();
    const defaultBillingCycle =
      dbc === "monthly" || dbc === "yearly" ? (dbc as "monthly" | "yearly") : "";
    const nextForm: PlanForm = {
      name: String(plan?.name || ""),
      description: String(plan?.description || ""),
      billingProvider,
      defaultBillingCycle,
      monthlyPrice: Number(plan?.monthlyPriceUSD ?? plan?.monthlyPrice ?? 0),
      yearlyPrice: Number(plan?.yearlyPriceUSD ?? plan?.yearlyPrice ?? 0),
      monthlyPriceId: String(plan?.monthlyPriceId ?? ""),
      yearlyPriceId: String(plan?.yearlyPriceId ?? ""),
      paddleProductId: String(plan?.paddleProductId ?? ""),
      maxVideosPerMonth: Number(plan?.maxVideosPerMonth || 0),
      maxVideoDuration: Number(plan?.maxVideoDuration || 0),
      maxStorageGB: Number(plan?.maxStorageGB || 0),
      maxTeamMembers: Number(plan?.maxTeamMembers || 0),
      canDownloadVideos: Boolean(plan?.canDownloadVideos),
      canRemoveWaterMark: Boolean(plan?.canRemoveWaterMark),
      canSharePublicLink: Boolean(plan?.canSharePublicLink),
      teamAccess: Boolean(plan?.teamAccess),
    };
    setForm(nextForm);
    setOriginalEditForm(nextForm);
    setLogoFile(null);
    setLogoPreview(String(plan?.logo || plan?.logoUrl || ""));
    setDialogOpen(true);
  };

  const handleSave = async () => {
    setSubmitting(true);
    try {
      const payload = new FormData();
      const normalizedForm: PlanForm = {
        name: form.name.trim(),
        description: form.description.trim(),
        billingProvider: form.billingProvider,
        defaultBillingCycle: form.defaultBillingCycle,
        monthlyPrice: Number(form.monthlyPrice || 0),
        yearlyPrice: Number(form.yearlyPrice || 0),
        monthlyPriceId: String(form.monthlyPriceId || "").trim(),
        yearlyPriceId: String(form.yearlyPriceId || "").trim(),
        paddleProductId: String(form.paddleProductId || "").trim(),
        maxVideosPerMonth: Number(form.maxVideosPerMonth || 0),
        maxVideoDuration: Number(form.maxVideoDuration || 0),
        maxStorageGB: Number(form.maxStorageGB || 0),
        maxTeamMembers: Number(form.maxTeamMembers || 0),
        canDownloadVideos: Boolean(form.canDownloadVideos),
        canRemoveWaterMark: Boolean(form.canRemoveWaterMark),
        canSharePublicLink: Boolean(form.canSharePublicLink),
        teamAccess: Boolean(form.teamAccess),
      };
      if (normalizedForm.monthlyPrice < 0 || normalizedForm.yearlyPrice < 0) {
        toast({
          title: t("invalidPrice"),
          description: t("plans.invalidPriceDesc"),
          variant: "destructive",
        });
        return;
      }

      if (editingPlanId == null) {
        payload.append("name", normalizedForm.name);
        payload.append("description", normalizedForm.description);
        payload.append("monthlyPrice", String(normalizedForm.monthlyPrice));
        payload.append("yearlyPrice", String(normalizedForm.yearlyPrice));
        payload.append("monthlyPriceId", normalizedForm.monthlyPriceId);
        payload.append("yearlyPriceId", normalizedForm.yearlyPriceId);
        if (normalizedForm.paddleProductId) {
          payload.append("paddleProductId", normalizedForm.paddleProductId);
        }
        payload.append("billingProvider", "paddle");
        if (normalizedForm.defaultBillingCycle) {
          payload.append("defaultBillingCycle", normalizedForm.defaultBillingCycle);
        }
        payload.append("maxVideosPerMonth", String(normalizedForm.maxVideosPerMonth));
        payload.append("maxVideoDuration", String(normalizedForm.maxVideoDuration));
        payload.append("maxStorageGB", String(normalizedForm.maxStorageGB));
        payload.append("maxTeamMembers", String(normalizedForm.maxTeamMembers));
        payload.append("canDownloadVideos", String(normalizedForm.canDownloadVideos));
        payload.append("canRemoveWaterMark", String(normalizedForm.canRemoveWaterMark));
        payload.append("canSharePublicLink", String(normalizedForm.canSharePublicLink));
        payload.append("teamAccess", String(normalizedForm.teamAccess));
        if (logoFile) payload.append("logo", logoFile);
        await superAdminApi.plans.create(payload);
        toast({ title: t("planCreated"), description: t("planCreatedDesc") });
      } else {
        const baseForm: PlanForm = originalEditForm
          ? {
              name: originalEditForm.name.trim(),
              description: originalEditForm.description.trim(),
              billingProvider: originalEditForm.billingProvider,
              defaultBillingCycle: originalEditForm.defaultBillingCycle,
              monthlyPrice: Number(originalEditForm.monthlyPrice || 0),
              yearlyPrice: Number(originalEditForm.yearlyPrice || 0),
              monthlyPriceId: String(originalEditForm.monthlyPriceId || "").trim(),
              yearlyPriceId: String(originalEditForm.yearlyPriceId || "").trim(),
              paddleProductId: String(originalEditForm.paddleProductId || "").trim(),
              maxVideosPerMonth: Number(originalEditForm.maxVideosPerMonth || 0),
              maxVideoDuration: Number(originalEditForm.maxVideoDuration || 0),
              maxStorageGB: Number(originalEditForm.maxStorageGB || 0),
              maxTeamMembers: Number(originalEditForm.maxTeamMembers || 0),
              canDownloadVideos: Boolean(originalEditForm.canDownloadVideos),
              canRemoveWaterMark: Boolean(originalEditForm.canRemoveWaterMark),
              canSharePublicLink: Boolean(originalEditForm.canSharePublicLink),
              teamAccess: Boolean(originalEditForm.teamAccess),
            }
          : emptyForm();

        let hasChanges = false;
        (Object.keys(normalizedForm) as (keyof PlanForm)[]).forEach((key) => {
          if (normalizedForm[key] !== baseForm[key]) {
            payload.append(key, String(normalizedForm[key]));
            hasChanges = true;
          }
        });
        if (logoFile) {
          payload.append("logo", logoFile);
          hasChanges = true;
        }

        if (!hasChanges) {
          toast({ title: t("plans.noChangesTitle"), description: t("noChangesDesc") });
          return;
        }

        await superAdminApi.plans.update(editingPlanId, payload);
        toast({ title: t("planUpdated"), description: t("planUpdatedDesc") });
      }
      setDialogOpen(false);
      await load();
    } catch (err: any) {
      toast({ title: t("failedSavePlan"), description: err?.message || t("common:errors.tryAgain"), variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    const ok = await confirm({
      title: t("deletePlanTitle"),
      description: t("plans.deleteConfirmDesc"),
      confirmText: t("crud.delete"),
      cancelText: t("common:actions.cancel"),
    });
    if (!ok) return;
    try {
      await superAdminApi.plans.delete(id);
      await load();
    } catch (err: any) {
      toast({ title: t("failedDeletePlan"), description: err?.message || t("common:errors.tryAgain"), variant: "destructive" });
    }
  };

  const setNum = (key: keyof PlanForm, value: string) => {
    setForm((prev) => ({ ...prev, [key]: Number(value || 0) }));
  };

  const prettifyLabel = (value: string) =>
    value
      .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
      .replace(/[_-]+/g, " ")
      .replace(/\s+/g, " ")
      .trim()
      .replace(/\b\w/g, (s) => s.toUpperCase());

  const openDetailsDialog = (plan: any) => {
    setDetailsPlan(plan || null);
    setDetailsOpen(true);
  };

  return (
    <AppLayout>
      <div className="mx-auto flex h-[90vh] max-h-[90vh] min-h-0 w-full max-w-7xl flex-col gap-4 overflow-hidden p-6 md:p-8">
        <div className="flex shrink-0 flex-wrap items-center justify-between gap-3">
          <h1 className="text-3xl font-bold">{t("allPlans")}</h1>
          <Button className="gradient-primary" onClick={openCreateDialog}>
            <Plus className="h-4 w-4 mr-2" /> {t("createNewPlan")}
          </Button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain rounded-xl border border-border/80 bg-card/40">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("table.name")}</TableHead>
                <TableHead>{t("table.billing")}</TableHead>
                <TableHead>{t("table.monthly")}</TableHead>
                <TableHead>{t("table.yearly")}</TableHead>
                <TableHead>{t("table.limits")}</TableHead>
                <TableHead>{t("table.features")}</TableHead>
                <TableHead className="text-right">{t("table.actions")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={7} className="py-10 text-center">
                    <Loader2 className="h-5 w-5 animate-spin text-primary mx-auto" />
                  </TableCell>
                </TableRow>
              ) : rows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="py-10 text-center text-muted-foreground">
                    {t("plans.noPlansFound")}
                  </TableCell>
                </TableRow>
              ) : (
                rows.map((plan: any) => (
                  <TableRow key={plan.id}>
                    <TableCell className="capitalize font-medium">{plan.name || t("plans.planFallback", { id: plan.id })}</TableCell>
                    <TableCell className="text-xs text-muted-foreground capitalize">
                      {plan.billingProvider || "—"}
                    </TableCell>
                    <TableCell>
                      {t("plans.priceUsd", {
                        amount: Number(plan.monthlyPriceUSD ?? plan.monthlyPrice ?? 0).toLocaleString(),
                      })}
                    </TableCell>
                    <TableCell>
                      {t("plans.priceUsd", {
                        amount: Number(plan.yearlyPriceUSD ?? plan.yearlyPrice ?? 0).toLocaleString(),
                      })}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {t("plans.limitsSummary", {
                        videos: Number(plan.maxVideosPerMonth || 0),
                        storage: Number(plan.maxStorageGB || 0),
                        members: Number(plan.maxTeamMembers || 0),
                      })}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {[
                        plan.canDownloadVideos && t("downloads"),
                        plan.canRemoveWaterMark && t("noWatermark"),
                        plan.canSharePublicLink && t("publicSharing"),
                        plan.teamAccess && t("teamAccess"),
                      ]
                        .filter(Boolean)
                        .join(" | ") || "—"}
                    </TableCell>
                    <TableCell>
                      <div className="flex justify-end gap-2">
                        <Button size="icon" variant="ghost" onClick={() => openEditDialog(plan)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button size="icon" variant="ghost" onClick={() => openDetailsDialog(plan)}>
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="text-destructive hover:text-destructive"
                          onClick={() => void handleDelete(Number(plan.id))}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="flex max-h-[90vh] max-w-2xl flex-col gap-0 overflow-hidden p-0">
          <div className="shrink-0 border-b border-border/60 px-6 pb-3 pt-6 pr-12">
            <DialogHeader>
              <DialogTitle>{editingPlanId == null ? t("createNewPlan") : t("updatePlan")}</DialogTitle>
              <DialogDescription>{t("plans.dialogCreateDesc")}</DialogDescription>
            </DialogHeader>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-6 py-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="space-y-2 md:col-span-2">
              <label className="text-sm font-medium">{t("plans.paymentProvider")}</label>
              <p className="rounded-md border border-border/60 bg-muted/30 px-3 py-2 text-sm font-medium">
                Paddle (USD)
              </p>
              <p className="text-xs text-muted-foreground">{t("plans.paymentProviderHint")}</p>
            </div>
            <div className="space-y-1 md:col-span-2">
              <label className="text-sm font-medium">{t("plans.billingCycleDefault")}</label>
              <select
                value={form.defaultBillingCycle}
                onChange={(e) =>
                  setForm((p) => ({
                    ...p,
                    defaultBillingCycle: e.target.value as PlanForm["defaultBillingCycle"],
                  }))
                }
                className="w-full max-w-md rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="">{t("plans.noDefault")}</option>
                <option value="monthly">{t("plans.monthly")}</option>
                <option value="yearly">{t("plans.yearly")}</option>
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium">{t("plans.planName")}</label>
              <Input value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} />
            </div>
            <div className="space-y-1 md:col-span-2">
              <label className="text-sm font-medium">{t("plans.description")}</label>
              <textarea
                value={form.description}
                onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
                rows={4}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
              />
            </div>
            <div className="space-y-1 md:col-span-2">
              <label className="text-sm font-medium">{t("plans.planLogo")}</label>
              <Input
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const selected = e.target.files?.[0] ?? null;
                  setLogoFile(selected);
                  if (selected) {
                    setLogoPreview(URL.createObjectURL(selected));
                  }
                }}
              />
              {logoPreview && (
                <img
                  src={logoPreview}
                  alt={t("planLogoPreview")}
                  className="h-12 w-12 rounded-md border border-border object-cover mt-2"
                />
              )}
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium">{t("plans.monthlyPriceUsd")}</label>
              <Input
                type="number"
                value={form.monthlyPrice}
                required
                onChange={(e) => {
                  const numeric = ensureNumericInput(e.target.value);
                  if (numeric == null) return;
                  setNum("monthlyPrice", e.target.value);
                }}
              />
              <p className="text-xs text-muted-foreground">{t("plans.usdPriceHint")}</p>
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium">{t("plans.yearlyPriceUsd")}</label>
              <Input
                type="number"
                value={form.yearlyPrice}
                required
                onChange={(e) => {
                  const numeric = ensureNumericInput(e.target.value);
                  if (numeric == null) return;
                  setNum("yearlyPrice", e.target.value);
                }}
              />
              <p className="text-xs text-muted-foreground">{t("plans.usdPriceHint")}</p>
            </div>
            <div className="space-y-1 md:col-span-2">
              <label className="text-sm font-medium">{t("plans.monthlyPriceId")}</label>
              <Input
                value={form.monthlyPriceId}
                placeholder="pri_..."
                onChange={(e) => setForm((p) => ({ ...p, monthlyPriceId: e.target.value }))}
              />
            </div>
            <div className="space-y-1 md:col-span-2">
              <label className="text-sm font-medium">{t("plans.yearlyPriceId")}</label>
              <Input
                value={form.yearlyPriceId}
                placeholder="pri_..."
                onChange={(e) => setForm((p) => ({ ...p, yearlyPriceId: e.target.value }))}
              />
              <p className="text-xs text-muted-foreground">{t("plans.paddlePriceIdHint")}</p>
            </div>
            <div className="space-y-1 md:col-span-2">
              <label className="text-sm font-medium">{t("plans.paddleProductId")}</label>
              <Input
                value={form.paddleProductId}
                placeholder="pro_... (optional)"
                onChange={(e) => setForm((p) => ({ ...p, paddleProductId: e.target.value }))}
              />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium">{t("plans.maxVideosMonth")}</label>
              <Input type="number" value={form.maxVideosPerMonth} onChange={(e) => setNum("maxVideosPerMonth", e.target.value)} />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium">{t("plans.maxVideoDuration")}</label>
              <Input type="number" value={form.maxVideoDuration} onChange={(e) => setNum("maxVideoDuration", e.target.value)} />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium">{t("plans.maxStorage")}</label>
              <Input type="number" value={form.maxStorageGB} onChange={(e) => setNum("maxStorageGB", e.target.value)} />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium">{t("plans.maxTeamMembers")}</label>
              <Input type="number" value={form.maxTeamMembers} onChange={(e) => setNum("maxTeamMembers", e.target.value)} />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
            <label className="flex items-center gap-2 text-sm">
              <Checkbox
                checked={form.canDownloadVideos}
                onCheckedChange={(v) => setForm((p) => ({ ...p, canDownloadVideos: v === true }))}
              />
              {t("plans.canDownloadVideos")}
            </label>
            <label className="flex items-center gap-2 text-sm">
              <Checkbox
                checked={form.canRemoveWaterMark}
                onCheckedChange={(v) => setForm((p) => ({ ...p, canRemoveWaterMark: v === true }))}
              />
              {t("plans.canRemoveWatermark")}
            </label>
            <label className="flex items-center gap-2 text-sm">
              <Checkbox
                checked={form.canSharePublicLink}
                onCheckedChange={(v) => setForm((p) => ({ ...p, canSharePublicLink: v === true }))}
              />
              {t("plans.canSharePublicLink")}
            </label>
            <label className="flex items-center gap-2 text-sm">
              <Checkbox
                checked={form.teamAccess}
                onCheckedChange={(v) => setForm((p) => ({ ...p, teamAccess: v === true }))}
              />
              {t("plans.teamAccess")}
            </label>
          </div>
          </div>

          <div className="flex shrink-0 justify-end gap-2 border-t border-border/60 bg-background px-6 py-4">
            <Button variant="outline" onClick={() => setDialogOpen(false)}>{t("common:actions.cancel")}</Button>
            <Button className="gradient-primary" onClick={() => void handleSave()} disabled={submitting}>
              {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : editingPlanId == null ? t("createPlan") : t("updatePlan")}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        <DialogContent className="flex max-h-[90vh] max-w-3xl flex-col gap-0 overflow-hidden p-0">
          <div className="shrink-0 border-b border-border/60 px-6 pb-3 pt-6 pr-12">
            <DialogHeader>
              <DialogTitle>
                {detailsPlan?.id != null
                  ? t("plans.planDetailsWithId", { id: detailsPlan.id })
                  : t("plans.planDetails")}
              </DialogTitle>
              <DialogDescription>{t("plans.planDetailsDesc")}</DialogDescription>
            </DialogHeader>
          </div>
          {!detailsPlan ? (
            <div className="px-6 py-4">
              <p className="text-sm text-muted-foreground">{t("plans.noPlanData")}</p>
            </div>
          ) : (
            <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-6 py-4">
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2 md:pr-1">
                {Object.entries(detailsPlan).map(([key, value]) => (
                  <div key={key} className="rounded-md border border-border bg-card/40 p-3">
                    <p className="text-xs uppercase tracking-wide text-muted-foreground">{prettifyLabel(key)}</p>
                    <p className="mt-1 break-words text-sm">
                      {value == null ? "—" : typeof value === "object" ? JSON.stringify(value) : String(value)}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}
