import { paymentsApi } from "@/lib/api";

const PADDLE_SCRIPT = "https://cdn.paddle.com/paddle/v2/paddle.js";

export type PaddleRuntimeConfig = {
  clientToken: string;
  environment: "sandbox" | "production";
};

declare global {
  interface Window {
    Paddle?: {
      Environment?: { set: (env: "sandbox" | "production") => void };
      Initialize: (opts: {
        token: string;
        checkout?: { settings?: { successUrl?: string } };
      }) => void;
      Checkout?: { open: (opts: { transactionId: string }) => void };
    };
  }
}

let paddleInitPromise: Promise<boolean> | null = null;

export async function resolvePaddleConfig(): Promise<PaddleRuntimeConfig | null> {
  const viteToken = String(import.meta.env.VITE_PADDLE_CLIENT_TOKEN ?? "").trim();
  if (viteToken) {
    const viteEnv = String(import.meta.env.VITE_PADDLE_ENV ?? "sandbox")
      .trim()
      .toLowerCase();
    return {
      clientToken: viteToken,
      environment: viteEnv === "production" ? "production" : "sandbox",
    };
  }

  try {
    const res = await paymentsApi.getPaddleConfig();
    const clientToken = String(res?.clientToken ?? "").trim();
    if (!clientToken) return null;
    const environment =
      String(res?.environment ?? "sandbox").toLowerCase() === "production"
        ? "production"
        : "sandbox";
    return { clientToken, environment };
  } catch {
    return null;
  }
}

function loadPaddleScript(): Promise<void> {
  return new Promise((resolve, reject) => {
    const existing = document.querySelector(`script[src="${PADDLE_SCRIPT}"]`);
    if (existing) {
      resolve();
      return;
    }

    const script = document.createElement("script");
    script.src = PADDLE_SCRIPT;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Failed to load Paddle.js"));
    document.body.appendChild(script);
  });
}

export async function initPaddleJs(
  config: PaddleRuntimeConfig,
): Promise<boolean> {
  if (paddleInitPromise) return paddleInitPromise;

  paddleInitPromise = (async () => {
    await loadPaddleScript();
    if (!window.Paddle) return false;

    if (config.environment === "sandbox") {
      window.Paddle.Environment?.set("sandbox");
    }

    window.Paddle.Initialize({
      token: config.clientToken,
      checkout: {
        settings: {
          successUrl: `${window.location.origin}/payment/success`,
        },
      },
    });

    return true;
  })();

  return paddleInitPromise;
}

export function openPaddleCheckout(transactionId: string): boolean {
  const txnId = String(transactionId ?? "").trim();
  if (!txnId.startsWith("txn_") || !window.Paddle?.Checkout) return false;
  rememberPendingPaddleTransaction(txnId);
  window.Paddle.Checkout.open({ transactionId: txnId });
  return true;
}

export function rememberPendingPaddleTransaction(transactionId: string) {
  const id = String(transactionId ?? "").trim();
  if (!id.startsWith("txn_")) return;
  try {
    sessionStorage.setItem("paddle_pending_transaction_id", id);
  } catch {
    // ignore
  }
}

export function readPendingPaddleTransaction(): string {
  try {
    const stored = sessionStorage.getItem("paddle_pending_transaction_id");
    return stored?.startsWith("txn_") ? stored : "";
  } catch {
    return "";
  }
}

export function clearPendingPaddleTransaction() {
  try {
    sessionStorage.removeItem("paddle_pending_transaction_id");
  } catch {
    // ignore
  }
}

/** Extract Paddle txn_ id from API fields or checkout review URLs (?_ptxn=). */
export function resolvePaddleTransactionId(
  ...sources: Array<string | number | null | undefined>
): string {
  for (const raw of sources) {
    const value = String(raw ?? "").trim();
    if (!value) continue;
    if (value.startsWith("txn_")) return value;
    try {
      const url = new URL(value);
      const ptxn = url.searchParams.get("_ptxn");
      if (ptxn?.startsWith("txn_")) return ptxn;
    } catch {
      // not a URL
    }
  }
  return "";
}

/** Paddle checkout URLs point back to our review page — not a payment form. */
export function isInternalCheckoutReviewUrl(url: string): boolean {
  const value = String(url ?? "").trim();
  if (!value) return false;
  try {
    const parsed = new URL(value, window.location.origin);
    return parsed.pathname.replace(/\/$/, "").endsWith("/checkout/review");
  } catch {
    return value.includes("/checkout/review");
  }
}
