import { Link, Navigate, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { ArrowLeft, ArrowRight } from "lucide-react";
import PublicPageLayout from "@/components/PublicPageLayout";
import { Ad } from "@/components/Ads";
import { Button } from "@/components/ui/button";
import BlogArticleContent from "@/components/blog/BlogArticleContent";
import BlogPostSeo from "@/components/blog/BlogPostSeo";
import {
  getBlogPostBySlug,
  getSortedBlogPosts,
  type BlogPostId,
} from "@/lib/blogPosts";
import { getBlogPostPath } from "@/lib/blogPosts";

export default function BlogPostPage() {
  const { slug } = useParams<{ slug: string }>();
  const { t } = useTranslation(["marketing", "common"]);
  const post = slug ? getBlogPostBySlug(slug) : undefined;

  if (!post) {
    return <Navigate to="/blogs" replace />;
  }

  const sorted = getSortedBlogPosts();
  const currentIndex = sorted.findIndex((p) => p.id === post.id);
  const prevPost = currentIndex > 0 ? sorted[currentIndex - 1] : undefined;
  const nextPost = currentIndex < sorted.length - 1 ? sorted[currentIndex + 1] : undefined;

  return (
    <>
      <BlogPostSeo post={post} />
      <PublicPageLayout title="" subtitle="" showPageHeader={false}>
        <div className="max-w-5xl mx-auto w-full space-y-10 md:space-y-12">
          <nav aria-label="Breadcrumb">
            <Link
              to="/blogs"
              className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              {t("marketing:blogs.backToIndex")}
            </Link>
          </nav>

          <article itemScope itemType="https://schema.org/BlogPosting" className="glass rounded-3xl border border-border/50 p-6 md:p-10 lg:p-12">
            <BlogArticleContent id={post.id as BlogPostId} headingLevel="h1" />
          </article>

          <div className="py-2">
            <Ad />
          </div>

          <nav
            aria-label={t("marketing:blogs.adjacentPosts")}
            className="grid sm:grid-cols-2 gap-4"
          >
            {prevPost ? (
              <Link
                to={getBlogPostPath(prevPost.slug)}
                className="group glass rounded-2xl border border-border/50 p-5 hover:border-primary/30 transition-colors"
              >
                <span className="text-xs uppercase tracking-wider text-muted-foreground">
                  {t("marketing:blogs.previousPost")}
                </span>
                <p className="mt-2 font-semibold text-foreground group-hover:text-primary line-clamp-2">
                  {t(`marketing:blogs.posts.${prevPost.id}.title`)}
                </p>
              </Link>
            ) : (
              <div />
            )}
            {nextPost ? (
              <Link
                to={getBlogPostPath(nextPost.slug)}
                className="group glass rounded-2xl border border-border/50 p-5 hover:border-primary/30 transition-colors sm:text-end"
              >
                <span className="text-xs uppercase tracking-wider text-muted-foreground">
                  {t("marketing:blogs.nextPost")}
                </span>
                <p className="mt-2 font-semibold text-foreground group-hover:text-primary line-clamp-2">
                  {t(`marketing:blogs.posts.${nextPost.id}.title`)}
                </p>
              </Link>
            ) : null}
          </nav>

          <section className="glass rounded-3xl border border-primary/20 bg-gradient-to-br from-primary/10 via-transparent to-violet-500/10 p-8 md:p-10 text-center">
            <h2 className="text-2xl md:text-3xl font-bold tracking-tight">{t("marketing:blogs.ctaTitle")}</h2>
            <p className="mt-4 text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              {t("marketing:blogs.ctaBody")}
            </p>
            <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
              <Link to="/register">
                <Button className="gradient-primary rounded-full px-8 gap-2">
                  {t("marketing:blogs.ctaButton")}
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>
          </section>
        </div>
      </PublicPageLayout>
    </>
  );
}
