import { useTranslation } from "react-i18next";
import { Languages } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { LANGUAGE_STORAGE_KEY, normalizeLanguage, type AppLanguage } from "@/i18n/constants";
import { syncDocumentLanguage } from "@/i18n/syncDocumentLanguage";

type LanguageSwitcherProps = {
  className?: string;
  variant?: "default" | "ghost" | "outline";
  size?: "default" | "sm" | "icon";
};

export default function LanguageSwitcher({
  className,
  variant = "outline",
  size = "sm",
}: LanguageSwitcherProps) {
  const { t, i18n } = useTranslation("common");
  const current = normalizeLanguage(i18n.language);
  const next: AppLanguage = current === "en" ? "ar" : "en";

  const switchLanguage = async () => {
    await i18n.changeLanguage(next);
    if (typeof window !== "undefined") {
      window.localStorage.setItem(LANGUAGE_STORAGE_KEY, next);
    }
    syncDocumentLanguage(next);
  };

  return (
    <Button
      type="button"
      variant={variant}
      size={size}
      className={cn("gap-1.5 font-medium", className)}
      onClick={() => void switchLanguage()}
      aria-label={t("language.switchAria", { language: t(`language.names.${next}`) })}
      title={t("language.switchTo", { language: t(`language.names.${next}`) })}
    >
      <Languages className="h-4 w-4 shrink-0" aria-hidden />
      <span className="text-xs uppercase tracking-wide">{current === "ar" ? "EN" : "AR"}</span>
    </Button>
  );
}
