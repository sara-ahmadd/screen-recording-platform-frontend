import { Helmet } from "react-helmet-async";
import { useTranslation } from "react-i18next";
import { ORGANIZATION, SITE_NAME, SITE_URL } from "@/lib/siteConfig";
import type { BlogPostDefinition } from "@/lib/blogPosts";
import { getBlogPostPath } from "@/lib/blogPosts";

type BlogPostSeoProps = {
  post: BlogPostDefinition;
};

export default function BlogPostSeo({ post }: BlogPostSeoProps) {
  const { t, i18n } = useTranslation(["marketing", "seo"]);
  const lang = i18n.language.startsWith("ar") ? "ar" : "en";
  const prefix = `marketing:blogs.posts.${post.id}`;
  const title = t(`${prefix}.title`);
  const metaTitle = i18n.exists(`${prefix}.metaTitle`) ? t(`${prefix}.metaTitle`) : title;
  const description = i18n.exists(`${prefix}.metaDescription`)
    ? t(`${prefix}.metaDescription`)
    : t(`${prefix}.excerpt`);
  const fullTitle = `${metaTitle} | ${SITE_NAME}`;
  const canonical = `${SITE_URL}${getBlogPostPath(post.slug)}`;
  const keywords = `${post.primaryKeyword}, remote work, async communication, distributed teams, ${SITE_NAME}`;

  const articleSchema = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: title,
    description,
    url: canonical,
    inLanguage: lang,
    mainEntityOfPage: { "@type": "WebPage", "@id": canonical },
    author: {
      "@type": "Organization",
      name: t("marketing:eeat.publisherName"),
    },
    publisher: {
      "@type": "Organization",
      name: ORGANIZATION.name,
      logo: { "@type": "ImageObject", url: ORGANIZATION.logo },
    },
    datePublished: t("marketing:eeat.contentFreshness"),
    dateModified: t("marketing:eeat.contentFreshness"),
    keywords: post.primaryKeyword,
  };

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: SITE_NAME, item: SITE_URL },
      { "@type": "ListItem", position: 2, name: t("marketing:blogs.title"), item: `${SITE_URL}/blogs` },
      { "@type": "ListItem", position: 3, name: title, item: canonical },
    ],
  };

  return (
    <Helmet htmlAttributes={{ lang }}>
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      <meta name="keywords" content={keywords} />
      <meta name="robots" content={t("seo:robotsIndex")} />
      <meta name="author" content={t("marketing:eeat.publisherName")} />
      <link rel="canonical" href={canonical} />
      <meta property="og:type" content="article" />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:url" content={canonical} />
      <meta property="og:site_name" content={SITE_NAME} />
      <meta property="og:image" content={`${SITE_URL}/og-image.svg`} />
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={`${SITE_URL}/og-image.svg`} />
      <script type="application/ld+json">{JSON.stringify(articleSchema)}</script>
      <script type="application/ld+json">{JSON.stringify(breadcrumbSchema)}</script>
    </Helmet>
  );
}
