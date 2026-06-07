import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Loader2 } from "lucide-react";

export type RefundSubscriptionTarget = {
  id: number;
  provider?: string | null;
  paddleTransactionId?: string | null;
  usdAmount?: number | null;
  user?: { user_name?: string; email?: string } | null;
  workspace?: { name?: string } | null;
};

type RefundType = "full" | "partial";
type RefundStep = "form" | "confirm";

export function isKnownNonRefundable(subscription?: RefundSubscriptionTarget | null) {
  if (!subscription) return false;
  const provider = String(subscription.provider || "").toLowerCase();
  if (provider && provider !== "paddle") return true;
  if (provider === "paddle" && !subscription.paddleTransactionId) return true;
  return false;
}

export function isPaddleRefundable(subscription?: RefundSubscriptionTarget | null) {
  if (!subscription) return false;
  const provider = String(subscription.provider || "").toLowerCase();
  if (provider !== "paddle") return false;
  return Boolean(subscription.paddleTransactionId);
}

export function mapRefundErrorMessage(error: string | undefined, t: (key: string) => string) {
  const msg = String(error || "");
  if (msg.includes("No Paddle transaction found") || msg.includes("No refundable Paddle transaction")) {
    return t("subscriptions.refundErrors.noPaddleTransaction");
  }
  if (/Transaction status is/i.test(msg)) {
    return t("subscriptions.refundErrors.notCompleted");
  }
  if (
    msg.includes("Refund amount exceeds") ||
    msg.includes("over adjusted") ||
    msg.includes("adjustment_transaction_item_over_adjustment")
  ) {
    return t("subscriptions.refundErrors.amountExceedsTotal");
  }
  if (msg.includes("pending Paddle approval") || msg.includes("pending_approval")) {
    return t("subscriptions.refundErrors.pendingApproval");
  }
  if (msg.includes("no remaining refundable balance") || msg.includes("already been made in full")) {
    return t("subscriptions.refundErrors.alreadyRefunded");
  }
  if (msg.includes("Invalid Paddle transaction ID")) {
    return t("subscriptions.refundErrors.invalidTransactionId");
  }
  if (/Invalid request/i.test(msg)) {
    return t("subscriptions.refundErrors.paddleInvalidRequest");
  }
  return msg || t("common:errors.tryAgain");
}

type SuperAdminRefundDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  subscription: RefundSubscriptionTarget | null;
  submitting: boolean;
  onSubmit: (data: { amount?: number; reason?: string }) => void;
};

