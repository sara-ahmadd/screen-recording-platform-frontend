import { useTranslation } from "react-i18next";
import { Loader2 } from "lucide-react";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type PaidToFreeDialogsProps = {
  confirmOpen: boolean;
  onConfirmOpenChange: (open: boolean) => void;
  paidPlanLabel: string;
  onConfirmCancelSubscription: () => void | Promise<void>;
  onDismissConfirm: () => void;
  confirmLoading: boolean;
  periodDialogOpen: boolean;
  onPeriodDialogOpenChange: (open: boolean) => void;
  periodEndLabel: string | null;
  cancelSuccessMessage?: string | null;
  onPeriodAcknowledge: () => void | Promise<void>;
};

export function PaidToFreeDialogs({
  confirmOpen,
  onConfirmOpenChange,
  paidPlanLabel,
  onConfirmCancelSubscription,
  onDismissConfirm,
  confirmLoading,
  periodDialogOpen,
  onPeriodDialogOpenChange,
  periodEndLabel,
  cancelSuccessMessage,
  onPeriodAcknowledge,
}: PaidToFreeDialogsProps) {
  const { t } = useTranslation(["layout", "common"]);

  return (
    <>
      <AlertDialog open={confirmOpen} onOpenChange={onConfirmOpenChange}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("layout:paidToFree.cancelTitle")}</AlertDialogTitle>
            <AlertDialogDescription className="text-left">
              {t("layout:paidToFree.cancelDescription", { plan: paidPlanLabel })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={confirmLoading} onClick={() => onDismissConfirm()}>
              {t("layout:paidToFree.keepPlan")}
            </AlertDialogCancel>
            <Button
              className="gradient-primary sm:mt-0"
              disabled={confirmLoading}
              onClick={() => void onConfirmCancelSubscription()}
            >
              {confirmLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                t("layout:paidToFree.confirmSwitch")
              )}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={periodDialogOpen} onOpenChange={onPeriodDialogOpenChange}>
        <DialogContent
          className="sm:max-w-md [&>button]:hidden"
          onPointerDownOutside={(e) => e.preventDefault()}
          onEscapeKeyDown={(e) => e.preventDefault()}
        >
          <DialogHeader>
            <DialogTitle>{t("layout:paidToFree.cancelledTitle")}</DialogTitle>
            <DialogDescription className="text-left space-y-3 pt-1">
              {cancelSuccessMessage ? (
                <span className="block text-sm text-foreground whitespace-pre-wrap">{cancelSuccessMessage}</span>
              ) : periodEndLabel ? (
                <span>{t("layout:paidToFree.cancelledDescription", { date: periodEndLabel })}</span>
              ) : (
                <span>{t("layout:paidToFree.cancelledDescriptionEnd")}</span>
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button className="gradient-primary" onClick={() => void onPeriodAcknowledge()}>
              {t("common:actions.close")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
