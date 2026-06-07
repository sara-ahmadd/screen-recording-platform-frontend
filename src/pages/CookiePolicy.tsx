import { useTranslation } from "react-i18next";
import { Cookie } from "lucide-react";
import PublicPageLayout from "@/components/PublicPageLayout";
import LegalSectionList, { type LegalSection } from "@/components/legal/LegalSectionList";

export default function CookiePolicyPage() {
  const { t } = useTranslation("legal");

  const sections: LegalSection[] = [
    {
      icon: Cookie,
      title: t("cookie.s1Title"),
      paragraphs: [t("cookie.s1Body")],
    },
    {
      icon: Cookie,
      title: t("cookie.s2Title"),
      list: [
        t("cookie.s2Item1"),
        t("cookie.s2Item2"),
        t("cookie.s2Item3"),
      ],
    },
    {
      icon: Cookie,
      title: t("cookie.s3Title"),
      list: [
        t("cookie.s3Item1"),
        t("cookie.s3Item2"),
      ],
    },
    {
      icon: Cookie,
      title: t("cookie.s4Title"),
      paragraphs: [t("cookie.s4Body")],
    },
  ];

  return (
    <PublicPageLayout title={t("cookie.title")} subtitle={t("cookie.subtitle")}>
      <LegalSectionList sections={sections} />
    </PublicPageLayout>
  );
}
