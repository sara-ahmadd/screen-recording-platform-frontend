import { useTranslation } from "react-i18next";
import { Copyright } from "lucide-react";
import PublicPageLayout from "@/components/PublicPageLayout";
import LegalSectionList, { type LegalSection } from "@/components/legal/LegalSectionList";

export default function CopyrightPolicyPage() {
  const { t } = useTranslation("legal");

  const sections: LegalSection[] = [
    {
      icon: Copyright,
      title: t("copyright.s1Title"),
      paragraphs: [t("copyright.s1P1"), t("copyright.s1P2")],
    },
    {
      icon: Copyright,
      title: t("copyright.s2Title"),
      paragraphs: [t("copyright.s2Body")],
    },
    {
      icon: Copyright,
      title: t("copyright.s3Title"),
      paragraphs: [t("copyright.s3P1"), t("copyright.s3P2")],
    },
    {
      icon: Copyright,
      title: t("copyright.s4Title"),
      paragraphs: [t("copyright.s4Body")],
    },
    {
      icon: Copyright,
      title: t("copyright.s5Title"),
      paragraphs: [t("copyright.s5Body")],
    },
  ];

  return (
    <PublicPageLayout title={t("copyright.title")} subtitle={t("copyright.subtitle")}>
      <LegalSectionList sections={sections} />
    </PublicPageLayout>
  );
}
