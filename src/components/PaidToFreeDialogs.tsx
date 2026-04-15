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
  /** Server message from subscription cancel/update (shown when present). */
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
  return (
    <>
      <AlertDialog open={confirmOpen} onOpenChange={onConfirmOpenChange}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel current subscription?</AlertDialogTitle>
            <AlertDialogDescription className="text-left space-y-2">
              <span>
                You are on the <span className="font-medium text-foreground capitalize">{paidPlanLabel}</span> plan.
                To move to Free, your current subscription will be cancelled first.
              </span>
              <span className="block">Do you want to continue?</span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={confirmLoading} onClick={() => onDismissConfirm()}>
              Keep current plan
            </AlertDialogCancel>
            <Button
              className="gradient-primary sm:mt-0"
              disabled={confirmLoading}
              onClick={() => void onConfirmCancelSubscription()}
            >
              {confirmLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Yes, cancel and switch to Free"}
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
            <DialogTitle>Subscription cancelled</DialogTitle>
            <DialogDescription className="text-left space-y-3 pt-1">
              {cancelSuccessMessage ? (
                <span className="block text-sm text-foreground whitespace-pre-wrap">{cancelSuccessMessage}</span>
              ) : (
                <span>
                  Your paid plan has been cancelled. You will keep your current plan benefits until{" "}
                  {periodEndLabel ? (
                    <span className="font-medium text-foreground">{periodEndLabel}</span>
                  ) : (
                    "the end of your current billing period"
                  )}
                  . After that, your workspace will follow the Free plan limits once you finish switching to Free.
                </span>
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button className="gradient-primary" onClick={() => void onPeriodAcknowledge()}>
              Continue
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
