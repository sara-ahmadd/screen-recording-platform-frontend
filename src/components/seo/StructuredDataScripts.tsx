import { Helmet } from "react-helmet-async";
import { useTranslation } from "react-i18next";
import { BLOG_POST_IDS } from "@/lib/blogPosts";
import { ORGANIZATION, SITE_NAME, SITE_URL } from "@/lib/siteConfig";

type StructuredDataScriptsProps = {
  routeKey?: string;
  pathname: string;
};

export default function StructuredDataScripts({ routeKey, pathname }: StructuredDataScriptsProps) {
  const { t, i18n } = useTranslation(["seo", "marketing"]);
  const lang = i18n.language.startsWith("ar") ? "ar" : "en";

  const organization = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: ORGANIZATION.name,
    url: ORGANIZATION.url,
    logo: ORGANIZATION.logo,
    email: ORGANIZATION.email,
    address: {
      "@type": "PostalAddress",
      streetAddress: ORGANIZATION.address.streetAddress,
      addressLocality: ORGANIZATION.address.addressLocality,
      addressCountry: ORGANIZATION.address.addressCountry,
    },
  };

  const website = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: SITE_NAME,
    url: SITE_URL,
    inLanguage: ["en", "ar"],
    publisher: { "@type": "Organization", name: ORGANIZATION.name },
  };

  const scripts: Record<string, unknown>[] = [organization, website];

  if (routeKey === "home") {
    scripts.push({
      "@context": "https://schema.org",
      "@type": "SoftwareApplication",
      name: SITE_NAME,
      applicationCategory: "BusinessApplication",
      operatingSystem: "Web",
      offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
      description: t("seo:defaultDescription"),
      url: SITE_URL,
    });
  }

  if (routeKey === "blogs" || pathname === "/blogs") {
    const blogUrl = `${SITE_URL}/blogs`;
    scripts.push({
      "@context": "https://schema.org",
      "@type": "Blog",
      name: t("marketing:blogs.title"),
      description: t("marketing:blogs.subtitle"),
      url: blogUrl,
      inLanguage: lang,
      publisher: { "@type": "Organization", name: ORGANIZATION.name },
      blogPost: BLOG_POST_IDS.map((id) => ({
        "@type": "BlogPosting",
        headline: t(`marketing:blogs.posts.${id}.title`),
        description: t(`marketing:blogs.posts.${id}.excerpt`),
        url: `${blogUrl}#${id}`,
        inLanguage: lang,
        author: {
          "@type": "Organization",
          name: t("marketing:eeat.publisherName"),
        },
        publisher: { "@type": "Organization", name: ORGANIZATION.name },
        datePublished: t("marketing:eeat.contentFreshness"),
        dateModified: t("marketing:eeat.contentFreshness"),
      })),
    });
  }

  if (routeKey === "about") {
    scripts.push({
      "@context": "https://schema.org",
      "@type": "AboutPage",
      name: t("seo:routes.about.title"),
      description: t("seo:routes.about.description"),
      url: `${SITE_URL}/about`,
      mainEntity: { "@type": "Organization", name: ORGANIZATION.name },
    });
  }

  if (routeKey === "contact") {
    scripts.push({
      "@context": "https://schema.org",
      "@type": "ContactPage",
      name: t("seo:routes.contact.title"),
      url: `${SITE_URL}/contact`,
    });
  }

  return (
    <Helmet>
      {scripts.map((data, i) => (
        <script key={i} type="application/ld+json">
          {JSON.stringify(data)}
        </script>
      ))}
    </Helmet>
  );
}
