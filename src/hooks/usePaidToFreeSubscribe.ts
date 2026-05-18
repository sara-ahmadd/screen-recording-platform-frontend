import { useCallback, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/contexts/AuthContext";
import { subscriptionApi } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { toastApiSuccess } from "@/lib/appToast";
import {
  getCurrentWorkspaceSubscription,
  isPaidSubscription,
  subscriptionDisplayName,
} from "@/lib/workspaceSubscription";

function formatPeriodEnd(value?: string | null) {
  if (!value) return null;
  const dt = new Date(value);
  if (Number.isNaN(dt.getTime())) return null;
  return dt.toLocaleDateString(undefined, {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export function usePaidToFreeSubscribe() {
  const { t } = useTranslation(["billing", "common"]);
  const { user, selectedWorkspaceId, refreshUser } = useAuth();
  const { toast } = useToast();
  const [busyPlanId, setBusyPlanId] = useState<number | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [periodDialogOpen, setPeriodDialogOpen] = useState(false);
  const [pendingPlan, setPendingPlan] = useState<any | null>(null);
  const [paidPlanLabel, setPaidPlanLabel] = useState("");
  const [periodEndLabel, setPeriodEndLabel] = useState<string | null>(null);
  const [cancelSuccessMessage, setCancelSuccessMessage] = useState<
    string | null
  >(null);

  const selectedWorkspace = useMemo(() => {
    if (!user || !selectedWorkspaceId) return null;
    return (
      (user.workspaces || []).find(
        (ws: any) => String(ws.id) === selectedWorkspaceId,
      ) || null
    );
  }, [user, selectedWorkspaceId]);

  const runCreateFree = useCallback(
    async (plan: any) => {
      if (!selectedWorkspaceId || !plan?.id) return;
      const res = await subscriptionApi.create({
        type: "null",
        planId: String(plan.id),
        workspaceId: selectedWorkspaceId,
      });
      const sessionUrl =
        res?.session_url || res?.sessionUrl || res?.url || res?.checkoutUrl;
      if (sessionUrl) {
        const opened = window.open(sessionUrl, "_blank", "noopener,noreferrer");
        if (!opened) window.location.href = sessionUrl;
        return;
      }
      toastApiSuccess(res, {
        title: t("paidToFreeToast.subscribed"),
        fallbackDescription: t("paidToFreeToast.nowOnFree"),
      });
      await refreshUser();
    },
    [selectedWorkspaceId, toast, refreshUser, t],
  );

  const handlePeriodDialogContinue = useCallback(async () => {
    const plan = pendingPlan;
    setPendingPlan(null);
    setPeriodDialogOpen(false);
    setPeriodEndLabel(null);
    setCancelSuccessMessage(null);
    if (!plan) return;
    setConfirmOpen(false);
  }, [pendingPlan, runCreateFree, toast]);

  const handleConfirmDowngrade = useCallback(async () => {
    if (!pendingPlan || !selectedWorkspaceId || !selectedWorkspace) return;

    const sub = getCurrentWorkspaceSubscription(selectedWorkspace);
    if (!sub?.id) {
      toast({
        title: t("paidToFreeToast.noSubscription"),
        description: t("paidToFreeToast.noSubscriptionDesc"),
        variant: "destructive",
      });
      return;
    }

    setBusyPlanId(pendingPlan.id);
    try {
      const downgradePayload = {
        type: "null" as const,
        planId: String(pendingPlan.id),
        workspaceId: String(selectedWorkspaceId),
        subscriptionId: String(sub.id),
      };
      const updateRes = await subscriptionApi.downgrade(
        Number(sub.id),
        downgradePayload,
      );
      await refreshUser();
      toastApiSuccess(updateRes, {
        title: t("updated"),
        fallbackDescription: t("paidToFreeToast.downgradedDesc"),
      });
      setConfirmOpen(false);
      setPendingPlan(null);
      setPeriodEndLabel(null);
      setCancelSuccessMessage(null);
      setPeriodDialogOpen(false);
    } catch (err: any) {
      toast({
        title: t("paidToFreeToast.downgradeFailed"),
        description: err?.message || t("paidToFreeToast.tryAgain"),
        variant: "destructive",
      });
    } finally {
      setBusyPlanId(null);
    }
  }, [pendingPlan, selectedWorkspaceId, selectedWorkspace, toast, refreshUser, t]);

  const requestFreeSubscribe = useCallback(
    (plan: any) => {
      if (!user || !selectedWorkspaceId || !plan?.id) {
        toast({
          title: t("common:workspace.required"),
          description: user
            ? t("common:workspace.selectFirst")
            : t("common:plans.signInToSubscribe"),
          variant: "destructive",
        });
        return;
      }
      if (!selectedWorkspace) {
        toast({
          title: t("paidToFreeToast.workspaceNotFound"),
          description: t("paidToFreeToast.workspaceNotFoundDesc"),
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
          toast({
            title: t("subscriptionFailed"),
            description: err.message,
            variant: "destructive",
          });
        } finally {
          setBusyPlanId(null);
        }
      })();
    },
    [user, selectedWorkspaceId, selectedWorkspace, toast, runCreateFree, t],
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