export default function SuperAdminRefundDialog({
  open,
  onOpenChange,
  subscription,
  submitting,
  onSubmit,
}: SuperAdminRefundDialogProps) {
  const { t } = useTranslation(["admin", "common"]);
  const [refundType, setRefundType] = useState<RefundType>("full");
  const [amount, setAmount] = useState("");
  const [reason, setReason] = useState("admin_refund");
  const [step, setStep] = useState<RefundStep>("form");
  const [amountError, setAmountError] = useState<string | null>(null);

  const maxAmount = useMemo(() => {
    const value = Number(subscription?.usdAmount);
    return Number.isFinite(value) && value > 0 ? value : undefined;
  }, [subscription?.usdAmount]);

  useEffect(() => {
    if (!open) return;
    setRefundType("full");
    setAmount("");
    setReason("admin_refund");
    setStep("form");
    setAmountError(null);
  }, [open, subscription?.id]);

  const userLabel = subscription?.user?.user_name || subscription?.user?.email || "—";
  const workspaceLabel = subscription?.workspace?.name || "—";

  const validatePartialAmount = (): number | null => {
    const parsed = Number(amount);
    if (!Number.isFinite(parsed) || parsed < 0.01) {
      setAmountError(t("subscriptions.refundModal.invalidAmount"));
      return null;
    }
    if (maxAmount != null && parsed > maxAmount) {
      setAmountError(
        t("subscriptions.refundModal.amountExceedsMax", { max: maxAmount.toFixed(2) }),
      );
      return null;
    }
    setAmountError(null);
    return parsed;
  };

  const handleContinue = () => {
    if (refundType === "partial" && validatePartialAmount() == null) return;
    setStep("confirm");
  };

  const handleSubmit = () => {
    if (submitting) return;
    const trimmedReason = reason.trim();
    const body: { amount?: number; reason?: string } = {};
    if (refundType === "partial") {
      const parsed = validatePartialAmount();
      if (parsed == null) {
        setStep("form");
        return;
      }
      body.amount = parsed;
    }
    if (trimmedReason) body.reason = trimmedReason;
    onSubmit(body);
  };

  const summaryAmount =
    refundType === "full"
      ? t("subscriptions.refundModal.fullRefundValue")
      : `$${Number(amount).toFixed(2)} USD`;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {step === "form"
              ? t("subscriptions.refundModal.title")
              : t("subscriptions.refundModal.confirmTitle")}
          </DialogTitle>
          {step === "confirm" ? (
            <DialogDescription>{t("subscriptions.refundModal.confirmWarning")}</DialogDescription>
          ) : null}
        </DialogHeader>

        {step === "form" ? (
          <div className="space-y-4">
            <RadioGroup
              value={refundType}
              onValueChange={(value) => {
                setRefundType(value as RefundType);
                setAmountError(null);
              }}
              className="space-y-2"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="full" id="refund-full" />
                <Label htmlFor="refund-full">{t("subscriptions.refundModal.fullRefund")}</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="partial" id="refund-partial" />
                <Label htmlFor="refund-partial">{t("subscriptions.refundModal.partialRefund")}</Label>
              </div>
            </RadioGroup>

            {refundType === "partial" ? (
              <div className="space-y-1.5">
                <Label htmlFor="refund-amount">{t("subscriptions.refundModal.amountLabel")}</Label>
                <Input
                  id="refund-amount"
                  type="number"
                  min={0.01}
                  step={0.01}
                  max={maxAmount}
                  value={amount}
                  onChange={(e) => {
                    setAmount(e.target.value);
                    setAmountError(null);
                  }}
                  placeholder={t("subscriptions.refundModal.amountPlaceholder")}
                />
                {maxAmount != null ? (
                  <p className="text-xs text-muted-foreground">
                    {t("subscriptions.refundModal.maxAmountHint", { max: maxAmount.toFixed(2) })}
                  </p>
                ) : null}
                {amountError ? <p className="text-xs text-destructive">{amountError}</p> : null}
              </div>
            ) : null}

            <div className="space-y-1.5">
              <Label htmlFor="refund-reason">{t("subscriptions.refundModal.reasonLabel")}</Label>
              <Input
                id="refund-reason"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder={t("subscriptions.refundModal.reasonPlaceholder")}
              />
              <p className="text-xs text-muted-foreground">
                {t("subscriptions.refundModal.reasonHint")}
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-2 rounded-lg border border-border/80 p-3 text-sm">
            <p>
              <span className="text-muted-foreground">
                {t("subscriptions.refundModal.summarySubscription")}:{" "}
              </span>
              #{subscription?.id}
            </p>
            <p>
              <span className="text-muted-foreground">
                {t("subscriptions.refundModal.summaryUser")}:{" "}
              </span>
              {userLabel}
              {workspaceLabel !== "—" ? ` · ${workspaceLabel}` : ""}
            </p>
            <p>
              <span className="text-muted-foreground">
                {t("subscriptions.refundModal.summaryType")}:{" "}
              </span>
              {refundType === "full"
                ? t("subscriptions.refundModal.fullRefund")
                : t("subscriptions.refundModal.partialRefund")}
            </p>
            <p>
              <span className="text-muted-foreground">
                {t("subscriptions.refundModal.summaryAmount")}:{" "}
              </span>
              {summaryAmount}
            </p>
            <p>
              <span className="text-muted-foreground">
                {t("subscriptions.refundModal.summaryReason")}:{" "}
              </span>
              {reason.trim() || "—"}
            </p>
          </div>
        )}

        <DialogFooter className="gap-2 sm:gap-0">
          {step === "confirm" ? (
            <Button type="button" variant="outline" disabled={submitting} onClick={() => setStep("form")}>
              {t("subscriptions.refundModal.back")}
            </Button>
          ) : (
            <Button type="button" variant="outline" disabled={submitting} onClick={() => onOpenChange(false)}>
              {t("common:actions.cancel")}
            </Button>
          )}
          {step === "form" ? (
            <Button type="button" onClick={handleContinue}>
              {t("subscriptions.refundModal.continue")}
            </Button>
          ) : (
            <Button type="button" disabled={submitting} onClick={handleSubmit}>
              {submitting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                t("subscriptions.submitRefund")
              )}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
