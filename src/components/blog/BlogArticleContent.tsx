import { useTranslation, type i18n as I18nInstance } from "react-i18next";
import { CheckCircle2, Clock, ImageIcon } from "lucide-react";
import EditorialByline from "@/components/EditorialByline";
import type { BlogPostId } from "@/lib/blogPosts";

const PARAGRAPH_KEYS = ["p1", "p2", "p3", "p4"] as const;
const TAKEAWAY_KEYS = ["t1", "t2", "t3", "t4", "t5", "t6"] as const;

const IMAGE_FLAG_PATTERN = /^\[INSERT[^\]]+\]$/i;

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

function translateIfExists(i18n: I18nInstance, key: string): string {
  return i18n.exists(key) ? i18n.t(key) : "";
}

function slugifyHeading(text: string, index: number) {
  const slug = text
    .toLowerCase()
    .replace(/[^a-z0-9\u0600-\u06FF]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return slug || `section-${index}`;
}

export function RichText({ text }: { text: string }) {
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

function ImagePlaceholder({ caption }: { caption: string }) {
  return (
    <figure className="my-8 rounded-2xl border border-dashed border-violet-500/40 bg-gradient-to-br from-violet-500/5 to-primary/5 p-8 text-center not-prose">
      <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-violet-500/10">
        <ImageIcon className="h-6 w-6 text-violet-600 dark:text-violet-400" aria-hidden />
      </div>
      <p className="text-xs font-semibold uppercase tracking-wider text-violet-600 dark:text-violet-400 mb-2">
        Custom visual placeholder
      </p>
      <figcaption className="text-sm leading-relaxed text-muted-foreground max-w-lg mx-auto">{caption}</figcaption>
    </figure>
  );
}

function ContentBlock({ text }: { text: string }) {
  const trimmed = text.trim();
  if (IMAGE_FLAG_PATTERN.test(trimmed) || trimmed.startsWith("[INSERT")) {
    const caption = trimmed.replace(/^\[INSERT[^:]*:\s*/i, "").replace(/\]$/, "");
    return <ImagePlaceholder caption={caption} />;
  }
  return (
    <p className="mb-4">
      <RichText text={text} />
    </p>
  );
}

type BlogArticleContentProps = {
  id: BlogPostId;
  headingLevel?: "h1" | "h2";
  showHeader?: boolean;
};

export default function BlogArticleContent({ id, headingLevel = "h2", showHeader = true }: BlogArticleContentProps) {
  const { t, i18n } = useTranslation("marketing");
  const prefix = `marketing:blogs.posts.${id}`;
  const sections = i18n.exists(`${prefix}.sections`)
    ? asSections(t(`${prefix}.sections`, { returnObjects: true }))
    : [];
  const intro = i18n.exists(`${prefix}.intro`) ? asStringArray(t(`${prefix}.intro`, { returnObjects: true })) : [];
  const perspectiveParagraphs = i18n.exists(`${prefix}.perspectiveParagraphs`)
    ? asStringArray(t(`${prefix}.perspectiveParagraphs`, { returnObjects: true }))
    : [];
  const closingParagraphs = i18n.exists(`${prefix}.closingParagraphs`)
    ? asStringArray(t(`${prefix}.closingParagraphs`, { returnObjects: true }))
    : [];
  const isRichPost = sections.length > 0;
  const perspectiveTitle = translateIfExists(i18n, `${prefix}.perspectiveTitle`);
  const takeaways = TAKEAWAY_KEYS.filter((key) => i18n.exists(`${prefix}.${key}`)).map((key) =>
    t(`${prefix}.${key}`),
  );
  const TitleTag = headingLevel;

  return (
    <>
      {showHeader ? (
        <header className="mb-8">
          <div className="flex flex-wrap items-center gap-3 mb-4">
            <span className="text-xs font-semibold uppercase tracking-wider text-violet-600 dark:text-violet-400">
              {t(`${prefix}.category`)}
            </span>
            <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
              <Clock className="h-3.5 w-3.5" />
              {t(`${prefix}.readTime`)}
            </span>
          </div>
          <TitleTag className="text-2xl md:text-4xl font-bold tracking-tight text-foreground">
            {t(`${prefix}.title`)}
          </TitleTag>
          <EditorialByline variant="compact" className="mt-3" />
          <p className="mt-4 text-lg text-muted-foreground leading-relaxed">{t(`${prefix}.excerpt`)}</p>
        </header>
      ) : null}

      <div className="space-y-6 text-base md:text-lg leading-relaxed text-muted-foreground">
        {isRichPost ? (
          <>
            {intro.map((paragraph) => (
              <ContentBlock key={paragraph.slice(0, 48)} text={paragraph} />
            ))}
            {sections.map((section, sectionIndex) => {
              const sectionId = slugifyHeading(section.title, sectionIndex);
              return (
                <section key={sectionId} id={sectionId} className="scroll-mt-28 pt-4">
                  <h2 className="text-xl md:text-2xl font-semibold text-foreground mb-4">{section.title}</h2>
                  {asStringArray(section.paragraphs).map((paragraph) => (
                    <ContentBlock key={paragraph.slice(0, 48)} text={paragraph} />
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
                  {(section.subsections ?? []).map((subsection, subIndex) => (
                    <div key={`${sectionId}-sub-${subIndex}`} className="mt-6">
                      <h3 className="text-lg font-semibold text-foreground mb-3">{subsection.title}</h3>
                      {asStringArray(subsection.paragraphs).map((paragraph) => (
                        <ContentBlock key={paragraph.slice(0, 48)} text={paragraph} />
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
                  ))}
                </section>
              );
            })}
            {perspectiveTitle && perspectiveParagraphs.length > 0 ? (
              <section className="pt-6 border-t border-border/50">
                <h2 className="text-xl md:text-2xl font-semibold text-foreground mb-4">{perspectiveTitle}</h2>
                {perspectiveParagraphs.map((paragraph) => (
                  <ContentBlock key={paragraph.slice(0, 48)} text={paragraph} />
                ))}
              </section>
            ) : null}
            {closingParagraphs.map((paragraph) => (
              <ContentBlock key={paragraph.slice(0, 48)} text={paragraph} />
            ))}
          </>
        ) : (
          PARAGRAPH_KEYS.filter((key) => i18n.exists(`${prefix}.${key}`)).map((key) => (
            <p key={key}>{t(`${prefix}.${key}`)}</p>
          ))
        )}
      </div>

      {takeaways.length > 0 ? (
        <aside className="mt-10 rounded-2xl border border-border/60 bg-muted/30 p-5 md:p-6">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-foreground mb-4">
            {t("blogs.takeawaysTitle")}
          </h2>
          <ul className="space-y-3">
            {takeaways.map((takeaway) => (
              <li key={takeaway} className="flex gap-3 text-sm text-muted-foreground">
                <CheckCircle2 className="h-4 w-4 text-primary shrink-0 mt-0.5" aria-hidden />
                <span>{takeaway}</span>
              </li>
            ))}
          </ul>
        </aside>
      ) : null}
    </>
  );
}
