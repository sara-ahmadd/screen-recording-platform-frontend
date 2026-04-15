import { toast } from "@/hooks/use-toast";
import { messageFromApiSuccessResponse } from "@/lib/apiMessage";

type ToastApiSuccessOptions = {
  title?: string;
  fallbackDescription?: string;
};

/** Prefer server `message` / `description` from JSON; otherwise use fallback copy. */
export function toastApiSuccess(res: unknown, options?: ToastApiSuccessOptions) {
  const { title = "Success", fallbackDescription } = options ?? {};
  const description = messageFromApiSuccessResponse(res) ?? fallbackDescription;
  toast({
    variant: "success",
    title,
    ...(description ? { description } : {}),
  });
}

/** Success toast without an API body (e.g. purely client-side confirmation). */
export function toastSuccess(title: string, description?: string) {
  toast({
    variant: "success",
    title,
    ...(description ? { description } : {}),
  });
}
