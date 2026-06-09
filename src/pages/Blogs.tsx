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
const TAKEAWAY_KEYS = ["t1", "t2", "t3", "t4", "t5", "t6"] as const;

type BlogSubsection = {
  title: string;
  paragraphs?: string[];
  bullets?: string[];
};

type BlogSection = {
  title: string;
  paragraphs?: string[];
  bullets?: string[];
  subsections?: BlogSubsection[];
};

function asStringArray(value: unknown): string[] {
  if (Array.isArray(value)) return value.filter((item): item is string => typeof item === "string");
  return [];
}

function asSections(value: unknown): BlogSection[] {
  if (!Array.isArray(value)) return [];
  return value.filter(
    (item): item is BlogSection =>
      typeof item === "object" && item !== null && typeof (item as BlogSection).title === "string",
  );
}

function scrollToHash(hash: string) {
  const id = hash.replace(/^#/, "");
  if (!id) return;
  const el = document.getElementById(id);
  if (el) {
    window.setTimeout(() => el.scrollIntoView({ behavior: "smooth", block: "start" }), 80);
  }
}

function RichText({ text }: { text: string }) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return (
    <>
      {parts.map((part, index) => {
        if (part.startsWith("**") && part.endsWith("**")) {
          return (
            <strong key={index} className="font-semibold text-foreground">
              {part.slice(2, -2)}
            </strong>
          );
        }
        return <span key={index}>{part}</span>;
      })}
    </>
  );
}

function slugifyHeading(text: string, index: number) {
  const slug = text
    .toLowerCase()
    .replace(/[^a-z0-9\u0600-\u06FF]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return slug || `section-${index}`;
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
  const sections = asSections(t(`${prefix}.sections`, { returnObjects: true }));
  const intro = asStringArray(t(`${prefix}.intro`, { returnObjects: true }));
  const perspectiveParagraphs = asStringArray(t(`${prefix}.perspectiveParagraphs`, { returnObjects: true }));
  const closingParagraphs = asStringArray(t(`${prefix}.closingParagraphs`, { returnObjects: true }));
  const isRichPost = sections.length > 0;
  const perspectiveTitle = t(`${prefix}.perspectiveTitle`, { defaultValue: "" });
  const metaDescription = t(`${prefix}.metaDescription`, { defaultValue: "" });
  const takeaways = TAKEAWAY_KEYS.map((key) => t(`${prefix}.${key}`, { defaultValue: "" })).filter(Boolean);

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
        {metaDescription ? (
          <p className="sr-only">{metaDescription}</p>
        ) : null}

        <div className="mt-8 space-y-5 text-base leading-relaxed text-muted-foreground">
          {isRichPost ? (
            <>
              {intro.map((paragraph) => (
                <p key={paragraph.slice(0, 48)}>
                  <RichText text={paragraph} />
                </p>
              ))}
              {sections.map((section, sectionIndex) => {
                const sectionId = `${id}-${slugifyHeading(section.title, sectionIndex)}`;
                return (
                  <section key={sectionId} id={sectionId} className="scroll-mt-28 pt-4">
                    <h3 className="text-xl md:text-2xl font-semibold text-foreground mb-4">{section.title}</h3>
                    {asStringArray(section.paragraphs).map((paragraph) => (
                      <p key={paragraph.slice(0, 48)} className="mb-4">
                        <RichText text={paragraph} />
                      </p>
                    ))}
                    {asStringArray(section.bullets).length > 0 ? (
                      <ul className="mb-4 list-disc ps-6 space-y-2">
                        {asStringArray(section.bullets).map((bullet) => (
                          <li key={bullet.slice(0, 48)}>
                            <RichText text={bullet} />
                          </li>
                        ))}
                      </ul>
                    ) : null}
                    {(section.subsections ?? []).length > 0
                      ? (section.subsections ?? []).map((subsection, subIndex) => (
                          <div key={`${sectionId}-sub-${subIndex}`} className="mt-6">
                            <h4 className="text-lg font-semibold text-foreground mb-3">{subsection.title}</h4>
                            {asStringArray(subsection.paragraphs).map((paragraph) => (
                              <p key={paragraph.slice(0, 48)} className="mb-4">
                                <RichText text={paragraph} />
                              </p>
                            ))}
                            {asStringArray(subsection.bullets).length > 0 ? (
                              <ul className="mb-4 list-disc ps-6 space-y-2">
                                {asStringArray(subsection.bullets).map((bullet) => (
                                  <li key={bullet.slice(0, 48)}>
                                    <RichText text={bullet} />
                                  </li>
                                ))}
                              </ul>
                            ) : null}
                          </div>
                        ))
                      : null}
                  </section>
                );
              })}
              {perspectiveTitle && perspectiveParagraphs.length > 0 ? (
                <section className="pt-6 border-t border-border/50">
                  <h3 className="text-xl md:text-2xl font-semibold text-foreground mb-4">{perspectiveTitle}</h3>
                  {perspectiveParagraphs.map((paragraph) => (
                    <p key={paragraph.slice(0, 48)} className="mb-4">
                      <RichText text={paragraph} />
                    </p>
                  ))}
                </section>
              ) : null}
              {closingParagraphs.map((paragraph) => (
                <p key={paragraph.slice(0, 48)} className="mb-4">
                  <RichText text={paragraph} />
                </p>
              ))}
            </>
          ) : (
            PARAGRAPH_KEYS.map((key) => {
              const value = t(`${prefix}.${key}`, { defaultValue: "" });
              return value ? <p key={key}>{value}</p> : null;
            })
          )}
        </div>

        {takeaways.length > 0 ? (
          <div className="mt-10 rounded-2xl border border-border/60 bg-muted/30 p-5 md:p-6">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-foreground mb-4">
              {t("marketing:blogs.takeawaysTitle")}
            </h3>
            <ul className="space-y-3">
              {takeaways.map((takeaway) => (
                <li key={takeaway} className="flex gap-3 text-sm text-muted-foreground">
                  <CheckCircle2 className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                  <span>{takeaway}</span>
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </article>
      {showAdAfter && (
        <div className="py-2">
          <Ad />
        </div>
      )}
    </>
  );
}
