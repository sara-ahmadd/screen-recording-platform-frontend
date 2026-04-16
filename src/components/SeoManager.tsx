import { Helmet } from "react-helmet-async";
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
  "/dashboard": {
    title: "Dashboard",
    description: "Manage your workspace recordings, status, and collaboration flow.",
    robots: "noindex, nofollow",
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
  const seo = matchRouteSeo(location.pathname);
  const fallbackTitle = location.pathname === "/" ? DEFAULT_TITLE : `${APP_NAME} App`;
  const title = seo ? `${seo.title} | ${APP_NAME}` : fallbackTitle;
  const description = seo?.description || DEFAULT_DESCRIPTION;
  const robots =
    seo?.robots || (isPrivatePath(location.pathname) ? "noindex, nofollow" : "index, follow");
  const canonicalUrl = `${SITE_URL}${location.pathname}`;

  return (
    <Helmet prioritizeSeoTags>
      <title>{title}</title>
      <meta name="description" content={description} />
      <meta name="robots" content={robots} />
      <link rel="canonical" href={canonicalUrl} />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:url" content={canonicalUrl} />
      <meta property="og:image" content={`${SITE_URL}${DEFAULT_OG_IMAGE}`} />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={`${SITE_URL}${DEFAULT_OG_IMAGE}`} />
    </Helmet>
  );
};

export default SeoManager;
