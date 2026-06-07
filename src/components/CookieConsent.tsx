import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";

const STORAGE_KEY = "cookie-consent-accepted";

export default function CookieConsent() {
  const { t } = useTranslation("common");
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    try {
      if (!localStorage.getItem(STORAGE_KEY)) setVisible(true);
    } catch {
      setVisible(true);
    }
  }, []);

  const accept = () => {
    try {
      localStorage.setItem(STORAGE_KEY, "1");
    } catch {
      /* ignore */
    }
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div
      role="dialog"
      aria-live="polite"
      aria-label={t("cookie.title")}
      className="fixed bottom-0 inset-x-0 z-[100] p-4 md:p-6 pointer-events-none"
    >
      <div className="max-w-3xl mx-auto pointer-events-auto glass rounded-2xl border border-border/60 shadow-xl p-5 md:p-6 flex flex-col sm:flex-row sm:items-center gap-4">
        <p className="text-sm text-muted-foreground leading-relaxed flex-1">
          {t("cookie.message")}{" "}
          <Link to="/privacy-policy" className="underline underline-offset-2 text-foreground hover:text-primary">
            {t("nav.privacyPolicy")}
          </Link>
          {" · "}
          <Link to="/cookie-policy" className="underline underline-offset-2 text-foreground hover:text-primary">
            {t("nav.cookiePolicy")}
          </Link>
          {" · "}
          <Link to="/terms-and-conditions" className="underline underline-offset-2 text-foreground hover:text-primary">
            {t("nav.termsConditions")}
          </Link>
        </p>
        <Button onClick={accept} className="gradient-primary shrink-0 rounded-full px-6">
          {t("cookie.accept")}
        </Button>
      </div>
    </div>
  );
}
