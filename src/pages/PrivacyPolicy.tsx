import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import PublicPageLayout from "@/components/PublicPageLayout";
import { Database, Cpu, Share2, Trash2, Lock, HelpCircle, DollarSign, ArrowRight } from "lucide-react";

export default function PrivacyPolicyPage() {
  const { t } = useTranslation("legal");
  const yearlyRefundDays = Number(import.meta.env.VITE_YEARLY_REFUND_WINDOW_DAYS || 7);

  return (
    <PublicPageLayout title={t("privacy.title")} subtitle={t("privacy.subtitle")}>
      <div className="max-w-full mx-auto space-y-10 text-muted-foreground">
        <section className="glass rounded-3xl border border-border/50 p-8">
          <div className="flex items-center gap-3 mb-4">
            <Database className="h-5 w-5 text-violet-600 dark:text-violet-400" />
            <h2 className="text-2xl font-bold text-foreground tracking-tight">{t("privacy.s1Title")}</h2>
          </div>
          <p className="leading-relaxed text-lg">{t("privacy.s1Body")}</p>
        </section>

        <section className="glass rounded-3xl border border-border/50 p-8">
          <div className="flex items-center gap-3 mb-4">
            <Cpu className="h-5 w-5 text-violet-600 dark:text-violet-400" />
            <h2 className="text-2xl font-bold text-foreground tracking-tight">{t("privacy.s2Title")}</h2>
          </div>
          <p className="leading-relaxed text-lg">{t("privacy.s2Body")}</p>
        </section>

        <section className="glass rounded-3xl border border-border/50 p-8">
          <div className="flex items-center gap-3 mb-4">
            <Share2 className="h-5 w-5 text-violet-600 dark:text-violet-400" />
            <h2 className="text-2xl font-bold text-foreground tracking-tight">{t("privacy.s3Title")}</h2>
          </div>
          <p className="leading-relaxed text-lg">
            {t("privacy.s3BodyPrefix")}{" "}
            <strong>{t("privacy.s3BodyStrong")}</strong> {t("privacy.s3BodySuffix")}
          </p>
        </section>

        <section className="glass rounded-3xl border border-border/50 p-8">
          <div className="flex items-center gap-3 mb-4">
            <Trash2 className="h-5 w-5 text-violet-600 dark:text-violet-400" />
            <h2 className="text-2xl font-bold text-foreground tracking-tight">{t("privacy.s4Title")}</h2>
          </div>
          <p className="leading-relaxed text-lg">{t("privacy.s4Body")}</p>
        </section>

        <section className="glass rounded-3xl border border-border/50 p-8">
          <div className="flex items-center gap-3 mb-4">
            <Lock className="h-5 w-5 text-violet-600 dark:text-violet-400" />
            <h2 className="text-2xl font-bold text-foreground tracking-tight">{t("privacy.s5Title")}</h2>
          </div>
          <p className="leading-relaxed text-lg">{t("privacy.s5Intro")}</p>
          <ul className="mt-4 space-y-2.5 ps-2 text-base">
            {[
              t("privacy.s5Measure1"),
              t("privacy.s5Measure2"),
              t("privacy.s5Measure3"),
              t("privacy.s5Measure4"),
              t("privacy.s5Measure5"),
            ].map((item) => (
              <li key={item} className="flex items-center gap-3">
                <span className="h-1.5 w-1.5 rounded-full bg-violet-500 shrink-0" />
                {item}
              </li>
            ))}
          </ul>
          <p className="leading-relaxed text-lg mt-6">{t("privacy.s5Footnote")}</p>
        </section>

        <section className="glass rounded-3xl border border-border/50 p-8">
          <div className="flex items-center gap-3 mb-4">
            <HelpCircle className="h-5 w-5 text-violet-600 dark:text-violet-400" />
            <h2 className="text-2xl font-bold text-foreground tracking-tight">{t("privacy.s6Title")}</h2>
          </div>
          <p className="leading-relaxed text-lg flex items-center gap-2 flex-wrap">
            <span>{t("privacy.s6BodyPrefix")}</span>
            <Link
              to="/contact"
              className="text-violet-600 dark:text-violet-400 hover:underline font-medium inline-flex items-center gap-1"
            >
              {t("privacy.s6ContactLink")} <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </p>
        </section>

        <section className="rounded-3xl border border-violet-500/20 bg-violet-500/[0.02] p-8 md:p-10">
          <div className="flex items-center gap-3 mb-5">
            <DollarSign className="h-5 w-5 text-violet-600 dark:text-violet-400" />
            <h2 className="text-2xl font-black text-foreground tracking-tight">{t("privacy.s7Title")}</h2>
          </div>

          <div className="space-y-5 text-lg leading-relaxed">
            <p>{t("privacy.s7Intro")}</p>

            <div className="rounded-2xl border border-border/40 bg-background/60 p-5 space-y-2">
              <h3 className="text-base font-bold text-foreground">{t("privacy.s7MonthlyTitle")}</h3>
              <p className="text-base text-muted-foreground">{t("privacy.s7MonthlyBody")}</p>
            </div>

            <div className="rounded-2xl border border-border/40 bg-background/60 p-5 space-y-2">
              <h3 className="text-base font-bold text-foreground">{t("privacy.s7YearlyTitle")}</h3>
              <p className="text-base text-muted-foreground">
                {t("privacy.s7YearlyBody", { days: yearlyRefundDays })}
              </p>
            </div>

            <p className="text-base">{t("privacy.s7RequestBody", { days: yearlyRefundDays })}</p>

            <div className="space-y-3">
              <p className="text-base font-medium text-foreground">{t("privacy.s7RejectionLead")}</p>
              <ul className="space-y-2 ps-2 text-base">
                {[
                  t("privacy.s7Rejection1"),
                  t("privacy.s7Rejection2"),
                  t("privacy.s7Rejection3"),
                  t("privacy.s7Rejection4"),
                ].map((item) => (
                  <li key={item} className="flex items-center gap-3 text-muted-foreground">
                    <span className="h-1.5 w-1.5 rounded-full bg-violet-500 shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            <p className="text-base font-medium text-foreground border-s-2 border-violet-500/30 ps-4 py-2 bg-violet-500/[0.03] rounded-r-lg">
              {t("privacy.s7CancellationNote")}
            </p>
          </div>
        </section>
      </div>
    </PublicPageLayout>
  );
}
