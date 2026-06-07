import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import PublicPageLayout from "@/components/PublicPageLayout";
import {
  Database,
  Cpu,
  Share2,
  Trash2,
  Lock,
  HelpCircle,
  ShieldAlert,
  Scale,
  FileText,
  ArrowRight,
  CreditCard,
  Globe,
  Cookie,
  UserCheck,
  Building2,
} from "lucide-react";

export default function PrivacyPolicyPage() {
  const { t } = useTranslation("legal");

  const processors = [
    t("privacy.s3Processor1"),
    t("privacy.s3Processor2"),
    t("privacy.s3Processor3"),
    t("privacy.s3Processor4"),
    t("privacy.s3Processor5"),
    t("privacy.s3Processor6"),
  ];

  const legalBases = [
    t("privacy.s2Basis1"),
    t("privacy.s2Basis2"),
    t("privacy.s2Basis3"),
    t("privacy.s2Basis4"),
  ];

  const retentionItems = [
    t("privacy.s4Active"),
    t("privacy.s4Trash"),
    t("privacy.s4Deleted"),
    t("privacy.s4Backups"),
    t("privacy.s4Logs"),
    t("privacy.s4Billing"),
  ];

  const securityMeasures = [
    t("privacy.s6Measure1"),
    t("privacy.s6Measure2"),
    t("privacy.s6Measure3"),
    t("privacy.s6Measure4"),
    t("privacy.s6Measure5"),
  ];

  const rights = [
    t("privacy.s9Right1"),
    t("privacy.s9Right2"),
    t("privacy.s9Right3"),
    t("privacy.s9Right4"),
    t("privacy.s9Right5"),
    t("privacy.s9Right6"),
    t("privacy.s9Right7"),
  ];

  const sensitiveExamples = [
    t("privacy.s11Example1"),
    t("privacy.s11Example2"),
    t("privacy.s11Example3"),
    t("privacy.s11Example4"),
    t("privacy.s11Example5"),
  ];

  return (
    <PublicPageLayout title={t("privacy.title")} subtitle={t("privacy.subtitle")}>
      <div className="max-w-full mx-auto space-y-10 text-muted-foreground">
        <p className="text-sm text-muted-foreground">{t("privacy.lastUpdated")}</p>

        <section className="glass rounded-3xl border border-violet-500/20 bg-violet-500/[0.02] p-8">
          <div className="flex items-center gap-3 mb-4">
            <Building2 className="h-5 w-5 text-violet-600 dark:text-violet-400" />
            <h2 className="text-2xl font-bold text-foreground tracking-tight">{t("privacy.controllerTitle")}</h2>
          </div>
          <p className="leading-relaxed text-lg">{t("privacy.controllerBody")}</p>
        </section>

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
          <div className="mt-6 space-y-3">
            <h3 className="text-lg font-semibold text-foreground">{t("privacy.s2LegalTitle")}</h3>
            <p className="leading-relaxed">{t("privacy.s2LegalIntro")}</p>
            <ul className="space-y-2.5 ps-2 text-base">
              {legalBases.map((item) => (
                <li key={item} className="flex items-start gap-3">
                  <span className="h-1.5 w-1.5 rounded-full bg-violet-500 shrink-0 mt-2" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
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
          <ul className="mt-4 space-y-2.5 ps-2 text-base">
            {processors.map((item) => (
              <li key={item} className="flex items-center gap-3">
                <span className="h-1.5 w-1.5 rounded-full bg-violet-500 shrink-0" />
                {item}
              </li>
            ))}
          </ul>
        </section>

        <section className="glass rounded-3xl border border-border/50 p-8">
          <div className="flex items-center gap-3 mb-4">
            <Trash2 className="h-5 w-5 text-violet-600 dark:text-violet-400" />
            <h2 className="text-2xl font-bold text-foreground tracking-tight">{t("privacy.s4Title")}</h2>
          </div>
          <p className="leading-relaxed text-lg">{t("privacy.s4Body")}</p>
          <ul className="mt-4 space-y-2.5 ps-2 text-base">
            {retentionItems.map((item) => (
              <li key={item} className="flex items-start gap-3">
                <span className="h-1.5 w-1.5 rounded-full bg-violet-500 shrink-0 mt-2" />
                {item}
              </li>
            ))}
          </ul>
        </section>

        <section className="glass rounded-3xl border border-border/50 p-8">
          <div className="flex items-center gap-3 mb-4">
            <CreditCard className="h-5 w-5 text-violet-600 dark:text-violet-400" />
            <h2 className="text-2xl font-bold text-foreground tracking-tight">{t("privacy.s5PaddleTitle")}</h2>
          </div>
          <p className="leading-relaxed text-lg">{t("privacy.s5PaddleBody")}</p>
        </section>

        <section className="glass rounded-3xl border border-border/50 p-8">
          <div className="flex items-center gap-3 mb-4">
            <Lock className="h-5 w-5 text-violet-600 dark:text-violet-400" />
            <h2 className="text-2xl font-bold text-foreground tracking-tight">{t("privacy.s6Title")}</h2>
          </div>
          <p className="leading-relaxed text-lg">{t("privacy.s6Intro")}</p>
          <ul className="mt-4 space-y-2.5 ps-2 text-base">
            {securityMeasures.map((item) => (
              <li key={item} className="flex items-center gap-3">
                <span className="h-1.5 w-1.5 rounded-full bg-violet-500 shrink-0" />
                {item}
              </li>
            ))}
          </ul>
          <p className="leading-relaxed text-lg mt-6">{t("privacy.s6Footnote")}</p>
          <p className="leading-relaxed text-lg mt-4">{t("privacy.s6Breach")}</p>
        </section>

        <section className="glass rounded-3xl border border-border/50 p-8">
          <div className="flex items-center gap-3 mb-4">
            <Globe className="h-5 w-5 text-violet-600 dark:text-violet-400" />
            <h2 className="text-2xl font-bold text-foreground tracking-tight">{t("privacy.s7Title")}</h2>
          </div>
          <p className="leading-relaxed text-lg">{t("privacy.s7Body")}</p>
        </section>

        <section className="glass rounded-3xl border border-border/50 p-8">
          <div className="flex items-center gap-3 mb-4">
            <Cookie className="h-5 w-5 text-violet-600 dark:text-violet-400" />
            <h2 className="text-2xl font-bold text-foreground tracking-tight">{t("privacy.s8Title")}</h2>
          </div>
          <p className="leading-relaxed text-lg">
            {t("privacy.s8Body")}{" "}
            <Link to="/cookie-policy" className="text-violet-600 dark:text-violet-400 hover:underline font-medium">
              {t("cookie.title")}
            </Link>
          </p>
        </section>

        <section className="glass rounded-3xl border border-border/50 p-8">
          <div className="flex items-center gap-3 mb-4">
            <UserCheck className="h-5 w-5 text-violet-600 dark:text-violet-400" />
            <h2 className="text-2xl font-bold text-foreground tracking-tight">{t("privacy.s9Title")}</h2>
          </div>
          <p className="leading-relaxed text-lg">{t("privacy.s9Intro")}</p>
          <ul className="mt-4 space-y-2.5 ps-2 text-base">
            {rights.map((item) => (
              <li key={item} className="flex items-center gap-3">
                <span className="h-1.5 w-1.5 rounded-full bg-violet-500 shrink-0" />
                {item}
              </li>
            ))}
          </ul>
          <p className="leading-relaxed text-lg mt-6">{t("privacy.s9How")}</p>
        </section>

        <section className="glass rounded-3xl border border-border/50 p-8">
          <div className="flex items-center gap-3 mb-4">
            <HelpCircle className="h-5 w-5 text-violet-600 dark:text-violet-400" />
            <h2 className="text-2xl font-bold text-foreground tracking-tight">{t("privacy.s10Title")}</h2>
          </div>
          <p className="leading-relaxed text-lg flex items-center gap-2 flex-wrap">
            <span>{t("privacy.s10BodyPrefix")}</span>
            <Link
              to="/contact"
              className="text-violet-600 dark:text-violet-400 hover:underline font-medium inline-flex items-center gap-1"
            >
              {t("privacy.s10ContactLink")} <ArrowRight className="h-3.5 w-3.5" />
            </Link>
            <span>{t("privacy.s10Email")}</span>
          </p>
        </section>

        <section className="rounded-3xl border border-amber-500/20 bg-amber-500/[0.02] p-8 md:p-10">
          <div className="flex items-center gap-3 mb-5">
            <ShieldAlert className="h-5 w-5 text-violet-600 dark:text-violet-400" />
            <h2 className="text-2xl font-black text-foreground tracking-tight">{t("privacy.s11Title")}</h2>
          </div>
          <div className="space-y-5 text-lg leading-relaxed">
            <p>{t("privacy.s11Intro")}</p>
            <p className="text-base font-medium text-foreground">{t("privacy.s11ExamplesLead")}</p>
            <ul className="space-y-2 ps-2 text-base">
              {sensitiveExamples.map((item) => (
                <li key={item} className="flex items-center gap-3 text-muted-foreground">
                  <span className="h-1.5 w-1.5 rounded-full bg-violet-500 shrink-0" />
                  {item}
                </li>
              ))}
            </ul>
            <p className="text-base font-medium text-foreground border-s-2 border-amber-500/30 ps-4 py-2 bg-amber-500/[0.03] rounded-r-lg">
              {t("privacy.s11Action")}
            </p>
          </div>
        </section>

        <section className="glass rounded-3xl border border-border/50 p-8">
          <div className="flex items-center gap-3 mb-4">
            <Scale className="h-5 w-5 text-violet-600 dark:text-violet-400" />
            <h2 className="text-2xl font-bold text-foreground tracking-tight">{t("privacy.s12Title")}</h2>
          </div>
          <p className="leading-relaxed text-lg">{t("privacy.s12Body")}</p>
        </section>

        <section className="glass rounded-3xl border border-border/50 p-8">
          <div className="flex items-center gap-3 mb-4">
            <Scale className="h-5 w-5 text-violet-600 dark:text-violet-400" />
            <h2 className="text-2xl font-bold text-foreground tracking-tight">{t("privacy.s13Title")}</h2>
          </div>
          <p className="leading-relaxed text-lg">{t("privacy.s13Body")}</p>
        </section>

        <section className="rounded-3xl border border-violet-500/20 bg-violet-500/[0.02] p-8 md:p-10">
          <div className="flex items-center gap-3 mb-5">
            <FileText className="h-5 w-5 text-violet-600 dark:text-violet-400" />
            <h2 className="text-2xl font-black text-foreground tracking-tight">{t("privacy.s14Title")}</h2>
          </div>
          <p className="leading-relaxed text-lg flex items-center gap-2 flex-wrap">
            <span>{t("privacy.s14Intro")}</span>
            <Link
              to="/refund-policy"
              className="text-violet-600 dark:text-violet-400 hover:underline font-medium inline-flex items-center gap-1"
            >
              {t("privacy.s14RefundLink")} <ArrowRight className="h-3.5 w-3.5" />
            </Link>
            <span>{t("privacy.s14Suffix")}</span>
          </p>
        </section>
      </div>
    </PublicPageLayout>
  );
}
