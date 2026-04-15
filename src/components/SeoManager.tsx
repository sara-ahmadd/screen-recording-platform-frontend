import { useEffect } from "react";
import { useLocation } from "react-router-dom";

const APP_NAME = "ScreenFlow";
const DEFAULT_TITLE = `${APP_NAME} - Screen Recording for Teams`;
const DEFAULT_DESCRIPTION =
  "Record your screen, share videos instantly, and collaborate faster with your team.";
const DEFAULT_OG_IMAGE = "/og-image.svg";
const SITE_URL = (import.meta.env.VITE_SITE_URL || "https://screenflow.app").replace(/\/$/, "");

type SeoData = {
  title: string;
  description: string;
  robots?: string;
};

const ROUTE_SEO: Record<string, SeoData> = {
  "/": {
    title: "Screen Recording SaaS for Teams",
    description:
      "Capture your screen, share recordings, and collaborate with comments in one place.",
  },
  "/login": {
    title: "Login",
    description: "Sign in to your ScreenFlow workspace.",
    robots: "noindex, nofollow",
  },
  "/register": {
    title: "Create Account",
    description: "Create your ScreenFlow account to start recording and sharing.",
    robots: "noindex, nofollow",
  },
  "/verify": {
    title: "Verify Account",
    description: "Verify your email to activate your ScreenFlow account.",
    robots: "noindex, nofollow",
  },
  "/forgot-password": {
    title: "Reset Password",
    description: "Reset your ScreenFlow account password securely.",
    robots: "noindex, nofollow",
  },
  "/preview/:token": {
    title: "Video Preview",
    description: "Preview a shared ScreenFlow recording.",
  },
  "/share/:shareToken": {
    title: "Shared Recording",
    description: "Watch and review a shared recording on ScreenFlow.",
  },
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

const setMetaContent = (selector: string, content: string) => {
  const element = document.querySelector(selector);
  if (element instanceof HTMLMetaElement) {
    element.setAttribute("content", content);
  }
};

const setCanonical = (url: string) => {
  const canonical = document.querySelector('link[rel="canonical"]');
  if (canonical instanceof HTMLLinkElement) {
    canonical.setAttribute("href", url);
  }
};

const matchRouteSeo = (pathname: string): SeoData | undefined => {
  if (ROUTE_SEO[pathname]) return ROUTE_SEO[pathname];
  if (pathname.startsWith("/preview/")) return ROUTE_SEO["/preview/:token"];
  if (pathname.startsWith("/share/")) return ROUTE_SEO["/share/:shareToken"];
  return undefined;
};

const isPrivatePath = (pathname: string) =>
  PRIVATE_PATH_PREFIXES.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));

const SeoManager = () => {
  const location = useLocation();

  useEffect(() => {
    const seo = matchRouteSeo(location.pathname);
    const fallbackTitle = location.pathname === "/" ? DEFAULT_TITLE : `${APP_NAME} App`;
    const title = seo ? `${seo.title} | ${APP_NAME}` : fallbackTitle;
    const description = seo?.description || DEFAULT_DESCRIPTION;
    const robots =
      seo?.robots || (isPrivatePath(location.pathname) ? "noindex, nofollow" : "index, follow");
    const canonicalUrl = `${SITE_URL}${location.pathname}`;

    document.title = title;
    setMetaContent('meta[name="description"]', description);
    setMetaContent('meta[name="robots"]', robots);
    setMetaContent('meta[property="og:title"]', title);
    setMetaContent('meta[property="og:description"]', description);
    setMetaContent('meta[property="og:url"]', canonicalUrl);
    setMetaContent('meta[property="og:image"]', `${SITE_URL}${DEFAULT_OG_IMAGE}`);
    setMetaContent('meta[name="twitter:title"]', title);
    setMetaContent('meta[name="twitter:description"]', description);
    setMetaContent('meta[name="twitter:image"]', `${SITE_URL}${DEFAULT_OG_IMAGE}`);
    setCanonical(canonicalUrl);
  }, [location.pathname]);

  return null;
};

export default SeoManager;
