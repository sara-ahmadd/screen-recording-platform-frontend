import { useTranslation } from "react-i18next";
import { DollarSign } from "lucide-react";
import PublicPageLayout from "@/components/PublicPageLayout";
import LegalSectionList, { type LegalSection } from "@/components/legal/LegalSectionList";

export default function RefundPolicyPage() {
  const { t } = useTranslation("legal");

  const allowanceItems = [
    t("refund.s3Allowance1"),
    t("refund.s3Allowance2"),
    t("refund.s3Allowance3"),
    t("refund.s3Allowance4"),
    t("refund.s3Allowance5"),
  ];

  const sections: LegalSection[] = [
    {
      icon: DollarSign,
      title: t("refund.s1Title"),
      paragraphs: [t("refund.s1Body")],
    },
    {
      icon: DollarSign,
      title: t("refund.s2Title"),
      paragraphs: [t("refund.s2Body")],
    },
    {
      icon: DollarSign,
      title: t("refund.s4Title"),
      paragraphs: [t("refund.s4Body")],
    },
  ];

  return (
    <PublicPageLayout title={t("refund.title")} subtitle={t("refund.subtitle")}>
      <div className="max-w-full mx-auto space-y-10 text-muted-foreground">
        <LegalSectionList sections={sections.slice(0, 2)} />

        <section className="rounded-3xl border border-violet-500/20 bg-violet-500/[0.02] p-8 md:p-10">
          <div className="flex items-center gap-3 mb-4">
            <DollarSign className="h-5 w-5 text-violet-600 dark:text-violet-400" />
            <h2 className="text-2xl font-bold text-foreground tracking-tight">{t("refund.s3Title")}</h2>
          </div>
          <div className="space-y-4 text-lg leading-relaxed">
            <p>{t("refund.s3P1")}</p>
            <p>{t("refund.s3P2")}</p>
            <p>{t("refund.s3ThresholdLead")}</p>
            <ul className="space-y-2.5 ps-2 text-base">
              {allowanceItems.map((item) => (
                <li key={item} className="flex items-start gap-3">
                  <span className="h-1.5 w-1.5 rounded-full bg-violet-500 shrink-0 mt-2" />
                  {item}
                </li>
              ))}
            </ul>
            <p>{t("refund.s3Ineligible")}</p>
            <div className="rounded-2xl border border-border/40 bg-background/60 p-5 space-y-2">
              <h3 className="text-base font-bold text-foreground">{t("refund.s3ExampleTitle")}</h3>
              <p className="text-base text-muted-foreground">{t("refund.s3ExampleBody")}</p>
            </div>
            <p>{t("refund.s3Review")}</p>
          </div>
        </section>

        <LegalSectionList sections={sections.slice(2)} />
      </div>
    </PublicPageLayout>
  );
}
