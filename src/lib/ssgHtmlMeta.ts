import enBlogPosts from "../i18n/locales/en/blogPosts.json";
import enLegal from "../i18n/locales/en/legal.json";
import enSeo from "../i18n/locales/en/seo.json";
import { getBlogPostBySlug, getBlogPostPath } from "./blogPosts";

const SITE_NAME = "theRec";
const SITE_URL = "https://therec.site";

type BlogPostContent = {
  title?: string;
  excerpt?: string;
  metaTitle?: string;
  metaDescription?: string;
};

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function replaceMeta(html: string, name: string, content: string): string {
  const escaped = escapeHtml(content);
  const pattern = new RegExp(`<meta\\s+name="${name}"\\s+content="[^"]*"\\s*/?>`, "i");
  if (pattern.test(html)) {
    return html.replace(pattern, `<meta name="${name}" content="${escaped}" />`);
  }
  return html.replace("</head>", `  <meta name="${name}" content="${escaped}" />\n</head>`);
}

function replacePropertyMeta(html: string, property: string, content: string): string {
  const escaped = escapeHtml(content);
  const pattern = new RegExp(`<meta\\s+property="${property}"\\s+content="[^"]*"\\s*/?>`, "i");
  if (pattern.test(html)) {
    return html.replace(pattern, `<meta property="${property}" content="${escaped}" />`);
  }
  return html.replace("</head>", `  <meta property="${property}" content="${escaped}" />\n</head>`);
}

function replaceTitle(html: string, title: string): string {
  const escaped = escapeHtml(title);
  return html.replace(/<title>[^<]*<\/title>/i, `<title>${escaped}</title>`);
}

function replaceCanonical(html: string, href: string): string {
  const escaped = escapeHtml(href);
  if (/<link\s+rel="canonical"/i.test(html)) {
    return html.replace(/<link\s+rel="canonical"\s+href="[^"]*"\s*\/?>/i, `<link rel="canonical" href="${escaped}" />`);
  }
  return html.replace("</head>", `  <link rel="canonical" href="${escaped}" />\n</head>`);
}

function getBlogPostContent(id: string): BlogPostContent | undefined {
  const posts = enBlogPosts.posts as Record<string, BlogPostContent>;
  return posts[id];
}

function applyPageMeta(
  html: string,
  {
    title,
    description,
    canonical,
    ogType = "website",
  }: {
    title: string;
    description: string;
    canonical: string;
    ogType?: string;
  },
): string {
  let next = html;
  next = replaceTitle(next, title);
  next = replaceMeta(next, "description", description);
  next = replaceCanonical(next, canonical);
  next = replacePropertyMeta(next, "og:title", title);
  next = replacePropertyMeta(next, "og:description", description);
  next = replacePropertyMeta(next, "og:url", canonical);
  next = replacePropertyMeta(next, "og:type", ogType);
  next = replacePropertyMeta(next, "twitter:title", title);
  next = replacePropertyMeta(next, "twitter:description", description);
  return next;
}

/** Inject route-specific SEO tags into pre-rendered HTML (runs at build time). */
export function transformPrerenderedHtml(route: string, html: string): string {
  const blogMatch = route.match(/^\/blogs\/([^/]+)$/);
  if (blogMatch) {
    const post = getBlogPostBySlug(blogMatch[1]);
    if (!post) return html;
    const content = getBlogPostContent(post.id);
    if (!content?.title) return html;

    const pageTitle = content.metaTitle ?? content.title;
    const description = content.metaDescription ?? content.excerpt ?? "";
    const fullTitle = `${pageTitle} | ${SITE_NAME}`;
    const canonical = `${SITE_URL}${getBlogPostPath(post.slug)}`;

    return applyPageMeta(html, {
      title: fullTitle,
      description,
      canonical,
      ogType: "article",
    });
  }

  if (route === "/blogs") {
    const title = `${enBlogPosts.title} | ${SITE_NAME}`;
    const description = enBlogPosts.subtitle;
    return applyPageMeta(html, {
      title,
      description,
      canonical: `${SITE_URL}/blogs`,
    });
  }

  if (route === "/cookie-policy") {
    const title = `${enLegal.cookie.title} | ${SITE_NAME}`;
    const description = enLegal.cookie.subtitle;
    return applyPageMeta(html, {
      title,
      description,
      canonical: `${SITE_URL}/cookie-policy`,
    });
  }

  const seoRoutes: Record<string, keyof typeof enSeo.routes> = {
    "/": "home",
    "/about": "about",
    "/contact": "contact",
    "/demo": "demo",
    "/how-it-works": "howItWorks",
    "/plans": "plans",
    "/privacy-policy": "privacyPolicy",
    "/terms-and-conditions": "terms",
    "/refund-policy": "refundPolicy",
    "/copyright-policy": "copyrightPolicy",
    "/abuse-reporting-policy": "abusePolicy",
  };

  const seoKey = seoRoutes[route];
  if (seoKey) {
    const seoRoute = enSeo.routes[seoKey];
    if (!seoRoute?.title) return html;
    const pageTitle = route === "/" ? `${SITE_NAME} — ${seoRoute.title}` : `${seoRoute.title} | ${SITE_NAME}`;
    return applyPageMeta(html, {
      title: pageTitle,
      description: seoRoute.description,
      canonical: route === "/" ? `${SITE_URL}/` : `${SITE_URL}${route}`,
    });
  }

  return html;
}
