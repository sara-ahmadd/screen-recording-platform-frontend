import { useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { ArrowRight, BookOpen, Clock } from "lucide-react";
import PublicPageLayout from "@/components/PublicPageLayout";
import { Button } from "@/components/ui/button";
import EditorialByline from "@/components/EditorialByline";
import {
  getBlogPostById,
  getBlogPostPath,
  getSortedBlogPosts,
} from "@/lib/blogPosts";

export default function BlogsPage() {
  const { t } = useTranslation(["marketing", "common"]);
  const navigate = useNavigate();
  const featuredPosts = getSortedBlogPosts().filter((p) => p.calendarFeatured);
  const platformPosts = getSortedBlogPosts().filter((p) => !p.calendarFeatured);

  useEffect(() => {
    const hash = window.location.hash.replace(/^#/, "");
    if (!hash) return;
    const legacyPost = getBlogPostById(hash);
    if (legacyPost) {
      navigate(getBlogPostPath(legacyPost.slug), { replace: true });
    }
  }, [navigate]);

  return (
    <PublicPageLayout title={t("marketing:blogs.title")} subtitle={t("marketing:blogs.subtitle")}>
      <div className="max-w-7xl mx-auto w-full space-y-12 md:space-y-16">
        <header className="rounded-2xl border border-border/50 bg-gradient-to-br from-primary/5 via-transparent to-violet-500/5 p-6 md:p-8">
          <div className="inline-flex items-center gap-2 rounded-full border border-violet-500/20 bg-violet-500/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-violet-700 dark:text-violet-300 mb-4">
            <BookOpen className="h-3.5 w-3.5" />
            {t("marketing:blogs.editorial")}
          </div>
          <p className="text-base md:text-lg leading-relaxed text-muted-foreground">{t("marketing:blogs.intro")}</p>
          <EditorialByline variant="compact" className="mt-6" />
        </header>

        <section aria-labelledby="featured-guides-heading">
          <h2 id="featured-guides-heading" className="text-2xl md:text-3xl font-bold tracking-tight mb-2">
            {t("marketing:blogs.featuredTitle")}
          </h2>
          <p className="text-muted-foreground mb-8 max-w-2xl">{t("marketing:blogs.featuredSubtitle")}</p>
          <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-6 lg:gap-8">
            {featuredPosts.map((post) => (
              <BlogCard key={post.id} postId={post.id} slug={post.slug} t={t} />
            ))}
          </div>
        </section>

        {platformPosts.length > 0 ? (
          <section aria-labelledby="platform-guides-heading">
            <h2 id="platform-guides-heading" className="text-xl md:text-2xl font-bold tracking-tight mb-2">
              {t("marketing:blogs.platformTitle")}
            </h2>
            <p className="text-muted-foreground mb-6 max-w-2xl">{t("marketing:blogs.platformSubtitle")}</p>
            <div className="grid md:grid-cols-2 gap-4 lg:gap-6">
              {platformPosts.map((post) => (
                <BlogCard key={post.id} postId={post.id} slug={post.slug} t={t} compact />
              ))}
            </div>
          </section>
        ) : null}

        <section className="glass rounded-3xl border border-primary/20 bg-gradient-to-br from-primary/10 via-transparent to-violet-500/10 p-8 md:p-10 text-center">
          <h2 className="text-2xl md:text-3xl font-bold tracking-tight">{t("marketing:blogs.ctaTitle")}</h2>
          <p className="mt-4 text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            {t("marketing:blogs.ctaBody")}
          </p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <Link to="/register">
              <Button className="gradient-primary rounded-full px-8">{t("marketing:blogs.ctaButton")}</Button>
            </Link>
            <Link
              to="/privacy-policy"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              {t("common:nav.privacyPolicy")}
            </Link>
          </div>
        </section>
      </div>
    </PublicPageLayout>
  );
}

type BlogCardProps = {
  postId: string;
  slug: string;
  t: ReturnType<typeof useTranslation>["t"];
  compact?: boolean;
};

function BlogCard({ postId, slug, t, compact }: BlogCardProps) {
  const prefix = `marketing:blogs.posts.${postId}`;

  return (
    <Link
      to={getBlogPostPath(slug)}
      className={`group glass rounded-3xl border border-border/60 transition-all duration-300 hover:-translate-y-1 hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5 ${
        compact ? "p-5" : "p-6 md:p-7"
      }`}
    >
      <div className="flex items-center justify-between gap-2 mb-4">
        <span className="text-xs font-semibold uppercase tracking-wider text-violet-600 dark:text-violet-400">
          {t(`${prefix}.category`)}
        </span>
        <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
          <Clock className="h-3 w-3" />
          {t(`${prefix}.readTime`)}
        </span>
      </div>
      <h3
        className={`font-semibold text-foreground group-hover:text-primary transition-colors line-clamp-2 ${
          compact ? "text-base" : "text-lg"
        }`}
      >
        {t(`${prefix}.title`)}
      </h3>
      <p className={`mt-3 text-muted-foreground leading-relaxed line-clamp-3 ${compact ? "text-sm" : "text-sm"}`}>
        {t(`${prefix}.excerpt`)}
      </p>
      <span className="mt-5 inline-flex items-center gap-1.5 text-sm font-medium text-primary">
        {t("marketing:blogs.readArticle")}
        <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
      </span>
    </Link>
  );
}
