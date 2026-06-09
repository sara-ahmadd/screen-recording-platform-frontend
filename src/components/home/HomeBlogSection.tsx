import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { ArrowRight, BookOpen, Clock } from "lucide-react";
import { Badge } from "@/components/Badge";
import { Button } from "@/components/ui/button";
import { Reveal } from "@/components/Reveal";
import { BLOG_POST_IDS, getBlogPostPathById } from "@/lib/blogPosts";

export default function HomeBlogSection() {
  const { t } = useTranslation(["home", "marketing"]);

  const featuredIds = BLOG_POST_IDS.slice(0, 3);

  return (
    <Reveal from="right">
      <section className="max-w-6xl mx-auto px-6 py-16" id="resources">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-10">
          <div className="max-w-2xl">
            <Badge className="gradient-primary border-0 mb-4 text-primary-foreground px-4 py-1.5">
              <BookOpen className="h-3.5 w-3.5 me-1.5 inline" />
              {t("home:blogs.badge")}
            </Badge>
            <h2 className="text-3xl md:text-5xl font-bold tracking-tight">
              {t("home:blogs.title")}
              <span className="gradient-text block mt-2">{t("home:blogs.titleHighlight")}</span>
            </h2>
            <p className="text-muted-foreground mt-4 text-lg leading-relaxed">{t("home:blogs.subtitle")}</p>
          </div>
          <Link to="/blogs" className="shrink-0">
            <Button variant="outline" className="gap-2 rounded-full px-6">
              {t("home:blogs.viewAll")}
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {featuredIds.map((id, index) => (
            <Link
              key={id}
              to={getBlogPostPathById(id) ?? "/blogs"}
              className={`group glass rounded-3xl border border-border/60 p-6 md:p-7 transition-all duration-300 hover:-translate-y-1 hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5 ${
                index === 0 ? "md:row-span-1 bg-gradient-to-br from-primary/5 via-transparent to-transparent" : ""
              }`}
            >
              <div className="flex items-center justify-between gap-2 mb-4">
                <span className="text-xs font-semibold uppercase tracking-wider text-violet-600 dark:text-violet-400">
                  {t(`marketing:blogs.posts.${id}.category`)}
                </span>
                <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                  <Clock className="h-3 w-3" />
                  {t(`marketing:blogs.posts.${id}.readTime`)}
                </span>
              </div>
              <h3 className="text-lg font-semibold text-foreground group-hover:text-primary transition-colors line-clamp-2">
                {t(`marketing:blogs.posts.${id}.title`)}
              </h3>
              <p className="mt-3 text-sm text-muted-foreground leading-relaxed line-clamp-4">
                {t(`marketing:blogs.posts.${id}.excerpt`)}
              </p>
              <span className="mt-5 inline-flex items-center gap-1.5 text-sm font-medium text-primary">
                {t("home:blogs.readMore")}
                <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
              </span>
            </Link>
          ))}
        </div>
      </section>
    </Reveal>
  );
}
