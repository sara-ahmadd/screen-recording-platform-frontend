import { useTranslation } from "react-i18next";
import { Building2, Calendar, Shield } from "lucide-react";

type EditorialBylineProps = {
  variant?: "compact" | "full";
  className?: string;
};

export default function EditorialByline({ variant = "full", className = "" }: EditorialBylineProps) {
  const { t } = useTranslation("marketing");

  if (variant === "compact") {
    return (
      <p className={`text-sm text-muted-foreground ${className}`}>
        <span className="font-medium text-foreground">{t("eeat.publisherName")}</span>
        {" · "}
        {t("eeat.updatedLabel")}: {t("eeat.contentFreshness")}
      </p>
    );
  }

  return (
    <aside
      className={`rounded-2xl border border-border/60 bg-muted/20 p-5 md:p-6 ${className}`}
      aria-label={t("eeat.bylineAria")}
    >
      <div className="flex items-start gap-4">
        <div className="h-12 w-12 shrink-0 rounded-xl bg-violet-500/10 flex items-center justify-center">
          <Building2 className="h-6 w-6 text-violet-600 dark:text-violet-400" />
        </div>
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-wider text-violet-600 dark:text-violet-400">
            {t("eeat.publishedBy")}
          </p>
          <p className="mt-1 text-lg font-semibold text-foreground">{t("eeat.publisherName")}</p>
          <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{t("eeat.publisherBio")}</p>
          <div className="mt-4 flex flex-wrap gap-4 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1.5">
              <Calendar className="h-3.5 w-3.5" />
              {t("eeat.updatedLabel")}: {t("eeat.contentFreshness")}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Shield className="h-3.5 w-3.5" />
              {t("eeat.reviewedLabel")}
            </span>
          </div>
        </div>
      </div>
    </aside>
  );
}
