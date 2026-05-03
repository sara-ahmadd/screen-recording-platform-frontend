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

type BillingProviderChoice = "stripe" | "paymob";

const defaultPlanBillingProvider = (): BillingProviderChoice => {
  const v = String(
    import.meta.env.VITE_DEFAULT_PLAN_BILLING ?? "paymob",
  ).toLowerCase();
  return v === "stripe" ? "stripe" : "paymob";
};

type PlanForm = {
  name: string;
  description: string;
  billingProvider: BillingProviderChoice;
  defaultBillingCycle: "" | "monthly" | "yearly";
  monthlyPrice: number;
  yearlyPrice: number;
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

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await superAdminApi.plans.list();
      setRows(res?.plans || res?.data || res || []);
    } catch (err: any) {
      toast({ title: "Error loading plans", description: err.message, variant: "destructive" });
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
    const bpRaw = String(plan?.billingProvider ?? "").toLowerCase();
    const billingProvider: BillingProviderChoice =
      bpRaw === "stripe" ? "stripe" : bpRaw === "paymob" ? "paymob" : defaultPlanBillingProvider();
    const dbc = String(plan?.defaultBillingCycle ?? "").toLowerCase();
    const defaultBillingCycle =
      dbc === "monthly" || dbc === "yearly" ? (dbc as "monthly" | "yearly") : "";
    const nextForm: PlanForm = {
      name: String(plan?.name || ""),
      description: String(plan?.description || ""),
      billingProvider,
      defaultBillingCycle,
      monthlyPrice: Number(plan?.monthlyPrice || 0),
      yearlyPrice: Number(plan?.yearlyPrice || 0),
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
        maxVideosPerMonth: Number(form.maxVideosPerMonth || 0),
        maxVideoDuration: Number(form.maxVideoDuration || 0),
        maxStorageGB: Number(form.maxStorageGB || 0),
        maxTeamMembers: Number(form.maxTeamMembers || 0),
        canDownloadVideos: Boolean(form.canDownloadVideos),
        canRemoveWaterMark: Boolean(form.canRemoveWaterMark),
        canSharePublicLink: Boolean(form.canSharePublicLink),
        teamAccess: Boolean(form.teamAccess),
      };

      if (editingPlanId == null) {
        payload.append("name", normalizedForm.name);
        payload.append("description", normalizedForm.description);
        payload.append("monthlyPrice", String(normalizedForm.monthlyPrice));
        payload.append("yearlyPrice", String(normalizedForm.yearlyPrice));
        payload.append("billingProvider", normalizedForm.billingProvider);
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
        toast({ title: "Plan created", description: "Plan was created successfully." });
      } else {
        const baseForm: PlanForm = originalEditForm
          ? {
              name: originalEditForm.name.trim(),
              description: originalEditForm.description.trim(),
              billingProvider: originalEditForm.billingProvider,
              defaultBillingCycle: originalEditForm.defaultBillingCycle,
              monthlyPrice: Number(originalEditForm.monthlyPrice || 0),
              yearlyPrice: Number(originalEditForm.yearlyPrice || 0),
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
          toast({ title: "No changes to update", description: "Edit at least one field before saving." });
          return;
        }

        await superAdminApi.plans.update(editingPlanId, payload);
        toast({ title: "Plan updated", description: "Plan was updated successfully." });
      }
      setDialogOpen(false);
      await load();
    } catch (err: any) {
      toast({ title: "Failed to save plan", description: err.message, variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    const ok = await confirm({
      title: "Delete plan?",
      description: "This action cannot be undone.",
      confirmText: "Delete",
      cancelText: "Cancel",
    });
    if (!ok) return;
    try {
      await superAdminApi.plans.delete(id);
      await load();
    } catch (err: any) {
      toast({ title: "Failed to delete plan", description: err.message, variant: "destructive" });
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
      <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-4">
        <div className="flex items-center justify-between gap-3">
          <h1 className="text-3xl font-bold">All Plans</h1>
          <Button className="gradient-primary" onClick={openCreateDialog}>
            <Plus className="h-4 w-4 mr-2" /> Create New Plan
          </Button>
        </div>

        <div className="rounded-xl border border-border/80 bg-card/40 overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Billing</TableHead>
                <TableHead>Monthly</TableHead>
                <TableHead>Yearly</TableHead>
                <TableHead>Limits</TableHead>
                <TableHead>Features</TableHead>
                <TableHead className="text-right">Actions</TableHead>
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
                    No plans found.
                  </TableCell>
                </TableRow>
              ) : (
                rows.map((plan: any) => (
                  <TableRow key={plan.id}>
                    <TableCell className="capitalize font-medium">{plan.name || `Plan ${plan.id}`}</TableCell>
                    <TableCell className="text-xs text-muted-foreground capitalize">
                      {plan.billingProvider || "—"}
                    </TableCell>
                    <TableCell>${Number(plan.monthlyPrice || 0)}</TableCell>
                    <TableCell>${Number(plan.yearlyPrice || 0)}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {Number(plan.maxVideosPerMonth || 0)} videos/mo, {Number(plan.maxStorageGB || 0)} GB,{" "}
                      {Number(plan.maxTeamMembers || 0)} members
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {[
                        plan.canDownloadVideos && "Downloads",
                        plan.canRemoveWaterMark && "No watermark",
                        plan.canSharePublicLink && "Public sharing",
                        plan.teamAccess && "Team access",
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
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editingPlanId == null ? "Create New Plan" : "Update Plan"}</DialogTitle>
            <DialogDescription>
              Choose Stripe or Paymob for paid plans. The backend creates prices or Paymob subscription plans automatically. Paymob amounts use USD list prices and are converted to EGP for Paymob.
            </DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="space-y-2 md:col-span-2">
              <label className="text-sm font-medium">Payment provider (paid plans)</label>
              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  variant={form.billingProvider === "stripe" ? "default" : "outline"}
                  className={form.billingProvider === "stripe" ? "gradient-primary" : ""}
                  onClick={() => setForm((p) => ({ ...p, billingProvider: "stripe" }))}
                >
                  Stripe
                </Button>
                <Button
                  type="button"
                  variant={form.billingProvider === "paymob" ? "default" : "outline"}
                  className={form.billingProvider === "paymob" ? "gradient-primary" : ""}
                  onClick={() => setForm((p) => ({ ...p, billingProvider: "paymob" }))}
                >
                  Paymob
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                This controls how checkout and renewals run for subscribers on this plan.
              </p>
            </div>
            <div className="space-y-1 md:col-span-2">
              <label className="text-sm font-medium">Default billing cycle (optional)</label>
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
                <option value="">No default</option>
                <option value="monthly">Monthly</option>
                <option value="yearly">Yearly</option>
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium">Plan name</label>
              <Input value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} />
            </div>
            <div className="space-y-1 md:col-span-2">
              <label className="text-sm font-medium">Description</label>
              <textarea
                value={form.description}
                onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
                rows={4}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
              />
            </div>
            <div className="space-y-1 md:col-span-2">
              <label className="text-sm font-medium">Plan logo</label>
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
                  alt="Plan logo preview"
                  className="h-12 w-12 rounded-md border border-border object-cover mt-2"
                />
              )}
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium">Monthly price (USD)</label>
              <Input type="number" value={form.monthlyPrice} onChange={(e) => setNum("monthlyPrice", e.target.value)} />
              {form.billingProvider === "paymob" && (
                <p className="text-xs text-muted-foreground">Converted to EGP for Paymob plan amounts.</p>
              )}
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium">Yearly price (USD)</label>
              <Input type="number" value={form.yearlyPrice} onChange={(e) => setNum("yearlyPrice", e.target.value)} />
              {form.billingProvider === "paymob" && (
                <p className="text-xs text-muted-foreground">Converted to EGP for Paymob plan amounts.</p>
              )}
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium">Max videos/month</label>
              <Input type="number" value={form.maxVideosPerMonth} onChange={(e) => setNum("maxVideosPerMonth", e.target.value)} />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium">Max video duration (min)</label>
              <Input type="number" value={form.maxVideoDuration} onChange={(e) => setNum("maxVideoDuration", e.target.value)} />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium">Max storage (GB)</label>
              <Input type="number" value={form.maxStorageGB} onChange={(e) => setNum("maxStorageGB", e.target.value)} />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium">Max team members</label>
              <Input type="number" value={form.maxTeamMembers} onChange={(e) => setNum("maxTeamMembers", e.target.value)} />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
            <label className="flex items-center gap-2 text-sm">
              <Checkbox
                checked={form.canDownloadVideos}
                onCheckedChange={(v) => setForm((p) => ({ ...p, canDownloadVideos: v === true }))}
              />
              Can download videos
            </label>
            <label className="flex items-center gap-2 text-sm">
              <Checkbox
                checked={form.canRemoveWaterMark}
                onCheckedChange={(v) => setForm((p) => ({ ...p, canRemoveWaterMark: v === true }))}
              />
              Can remove watermark
            </label>
            <label className="flex items-center gap-2 text-sm">
              <Checkbox
                checked={form.canSharePublicLink}
                onCheckedChange={(v) => setForm((p) => ({ ...p, canSharePublicLink: v === true }))}
              />
              Can share public link
            </label>
            <label className="flex items-center gap-2 text-sm">
              <Checkbox
                checked={form.teamAccess}
                onCheckedChange={(v) => setForm((p) => ({ ...p, teamAccess: v === true }))}
              />
              Team access
            </label>
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button className="gradient-primary" onClick={() => void handleSave()} disabled={submitting}>
              {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : editingPlanId == null ? "Create Plan" : "Update Plan"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>
              Plan Details {detailsPlan?.id != null ? `#${detailsPlan.id}` : ""}
            </DialogTitle>
            <DialogDescription>Detailed information for the selected plan.</DialogDescription>
          </DialogHeader>
          {!detailsPlan ? (
            <p className="text-sm text-muted-foreground">No plan data available.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[60vh] overflow-y-auto pr-1">
              {Object.entries(detailsPlan).map(([key, value]) => (
                <div key={key} className="rounded-md border border-border p-3 bg-card/40">
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">{prettifyLabel(key)}</p>
                  <p className="mt-1 text-sm break-words">
                    {value == null ? "—" : typeof value === "object" ? JSON.stringify(value) : String(value)}
                  </p>
                </div>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}
