import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
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
  Scale,
  FileText,
  Gavel,
} from "lucide-react";

export default function TermsAndConditionsPage() {
  const { t } = useTranslation("legal");

  const responsibilities = [
    t("terms.s1Responsibility1"),
    t("terms.s1Responsibility2"),
    t("terms.s1Responsibility3"),
    t("terms.s1Responsibility4"),
    t("terms.s1Responsibility5"),
  ];

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

  const sensitiveItems = [
    t("terms.s2Sensitive1"),
    t("terms.s2Sensitive2"),
    t("terms.s2Sensitive3"),
    t("terms.s2Sensitive4"),
    t("terms.s2Sensitive5"),
  ];

  const adminDuties = [t("terms.s3Admin1"), t("terms.s3Admin2"), t("terms.s3Admin3")];

  const disruptions = [
    t("terms.s5Disruption1"),
    t("terms.s5Disruption2"),
    t("terms.s5Disruption3"),
    t("terms.s5Disruption4"),
  ];

  const liabilities = [t("terms.s8Liability1"), t("terms.s8Liability2"), t("terms.s8Liability3")];

  const closingItems = [t("terms.closing1"), t("terms.closing2"), t("terms.closing3"), t("terms.closing4")];

  const relatedPolicies = [
    { href: "/privacy-policy", label: t("terms.s9Privacy") },
    { href: "/copyright-policy", label: t("terms.s9Copyright") },
    { href: "/abuse-reporting-policy", label: t("terms.s9Abuse") },
    { href: "/refund-policy", label: t("terms.s9Refund") },
  ] as const;

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
          <p className="leading-relaxed text-lg mt-4 font-medium text-foreground">{t("terms.introP3")}</p>
          <p className="leading-relaxed text-lg mt-4 border-s-2 border-violet-500/30 ps-4 py-2 bg-violet-500/[0.03] rounded-r-lg text-foreground">
            {t("terms.introP4")}
          </p>
          <div className="mt-6 rounded-2xl border border-border/40 bg-background/60 p-5">
            <h3 className="text-lg font-bold text-foreground mb-2">{t("terms.introLegalTitle")}</h3>
            <p className="text-base leading-relaxed">{t("terms.introLegalBody")}</p>
          </div>
        </section>

        <section className="glass rounded-3xl border border-border/50 p-8">
          <div className="flex items-center gap-3 mb-6">
            <Shield className="h-5 w-5 text-violet-600 dark:text-violet-400" />
            <h2 className="text-2xl font-bold text-foreground tracking-tight">{t("terms.s1Title")}</h2>
          </div>

          <div className="space-y-5 text-base leading-relaxed">
            <p>{t("terms.s1P1")}</p>
            <p>{t("terms.s1P2")}</p>
            <ul className="space-y-2 ps-2 text-sm">
              {responsibilities.map((item) => (
                <li key={item} className="flex items-center gap-3">
                  <span className="h-1.5 w-1.5 rounded-full bg-violet-500 shrink-0" />
                  {item}
                </li>
              ))}
            </ul>

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
            <p>{t("terms.s2P1")}</p>
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

            <div className="rounded-2xl border border-amber-500/20 bg-amber-500/[0.02] p-5 space-y-3">
              <p>{t("terms.s2SensitiveIntro")}</p>
              <p className="font-medium text-foreground text-sm">{t("terms.s2SensitiveLead")}</p>
              <ul className="space-y-2 text-sm">
                {sensitiveItems.map((item) => (
                  <li key={item} className="flex items-center gap-3">
                    <span className="h-1.5 w-1.5 rounded-full bg-amber-500 shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
              <p className="text-sm font-medium text-foreground">{t("terms.s2SensitiveAction")}</p>
            </div>
          </div>
        </section>

        <section className="glass rounded-3xl border border-border/50 p-8">
          <div className="flex items-center gap-3 mb-6">
            <Users2 className="h-5 w-5 text-violet-600 dark:text-violet-400" />
            <h2 className="text-2xl font-bold text-foreground tracking-tight">{t("terms.s3Title")}</h2>
          </div>

          <div className="space-y-5 text-base leading-relaxed">
            <p>{t("terms.s3P1")}</p>
            <p className="font-medium text-foreground">{t("terms.s3AdminLead")}</p>
            <ul className="space-y-2 ps-2 text-sm">
              {adminDuties.map((item) => (
                <li key={item} className="flex items-center gap-3">
                  <span className="h-1.5 w-1.5 rounded-full bg-violet-500 shrink-0" />
                  {item}
                </li>
              ))}
            </ul>
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
            <p className="flex flex-wrap items-center gap-1">
              <span>{t("terms.s4P1")}</span>
              <Link to="/refund-policy" className="text-violet-600 dark:text-violet-400 hover:underline font-medium">
                {t("terms.s4RefundLink")}
              </Link>
              <span>.</span>
            </p>

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
              <p className="text-sm text-muted-foreground">{t("terms.s4DowngradeP1")}</p>
            </div>

            <div className="rounded-2xl border border-border/40 bg-background/80 p-6 shadow-sm">
              <h3 className="text-lg font-bold text-foreground mb-2 flex items-center gap-2">
                <RefreshCw className="h-4 w-4 text-violet-500" /> {t("terms.s4RenewalsTitle")}
              </h3>
              <p className="text-sm text-muted-foreground">{t("terms.s4RenewalsBody")}</p>
            </div>

            <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/[0.03] p-6 space-y-3">
              <h3 className="text-lg font-bold text-foreground">{t("terms.s4MorTitle")}</h3>
              <p className="text-sm text-muted-foreground">{t("terms.s4MorBody")}</p>
              <p className="text-sm text-muted-foreground">{t("terms.s4Descriptor")}</p>
              <p className="text-sm text-muted-foreground">{t("terms.s4CancelHow")}</p>
              <p className="text-sm text-muted-foreground">{t("terms.s4Chargebacks")}</p>
              <p className="text-sm text-muted-foreground">{t("terms.s4ConsumerEu")}</p>
            </div>

            <p className="font-medium text-foreground italic">{t("terms.s4PaymentNote")}</p>
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
            <p>{t("terms.s6P1")}</p>
            <p>{t("terms.s6P2")}</p>
          </div>
        </section>

        <section className="glass rounded-3xl border border-border/50 p-8">
          <div className="flex items-center gap-3 mb-6">
            <Gavel className="h-5 w-5 text-violet-600 dark:text-violet-400" />
            <h2 className="text-2xl font-bold text-foreground tracking-tight">{t("terms.s7Title")}</h2>
          </div>
          <p className="text-base leading-relaxed">{t("terms.s7Body")}</p>
        </section>

        <section className="glass rounded-3xl border border-border/50 p-8">
          <div className="flex items-center gap-3 mb-6">
            <AlertTriangle className="h-5 w-5 text-violet-600 dark:text-violet-400" />
            <h2 className="text-2xl font-bold text-foreground tracking-tight">{t("terms.s8Title")}</h2>
          </div>

          <div className="space-y-5 text-base leading-relaxed">
            <p>{t("terms.s8P1")}</p>
            <p>{t("terms.s8P2")}</p>
            <ul className="space-y-2 ps-2 text-sm">
              {liabilities.map((item) => (
                <li key={item} className="flex items-center gap-3">
                  <span className="h-1.5 w-1.5 rounded-full bg-violet-500 shrink-0" />
                  {item}
                </li>
              ))}
            </ul>
            <p className="text-sm font-semibold text-foreground">{t("terms.s8Footnote")}</p>
            <p className="text-sm text-muted-foreground">{t("terms.s8ConsumerEu")}</p>
          </div>
        </section>

        <section className="glass rounded-3xl border border-border/50 p-8">
          <div className="flex items-center gap-3 mb-6">
            <FileText className="h-5 w-5 text-violet-600 dark:text-violet-400" />
            <h2 className="text-2xl font-bold text-foreground tracking-tight">{t("terms.s9Title")}</h2>
          </div>
          <p className="text-base leading-relaxed mb-4">{t("terms.s9Intro")}</p>
          <ul className="space-y-2 text-base">
            {relatedPolicies.map((item) => (
              <li key={item.href}>
                <Link to={item.href} className="text-violet-600 dark:text-violet-400 hover:underline font-medium">
                  {item.label}
                </Link>
              </li>
            ))}
            <li>
              <Link to="/cookie-policy" className="text-violet-600 dark:text-violet-400 hover:underline font-medium">
                {t("terms.s9Cookie")}
              </Link>
            </li>
          </ul>
        </section>

        <section className="glass rounded-3xl border border-border/50 p-8">
          <div className="flex items-center gap-3 mb-6">
            <Gavel className="h-5 w-5 text-violet-600 dark:text-violet-400" />
            <h2 className="text-2xl font-bold text-foreground tracking-tight">{t("terms.s10Title")}</h2>
          </div>
          <p className="text-base leading-relaxed">{t("terms.s10Body")}</p>
        </section>

        <section className="rounded-3xl border border-violet-500/20 bg-gradient-to-br from-violet-500/[0.06] to-transparent p-8 md:p-10 max-w-3xl mx-auto">
          <div className="flex items-center gap-3 mb-4">
            <Scale className="h-5 w-5 text-violet-600 dark:text-violet-400" />
            <h2 className="text-2xl font-black text-foreground tracking-tight">{t("terms.closingTitle")}</h2>
          </div>
          <p className="text-base leading-relaxed text-muted-foreground">{t("terms.closingP1")}</p>
          <p className="mt-6 text-sm font-medium text-foreground">{t("terms.closingLead")}</p>
          <ul className="mt-3 space-y-2">
            {closingItems.map((item) => (
              <li key={item} className="flex items-center gap-3 text-sm text-muted-foreground">
                <span className="h-1.5 w-1.5 rounded-full bg-violet-500 shrink-0" />
                {item}
              </li>
            ))}
          </ul>
        </section>
      </div>
    </PublicPageLayout>
  );
}
