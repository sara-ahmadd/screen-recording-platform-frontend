import { useTranslation } from "react-i18next";
import { Ad } from "@/components/Ads";
import PublicPageLayout from "@/components/PublicPageLayout";

export default function BlogsPage() {
  const { t } = useTranslation("marketing");

  const articles = [
    {
      titleKey: "blogs.article1Title",
      bodyKey: "blogs.article1Body",
      points: ["blogs.article1p1", "blogs.article1p2", "blogs.article1p3", "blogs.article1p4"],
    },
    {
      titleKey: "blogs.article2Title",
      bodyKey: "blogs.article2Body",
      points: ["blogs.article2p1", "blogs.article2p2", "blogs.article2p3", "blogs.article2p4"],
    },
    {
      titleKey: "blogs.article3Title",
      bodyKey: "blogs.article3Body",
      points: ["blogs.article3p1", "blogs.article3p2", "blogs.article3p3", "blogs.article3p4"],
    },
    {
      titleKey: "blogs.article4Title",
      bodyKey: "blogs.article4Body",
      points: ["blogs.article4p1", "blogs.article4p2", "blogs.article4p3", "blogs.article4p4"],
    },
    {
      titleKey: "blogs.article5Title",
      bodyKey: "blogs.article5Body",
      points: ["blogs.article5p1", "blogs.article5p2", "blogs.article5p3", "blogs.article5p4"],
    },
    {
      titleKey: "blogs.article6Title",
      bodyKey: "blogs.article6Body",
      points: ["blogs.article6p1", "blogs.article6p2", "blogs.article6p3", "blogs.article6p4"],
    },
  ] as const;

  return (
    <PublicPageLayout title={t("blogs.title")} subtitle={t("blogs.subtitle")}>
      <div className="grid md:grid-cols-1 gap-4">
        {articles.map((article) => (
          <article key={article.titleKey} className="glass rounded-xl p-5 border border-border/50">
            <h2 className="text-lg font-semibold mb-2">{t(article.titleKey)}</h2>
            <p className="text-sm text-muted-foreground leading-6 mb-3">{t(article.bodyKey)}</p>
            <ul className="text-sm text-muted-foreground list-disc ps-5 space-y-1">
              {article.points.map((pointKey) => (
                <li key={pointKey}>{t(pointKey)}</li>
              ))}
            </ul>
          </article>
        ))}
        <Ad />
      </div>
    </PublicPageLayout>
  );
}
