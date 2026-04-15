import { useCallback, useMemo, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { subscriptionApi } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { toastApiSuccess } from "@/lib/appToast";
import {
  getCurrentWorkspaceSubscription,
  isPaidSubscription,
  messageFromSubscriptionUpdateResponse,
  subscriptionDisplayName,
} from "@/lib/workspaceSubscription";

function formatPeriodEnd(value?: string | null) {
  if (!value) return null;
  const dt = new Date(value);
  if (Number.isNaN(dt.getTime())) return null;
  return dt.toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" });
}

export function usePaidToFreeSubscribe() {
  const { user, selectedWorkspaceId, refreshUser } = useAuth();
  const { toast } = useToast();
  const [busyPlanId, setBusyPlanId] = useState<number | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [periodDialogOpen, setPeriodDialogOpen] = useState(false);
  const [pendingPlan, setPendingPlan] = useState<any | null>(null);
  const [paidPlanLabel, setPaidPlanLabel] = useState("");
  const [periodEndLabel, setPeriodEndLabel] = useState<string | null>(null);
  const [cancelSuccessMessage, setCancelSuccessMessage] = useState<string | null>(null);

  const selectedWorkspace = useMemo(() => {
    if (!user || !selectedWorkspaceId) return null;
    return (user.workspaces || []).find((ws: any) => String(ws.id) === selectedWorkspaceId) || null;
  }, [user, selectedWorkspaceId]);

  const runCreateFree = useCallback(
    async (plan: any) => {
      if (!selectedWorkspaceId || !plan?.id) return;
      const res = await subscriptionApi.create({
        type: "null",
        planId: String(plan.id),
        workspaceId: selectedWorkspaceId,
      });
      const sessionUrl = res?.session_url || res?.sessionUrl || res?.url || res?.checkoutUrl;
      if (sessionUrl) {
        const opened = window.open(sessionUrl, "_blank", "noopener,noreferrer");
        if (!opened) window.location.href = sessionUrl;
        return;
      }
      toastApiSuccess(res, { title: "Subscribed", fallbackDescription: "You are now on the free plan." });
      await refreshUser();
    },
    [selectedWorkspaceId, toast, refreshUser]
  );

  const handlePeriodDialogContinue = useCallback(async () => {
    const plan = pendingPlan;
    setPendingPlan(null);
    setPeriodDialogOpen(false);
    setPeriodEndLabel(null);
    setCancelSuccessMessage(null);
    if (!plan) return;
    setBusyPlanId(plan.id);
    try {
      await runCreateFree(plan);
    } catch (err: any) {
      toast({ title: "Subscription failed", description: err?.message, variant: "destructive" });
    } finally {
      setBusyPlanId(null);
    }
  }, [pendingPlan, runCreateFree, toast]);

  const handleConfirmDowngrade = useCallback(async () => {
    if (!pendingPlan || !selectedWorkspaceId || !selectedWorkspace) return;

    const sub = getCurrentWorkspaceSubscription(selectedWorkspace);
    if (!sub?.id) {
      toast({
        title: "No subscription",
        description: "Could not find a subscription to cancel.",
        variant: "destructive",
      });
      return;
    }

    const wasPaid = isPaidSubscription(sub);
    const periodEnd = formatPeriodEnd(sub.currentPeriodEnd);

    setBusyPlanId(pendingPlan.id);
    try {
      const updateRes = await subscriptionApi.update(Number(sub.id));
      await refreshUser();
      setConfirmOpen(false);
      if (wasPaid) {
        setPeriodEndLabel(periodEnd);
        setCancelSuccessMessage(messageFromSubscriptionUpdateResponse(updateRes));
        setPeriodDialogOpen(true);
      } else {
        const plan = pendingPlan;
        setPendingPlan(null);
        await runCreateFree(plan);
      }
    } catch (err: any) {
      toast({
        title: "Could not cancel subscription",
        description: err?.message || "Please try again.",
        variant: "destructive",
      });
    } finally {
      setBusyPlanId(null);
    }
  }, [pendingPlan, selectedWorkspaceId, selectedWorkspace, toast, refreshUser, runCreateFree]);

  const requestFreeSubscribe = useCallback(
    (plan: any) => {
      if (!user || !selectedWorkspaceId || !plan?.id) {
        toast({
          title: "Workspace required",
          description: user ? "Please select a workspace first." : "Please sign in to subscribe.",
          variant: "destructive",
        });
        return;
      }
      if (!selectedWorkspace) {
        toast({
          title: "Workspace not found",
          description: "Select a valid workspace and try again.",
          variant: "destructive",
        });
        return;
      }

      const sub = getCurrentWorkspaceSubscription(selectedWorkspace);
      if (isPaidSubscription(sub)) {
        setPaidPlanLabel(subscriptionDisplayName(sub));
        setPendingPlan(plan);
        setConfirmOpen(true);
        return;
      }

      setBusyPlanId(plan.id);
      void (async () => {
        try {
          await runCreateFree(plan);
        } catch (err: any) {
          toast({ title: "Subscription failed", description: err.message, variant: "destructive" });
        } finally {
          setBusyPlanId(null);
        }
      })();
    },
    [user, selectedWorkspaceId, selectedWorkspace, toast, runCreateFree]
  );

  const cancelDowngradeConfirm = useCallback(() => {
    setPendingPlan(null);
    setConfirmOpen(false);
    setCancelSuccessMessage(null);
  }, []);

  const handlePeriodDialogOpenChange = useCallback((open: boolean) => {
    setPeriodDialogOpen(open);
    if (!open) setCancelSuccessMessage(null);
  }, []);

  return {
    busyPlanId,
    confirmOpen,
    setConfirmOpen,
    periodDialogOpen,
    handlePeriodDialogOpenChange,
    paidPlanLabel,
    periodEndLabel,
    cancelSuccessMessage,
    confirmLoading: busyPlanId !== null && confirmOpen,
    requestFreeSubscribe,
    handleConfirmDowngrade,
    handlePeriodDialogContinue,
    cancelDowngradeConfirm,
  };
}
