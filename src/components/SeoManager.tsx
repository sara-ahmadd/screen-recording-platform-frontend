import { Helmet } from "react-helmet-async";
import { useLocation } from "react-router-dom";

const APP_NAME = "theRec";
const DEFAULT_TITLE = `${APP_NAME} - Online Screen Recorder for Teams`;
const DEFAULT_DESCRIPTION =
  "theRec is an online screen recorder and video recorder for teams to capture, share, and collaborate faster.";
const DEFAULT_KEYWORDS =
  "screen recording, video recorder, online recorder, online screen recorder, team collaboration, browser screen recorder, record screen online";
const DEFAULT_OG_IMAGE = "/og-image.svg";
const SITE_URL = (import.meta.env.VITE_SITE_URL || "https://therec.site").replace(/\/$/, "");

type SeoData = {
  title: string;
  description: string;
  keywords?: string;
  robots?: string;
};

const ROUTE_SEO: Record<string, SeoData> = {
  "/": {
    title: "Online Screen Recorder for Teams",
    description:
      "Record your screen online, share video recordings instantly, and collaborate in one place with theRec.",
    keywords:
      "screen recording, online screen recorder, video recorder, record screen online, team video collaboration",
  },
  "/login": {
    title: "Login",
    description: "Sign in to your theRec workspace to manage screen recordings and team videos.",
    robots: "noindex, nofollow",
  },
  "/register": {
    title: "Create Account",
    description: "Create your theRec account to start recording your screen and sharing videos online.",
    robots: "noindex, nofollow",
  },
  "/verify": {
    title: "Verify Account",
    description: "Verify your email to activate your theRec account.",
    robots: "noindex, nofollow",
  },
  "/forgot-password": {
    title: "Reset Password",
    description: "Reset your theRec account password securely.",
    robots: "noindex, nofollow",
  },
  "/preview/:token": {
    title: "Video Preview",
    description: "Preview a shared theRec screen recording.",
  },
  "/share/:shareToken": {
    title: "Shared Recording",
    description: "Watch and review a shared recording on theRec.",
  },
  "/about": {
    title: "About",
    description: "Learn about theRec, an online screen recorder built for faster team communication.",
  },
  "/blogs": {
    title: "Blogs",
    description: "Read tips on screen recording, video recording, and online collaboration with theRec.",
  },
  "/privacy-policy": {
    title: "Privacy Policy",
    description: "Read theRec privacy policy and how we handle your data.",
  },
  "/terms-and-conditions": {
    title: "Terms and Conditions",
    description: "Read theRec terms and conditions for using our online recorder platform.",
  },
  "/contact": {
    title: "Contact",
    description: "Contact theRec support for help with screen recording and account questions.",
  },
  "/dashboard": {
    title: "Dashboard",
    description: "Manage your workspace recordings, status, and collaboration flow in theRec.",
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
  const keywords = seo?.keywords || DEFAULT_KEYWORDS;
  const robots =
    seo?.robots || (isPrivatePath(location.pathname) ? "noindex, nofollow" : "index, follow");
  const canonicalUrl = `${SITE_URL}${location.pathname}`;

  return (
    <Helmet prioritizeSeoTags>
      <title>{title}</title>
      <meta name="description" content={description} />
      <meta name="keywords" content={keywords} />
      <meta name="robots" content={robots} />
      <link rel="canonical" href={canonicalUrl} />
      <meta property="og:type" content="website" />
      <meta property="og:site_name" content={APP_NAME} />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:url" content={canonicalUrl} />
      <meta property="og:image" content={`${SITE_URL}${DEFAULT_OG_IMAGE}`} />
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={`${SITE_URL}${DEFAULT_OG_IMAGE}`} />
    </Helmet>
  );
};

export default SeoManager;
