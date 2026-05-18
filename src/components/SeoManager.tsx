import { useMemo } from "react";
import { Helmet } from "react-helmet-async";
import { useTranslation } from "react-i18next";
import { useLocation } from "react-router-dom";

const APP_NAME = "theRec";
const DEFAULT_OG_IMAGE = "/og-image.svg";
const SITE_URL = (import.meta.env.VITE_SITE_URL || "https://therec.site").replace(/\/$/, "");

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
  | "contact"
  | "dashboard"
  | "howItWorks"
  | "demo"
  | "plans";

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
  "/contact": "contact",
  "/dashboard": "dashboard",
  "/how-it-works": "howItWorks",
  "/demo": "demo",
  "/plans": "plans",
};

const PRIVATE_PATH_PREFIXES = [
  "/dashboard",
  "/record",
  "/upload",
  "/recording",
  "/workspaces",
  "/billing",
  "/plans",
  "/subscription",
  "/notifications",
  "/profile",
  "/select-workspace",
  "/accept-invite",
  "/workspace/accept-invite",
];

const NOINDEX_ROUTES = new Set<RouteSeoKey>([
  "login",
  "register",
  "verify",
  "forgotPassword",
  "dashboard",
]);

function resolveRouteKey(pathname: string): RouteSeoKey | undefined {
  if (PATH_TO_ROUTE[pathname]) return PATH_TO_ROUTE[pathname];
  if (pathname.startsWith("/preview/")) return "preview";
  if (pathname.startsWith("/share/")) return "share";
  return undefined;
}

export default function SeoManager() {
  const { t, i18n } = useTranslation("seo");
  const location = useLocation();

  const meta = useMemo(() => {
    const routeKey = resolveRouteKey(location.pathname);
    const isPrivate = PRIVATE_PATH_PREFIXES.some((p) => location.pathname.startsWith(p));

    let pageTitle = t("defaultTitle");
    let description = t("defaultDescription");
    let keywords = t("defaultKeywords");

    if (routeKey) {
      pageTitle = t(`routes.${routeKey}.title`);
      description = t(`routes.${routeKey}.description`);
      const kw = t(`routes.${routeKey}.keywords`, { defaultValue: "" });
      if (kw) keywords = kw;
    }

    const fullTitle =
      routeKey === "home" ? `${APP_NAME} - ${pageTitle}` : pageTitle ? `${pageTitle} | ${APP_NAME}` : `${APP_NAME} - ${t("defaultTitle")}`;

    const robots =
      isPrivate || (routeKey && NOINDEX_ROUTES.has(routeKey)) ? t("robotsNoIndex") : undefined;

    return { fullTitle, description, keywords, robots };
  }, [location.pathname, t, i18n.language]);

  const canonical = `${SITE_URL}${location.pathname}`;

  return (
    <Helmet>
      <title>{meta.fullTitle}</title>
      <meta name="description" content={meta.description} />
      <meta name="keywords" content={meta.keywords} />
      {meta.robots ? <meta name="robots" content={meta.robots} /> : null}
      <link rel="canonical" href={canonical} />
      <meta property="og:title" content={meta.fullTitle} />
      <meta property="og:description" content={meta.description} />
      <meta property="og:url" content={canonical} />
      <meta property="og:image" content={`${SITE_URL}${DEFAULT_OG_IMAGE}`} />
      <meta name="twitter:title" content={meta.fullTitle} />
      <meta name="twitter:description" content={meta.description} />
      <meta name="twitter:image" content={`${SITE_URL}${DEFAULT_OG_IMAGE}`} />
    </Helmet>
  );
}
