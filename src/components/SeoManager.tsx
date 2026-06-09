import { useMemo } from "react";
import { Helmet } from "react-helmet-async";
import { useTranslation } from "react-i18next";
import { useLocation } from "react-router-dom";
import StructuredDataScripts from "@/components/seo/StructuredDataScripts";
import { SITE_NAME, SITE_URL } from "@/lib/siteConfig";

const DEFAULT_OG_IMAGE = "/og-image.svg";

type RouteSeoKey =
  | "home"
  | "login"
  | "register"
  | "verify"
  | "forgotPassword"
  | "preview"
  | "share"
  | "about"
  | "blogs"
  | "privacyPolicy"
  | "terms"
  | "copyrightPolicy"
  | "abusePolicy"
  | "refundPolicy"
  | "contact"
  | "dashboard"
  | "howItWorks"
  | "demo"
  | "plans"
  | "paymentSuccess"
  | "paymentFailed"
  | "notFound";

const PATH_TO_ROUTE: Record<string, RouteSeoKey> = {
  "/": "home",
  "/login": "login",
  "/register": "register",
  "/verify": "verify",
  "/forgot-password": "forgotPassword",
  "/about": "about",
  "/blogs": "blogs",
  "/privacy-policy": "privacyPolicy",
  "/terms-and-conditions": "terms",
  "/copyright-policy": "copyrightPolicy",
  "/abuse-reporting-policy": "abusePolicy",
  "/refund-policy": "refundPolicy",
  "/contact": "contact",
  "/dashboard": "dashboard",
  "/how-it-works": "howItWorks",
  "/demo": "demo",
  "/plans": "plans",
  "/payment/success": "paymentSuccess",
  "/payment/failed": "paymentFailed",
};

const PRIVATE_PATH_PREFIXES = [
  "/dashboard",
  "/record",
  "/upload",
  "/recording",
  "/workspaces",
  "/billing",
  "/subscription",
  "/checkout",
  "/notifications",
  "/profile",
  "/select-workspace",
  "/accept-invite",
  "/workspace/accept-invite",
  "/feedback",
  "/super-admin",
  "/payment/success",
  "/payment/failed",
];

const NOINDEX_ROUTES = new Set<RouteSeoKey>([
  "login",
  "register",
  "verify",
  "forgotPassword",
  "dashboard",
  "plans",
  "preview",
  "share",
  "paymentSuccess",
  "paymentFailed",
  "notFound",
]);

function resolveRouteKey(pathname: string): RouteSeoKey | undefined {
  if (PATH_TO_ROUTE[pathname]) return PATH_TO_ROUTE[pathname];
  if (pathname.startsWith("/preview/")) return "preview";
  if (pathname.startsWith("/share/")) return "share";
  if (/^\/blogs\/[^/]+$/.test(pathname)) return "blogs";
  return undefined;
}

function isIndividualBlogPost(pathname: string): boolean {
  return /^\/blogs\/[^/]+$/.test(pathname);
}

export default function SeoManager() {
  const { t, i18n } = useTranslation("seo");
  const location = useLocation();
  const lang = i18n.language.startsWith("ar") ? "ar" : "en";

  const meta = useMemo(() => {
    const routeKey = resolveRouteKey(location.pathname);
    const isPrivate = PRIVATE_PATH_PREFIXES.some((p) => location.pathname.startsWith(p));
    const isBlogPost = isIndividualBlogPost(location.pathname);
    const is404 =
      !routeKey &&
      !isBlogPost &&
      !location.pathname.startsWith("/preview/") &&
      !location.pathname.startsWith("/share/");

    let pageTitle = t("defaultTitle");
    let description = t("defaultDescription");
    let keywords = t("defaultKeywords");

    const effectiveKey: RouteSeoKey | undefined = is404 ? "notFound" : routeKey;

    if (effectiveKey) {
      pageTitle = t(`routes.${effectiveKey}.title`);
      description = t(`routes.${effectiveKey}.description`);
      const kw = t(`routes.${effectiveKey}.keywords`, { defaultValue: "" });
      if (kw) keywords = kw;
    }

    const fullTitle =
      effectiveKey === "home"
        ? `${SITE_NAME} — ${pageTitle}`
        : pageTitle
          ? `${pageTitle} | ${SITE_NAME}`
          : `${SITE_NAME} — ${t("defaultTitle")}`;

    const robots =
      isPrivate || (effectiveKey && NOINDEX_ROUTES.has(effectiveKey)) ? t("robotsNoIndex") : t("robotsIndex");

    return { fullTitle, description, keywords, robots, routeKey: effectiveKey };
  }, [location.pathname, t, i18n.language]);

  const canonical = `${SITE_URL}${location.pathname === "/" ? "" : location.pathname}`;
  const ogLocale = lang === "ar" ? "ar_EG" : "en_US";
  const ogLocaleAlt = lang === "ar" ? "en_US" : "ar_EG";

  const isBlogPost = isIndividualBlogPost(location.pathname);

  if (isBlogPost) {
    return <StructuredDataScripts routeKey="blogs" pathname={location.pathname} />;
  }

  return (
    <>
      <Helmet htmlAttributes={{ lang }}>
        <title>{meta.fullTitle}</title>
        <meta name="description" content={meta.description} />
        <meta name="keywords" content={meta.keywords} />
        <meta name="robots" content={meta.robots} />
        <meta name="author" content={SITE_NAME} />
        <link rel="canonical" href={canonical} />
        <link rel="alternate" hrefLang="en" href={`${SITE_URL}${location.pathname}`} />
        <link rel="alternate" hrefLang="ar" href={`${SITE_URL}${location.pathname}`} />
        <link rel="alternate" hrefLang="x-default" href={`${SITE_URL}${location.pathname}`} />
        <meta property="og:locale" content={ogLocale} />
        <meta property="og:locale:alternate" content={ogLocaleAlt} />
        <meta property="og:title" content={meta.fullTitle} />
        <meta property="og:description" content={meta.description} />
        <meta property="og:url" content={canonical} />
        <meta property="og:type" content="website" />
        <meta property="og:site_name" content={SITE_NAME} />
        <meta property="og:image" content={`${SITE_URL}${DEFAULT_OG_IMAGE}`} />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={meta.fullTitle} />
        <meta name="twitter:description" content={meta.description} />
        <meta name="twitter:image" content={`${SITE_URL}${DEFAULT_OG_IMAGE}`} />
      </Helmet>
      <StructuredDataScripts routeKey={meta.routeKey} pathname={location.pathname} />
    </>
  );
}
