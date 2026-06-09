import { getAllBlogPostPaths } from "./blogPosts";

/** All public routes that must ship as pre-rendered HTML for crawlers. */
export function getPrerenderRoutes(): string[] {
  return [
    "/",
    "/about",
    "/blogs",
    ...getAllBlogPostPaths(),
    "/contact",
    "/demo",
    "/how-it-works",
    "/privacy-policy",
    "/terms-and-conditions",
    "/refund-policy",
    "/copyright-policy",
    "/abuse-reporting-policy",
    "/cookie-policy",
    "/plans",
  ];
}
