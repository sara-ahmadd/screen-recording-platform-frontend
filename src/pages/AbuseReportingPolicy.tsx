import { useTranslation } from "react-i18next";
import { ShieldAlert } from "lucide-react";
import PublicPageLayout from "@/components/PublicPageLayout";
import LegalSectionList, { type LegalSection } from "@/components/legal/LegalSectionList";

export default function AbuseReportingPolicyPage() {
  const { t } = useTranslation("legal");

  const reportItems = [
    t("abuse.s1Item1"),
    t("abuse.s1Item2"),
    t("abuse.s1Item3"),
    t("abuse.s1Item4"),
    t("abuse.s1Item5"),
    t("abuse.s1Item6"),
    t("abuse.s1Item7"),
  ];

  const enforcementItems = [
    t("abuse.s2Item1"),
    t("abuse.s2Item2"),
    t("abuse.s2Item3"),
    t("abuse.s2Item4"),
  ];

  const sections: LegalSection[] = [
    {
      icon: ShieldAlert,
      title: t("abuse.s1Title"),
      paragraphs: [t("abuse.s1Intro")],
      list: reportItems,
    },
    {
      icon: ShieldAlert,
      title: t("abuse.s2Title"),
      paragraphs: [t("abuse.s2Intro")],
      list: enforcementItems,
      footnote: t("abuse.s2Footnote"),
    },
    {
      icon: ShieldAlert,
      title: t("abuse.s3Title"),
      paragraphs: [t("abuse.s3Body")],
    },
    {
      icon: ShieldAlert,
      title: t("abuse.s4Title"),
      paragraphs: [t("abuse.s4Body")],
    },
  ];

  return (
    <PublicPageLayout title={t("abuse.title")} subtitle={t("abuse.subtitle")}>
      <LegalSectionList sections={sections} />
    </PublicPageLayout>
  );
}
