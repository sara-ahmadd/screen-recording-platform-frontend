import { useEffect } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { BookOpen, CheckCircle2, Clock } from "lucide-react";
import PublicPageLayout from "@/components/PublicPageLayout";
import { Ad } from "@/components/Ads";
import { Button } from "@/components/ui/button";
import { BLOG_POST_IDS, type BlogPostId } from "@/lib/blogPosts";
import EditorialByline from "@/components/EditorialByline";

const PARAGRAPH_KEYS = ["p1", "p2", "p3", "p4"] as const;
const TAKEAWAY_KEYS = ["t1", "t2", "t3", "t4"] as const;

function scrollToHash(hash: string) {
  const id = hash.replace(/^#/, "");
  if (!id) return;
  const el = document.getElementById(id);
  if (el) {
    window.setTimeout(() => el.scrollIntoView({ behavior: "smooth", block: "start" }), 80);
  }
}

export default function BlogsPage() {
  const { t } = useTranslation(["marketing", "common"]);

  useEffect(() => {
    scrollToHash(window.location.hash);
    const onHashChange = () => scrollToHash(window.location.hash);
    window.addEventListener("hashchange", onHashChange);
    return () => window.removeEventListener("hashchange", onHashChange);
  }, []);

  return (
    <PublicPageLayout title={t("marketing:blogs.title")} subtitle={t("marketing:blogs.subtitle")}>
      <div className="max-w-full mx-auto space-y-10 md:space-y-14">
        <header className="rounded-2xl border border-border/50 bg-gradient-to-br from-primary/5 via-transparent to-violet-500/5 p-6 md:p-8">
          <div className="inline-flex items-center gap-2 rounded-full border border-violet-500/20 bg-violet-500/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-violet-700 dark:text-violet-300 mb-4">
            <BookOpen className="h-3.5 w-3.5" />
            {t("marketing:blogs.editorial")}
          </div>
          <p className="text-base md:text-lg leading-relaxed text-muted-foreground">{t("marketing:blogs.intro")}</p>
          <EditorialByline variant="compact" className="mt-6" />
        </header>

        <div className="lg:grid lg:grid-cols-[minmax(0,240px)_1fr] lg:gap-10 xl:gap-14">
          <aside className="lg:sticky lg:top-24 lg:self-start mb-8 lg:mb-0">
            <nav
              aria-label={t("marketing:blogs.tocTitle")}
              className="glass rounded-2xl border border-border/50 p-5 md:p-6"
            >
              <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-4">
                {t("marketing:blogs.tocTitle")}
              </h2>
              <ul className="space-y-2 text-sm">
                {BLOG_POST_IDS.map((id) => (
                  <li key={id}>
                    <a
                      href={`#${id}`}
                      className="block rounded-lg px-3 py-2 text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors line-clamp-2"
                    >
                      {t(`marketing:blogs.posts.${id}.title`)}
                    </a>
                  </li>
                ))}
              </ul>
            </nav>
          </aside>

          <div className="space-y-12 md:space-y-16 min-w-0">
            {BLOG_POST_IDS.map((id, index) => (
              <BlogArticle key={id} id={id} showAdAfter={index === 3} t={t} />
            ))}

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
        </div>
      </div>
    </PublicPageLayout>
  );
}

type BlogArticleProps = {
  id: BlogPostId;
  showAdAfter: boolean;
  t: ReturnType<typeof useTranslation>["t"];
};

function BlogArticle({ id, showAdAfter, t }: BlogArticleProps) {
  const prefix = `marketing:blogs.posts.${id}`;

  return (
    <>
      <article
        id={id}
        className="scroll-mt-28 glass rounded-3xl border border-border/50 p-6 md:p-9"
      >
        <div className="flex flex-wrap items-center gap-3 mb-4">
          <span className="text-xs font-semibold uppercase tracking-wider text-violet-600 dark:text-violet-400">
            {t(`${prefix}.category`)}
          </span>
          <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
            <Clock className="h-3.5 w-3.5" />
            {t(`${prefix}.readTime`)}
          </span>
        </div>

        <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground">{t(`${prefix}.title`)}</h2>
        <EditorialByline variant="compact" className="mt-3" />
        <p className="mt-3 text-muted-foreground leading-relaxed">{t(`${prefix}.excerpt`)}</p>

        <div className="mt-8 space-y-5 text-base leading-relaxed text-muted-foreground">
          {PARAGRAPH_KEYS.map((key) => (
            <p key={key}>{t(`${prefix}.${key}`)}</p>
          ))}
        </div>

        <div className="mt-10 rounded-2xl border border-border/60 bg-muted/30 p-5 md:p-6">
          <h3 className="text-sm font-semibold uppercase tracking-wider text-foreground mb-4">
            {t("marketing:blogs.takeawaysTitle")}
          </h3>
          <ul className="space-y-3">
            {TAKEAWAY_KEYS.map((key) => (
              <li key={key} className="flex gap-3 text-sm text-muted-foreground">
                <CheckCircle2 className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                <span>{t(`${prefix}.${key}`)}</span>
              </li>
            ))}
          </ul>
        </div>
      </article>
      {showAdAfter && (
        <div className="py-2">
          <Ad />
        </div>
      )}
    </>
  );
}
