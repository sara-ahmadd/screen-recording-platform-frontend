import { useTranslation } from "react-i18next";
import PublicPageLayout from "@/components/PublicPageLayout";
import {
  Shield,
  Video,
  Users2,
  CreditCard,
  Activity,
  AlertTriangle,
  RefreshCw,
  Fingerprint,
} from "lucide-react";

export default function TermsAndConditionsPage() {
  const { t } = useTranslation("legal");

  const prohibitedItems = [
    t("terms.s1Prohibited1"),
    t("terms.s1Prohibited2"),
    t("terms.s1Prohibited3"),
    t("terms.s1Prohibited4"),
    t("terms.s1Prohibited5"),
  ];

  const permissions = [
    t("terms.s2Permission1"),
    t("terms.s2Permission2"),
    t("terms.s2Permission3"),
    t("terms.s2Permission4"),
  ];

  const disruptions = [t("terms.s5Disruption1"), t("terms.s5Disruption2"), t("terms.s5Disruption3")];

  return (
    <PublicPageLayout title={t("terms.title")} subtitle={t("terms.subtitle")}>
      <div className="max-w-full mx-auto space-y-12 text-muted-foreground">
        <section className="glass rounded-3xl border border-border/50 p-8 md:p-10">
          <div className="flex items-center gap-3 mb-5">
            <div className="h-10 w-10 rounded-xl bg-violet-500/10 flex items-center justify-center">
              <Fingerprint className="h-5 w-5 text-violet-600 dark:text-violet-400" />
            </div>
            <h2 className="text-3xl font-black text-foreground tracking-tight">{t("terms.introWelcome")}</h2>
          </div>

          <p className="leading-relaxed text-lg">{t("terms.introP1")}</p>
          <p className="leading-relaxed text-lg mt-4">{t("terms.introP2")}</p>
        </section>

        <section className="glass rounded-3xl border border-border/50 p-8">
          <div className="flex items-center gap-3 mb-6">
            <Shield className="h-5 w-5 text-violet-600 dark:text-violet-400" />
            <h2 className="text-2xl font-bold text-foreground tracking-tight">{t("terms.s1Title")}</h2>
          </div>

          <div className="space-y-5 text-base leading-relaxed">
            <p>{t("terms.s1P1")}</p>
            <p>{t("terms.s1P2")}</p>

            <div className="bg-background/40 border border-border/40 rounded-2xl p-5 space-y-3">
              <p className="font-semibold text-foreground text-sm uppercase tracking-wider text-violet-600 dark:text-violet-400">
                {t("terms.s1ProhibitedHeading")}
              </p>
              <ul className="space-y-2.5 text-sm font-medium">
                {prohibitedItems.map((item) => (
                  <li key={item} className="flex items-start gap-2.5">
                    <span className="text-red-500 font-bold mt-0.5">✕</span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            <p className="text-sm">{t("terms.s1Footnote")}</p>
          </div>
        </section>

        <section className="glass rounded-3xl border border-border/50 p-8">
          <div className="flex items-center gap-3 mb-6">
            <Video className="h-5 w-5 text-violet-600 dark:text-violet-400" />
            <h2 className="text-2xl font-bold text-foreground tracking-tight">{t("terms.s2Title")}</h2>
          </div>

          <div className="space-y-5 text-base leading-relaxed">
            <p>
              <strong>{t("terms.s2P1Bold")}</strong> {t("terms.s2P1Rest")}
            </p>
            <p>{t("terms.s2P2")}</p>
            <ul className="space-y-2.5 ps-2 text-sm">
              {permissions.map((item) => (
                <li key={item} className="flex items-center gap-3">
                  <span className="h-1.5 w-1.5 rounded-full bg-violet-500 shrink-0" />
                  {item}
                </li>
              ))}
            </ul>
            <p>{t("terms.s2P3")}</p>
          </div>
        </section>

        <section className="glass rounded-3xl border border-border/50 p-8">
          <div className="flex items-center gap-3 mb-6">
            <Users2 className="h-5 w-5 text-violet-600 dark:text-violet-400" />
            <h2 className="text-2xl font-bold text-foreground tracking-tight">{t("terms.s3Title")}</h2>
          </div>

          <div className="space-y-5 text-base leading-relaxed">
            <p>{t("terms.s3P1")}</p>
            <p>{t("terms.s3P2")}</p>
            <p className="text-sm font-medium border-s-2 border-amber-500/50 ps-4 bg-amber-500/[0.02] py-2 text-foreground">
              {t("terms.s3Warning")}
            </p>
          </div>
        </section>

        <section className="glass rounded-3xl border border-violet-500/20 bg-violet-500/[0.02] p-8 md:p-10">
          <div className="flex items-center gap-3 mb-6">
            <CreditCard className="h-5 w-5 text-violet-600 dark:text-violet-400" />
            <h2 className="text-2xl font-bold text-foreground tracking-tight">{t("terms.s4Title")}</h2>
          </div>

          <div className="space-y-6 text-base leading-relaxed">
            <p>{t("terms.s4P1")}</p>

            <div className="rounded-2xl border border-border/40 bg-background/80 p-6 shadow-sm">
              <h3 className="text-lg font-bold text-foreground mb-2 flex items-center gap-2">
                <span className="text-emerald-500">↑</span> {t("terms.s4UpgradeTitle")}
              </h3>
              <p className="text-sm text-muted-foreground">{t("terms.s4UpgradeBody")}</p>
            </div>

            <div className="rounded-2xl border border-border/40 bg-background/80 p-6 shadow-sm">
              <h3 className="text-lg font-bold text-foreground mb-2 flex items-center gap-2">
                <span className="text-amber-500">↓</span> {t("terms.s4DowngradeTitle")}
              </h3>
              <p className="text-sm text-muted-foreground space-y-3">
                <span>{t("terms.s4DowngradeP1")}</span>
                <span className="block mt-2">{t("terms.s4DowngradeP2")}</span>
              </p>
            </div>

            <div className="rounded-2xl border border-border/40 bg-background/80 p-6 shadow-sm">
              <h3 className="text-lg font-bold text-foreground mb-2 flex items-center gap-2">
                <RefreshCw className="h-4 w-4 text-violet-500" /> {t("terms.s4RenewalsTitle")}
              </h3>
              <p className="text-sm text-muted-foreground">{t("terms.s4RenewalsBody")}</p>
            </div>

            <p className="text-sm italic">{t("terms.s4StripeNote")}</p>
          </div>
        </section>

        <section className="glass rounded-3xl border border-border/50 p-8">
          <div className="flex items-center gap-3 mb-6">
            <Activity className="h-5 w-5 text-violet-600 dark:text-violet-400" />
            <h2 className="text-2xl font-bold text-foreground tracking-tight">{t("terms.s5Title")}</h2>
          </div>

          <div className="space-y-5 text-base leading-relaxed">
            <p>{t("terms.s5P1")}</p>
            <p>{t("terms.s5P2")}</p>
            <ul className="space-y-2 ps-2 text-sm">
              {disruptions.map((item) => (
                <li key={item} className="flex items-center gap-3.5">
                  <span className="h-1 w-2 rounded-full bg-violet-400 shrink-0" />
                  {item}
                </li>
              ))}
            </ul>
            <p className="text-sm">{t("terms.s5Footnote")}</p>
          </div>
        </section>

        <section className="glass rounded-3xl border border-border/50 p-8">
          <div className="flex items-center gap-3 mb-6">
            <AlertTriangle className="h-5 w-5 text-violet-600 dark:text-violet-400" />
            <h2 className="text-2xl font-bold text-foreground tracking-tight">{t("terms.s6Title")}</h2>
          </div>

          <div className="space-y-5 text-base leading-relaxed">
            <p>
              {t("terms.s6P1Prefix")} <strong>{t("terms.s6P1AsIs")}</strong> {t("terms.s6P1And")}{" "}
              <strong>{t("terms.s6P1AsAvailable")}</strong> {t("terms.s6P1Suffix")}
            </p>
            <p>{t("terms.s6P2")}</p>
            <p className="text-sm font-semibold text-foreground">{t("terms.s6Footnote")}</p>
          </div>
        </section>

        <section className="glass rounded-3xl border border-border/50 p-8">
          <h2 className="text-2xl font-bold text-foreground tracking-tight mb-5">{t("terms.s7Title")}</h2>
          <div className="space-y-5 text-base leading-relaxed">
            <p>{t("terms.s7P1")}</p>
            <p>{t("terms.s7P2")}</p>
          </div>
        </section>

        <section className="rounded-3xl border border-violet-500/20 bg-gradient-to-br from-violet-500/[0.06] to-transparent p-8 text-center max-w-3xl mx-auto">
          <h2 className="text-2xl font-black text-foreground tracking-tight mb-3">{t("terms.closingTitle")}</h2>
          <p className="text-base leading-relaxed text-muted-foreground">{t("terms.closingBody")}</p>
        </section>
      </div>
    </PublicPageLayout>
  );
}
