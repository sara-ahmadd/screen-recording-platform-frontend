export const SITE_URL = (import.meta.env.VITE_SITE_URL || "https://therec.site").replace(/\/$/, "");

export const SITE_NAME = "theRec";
export const SITE_LEGAL_NAME = "theRec.site";

export const ORGANIZATION = {
  name: SITE_LEGAL_NAME,
  url: SITE_URL,
  logo: `${SITE_URL}/og-image.svg`,
  email: "hello@updates.therec.site",
  supportEmail: "support@updates.therec.site",
  address: {
    streetAddress: "51 memfais, Bab sharqi",
    addressLocality: "Alexandria",
    addressCountry: "EG",
  },
  sameAs: [] as string[],
};

/** Public indexable paths for sitemap and internal linking. */
export const PUBLIC_INDEXABLE_PATHS = [
  "/",
  "/about",
  "/blogs",
  "/contact",
  "/demo",
  "/how-it-works",
  "/privacy-policy",
  "/terms-and-conditions",
  "/refund-policy",
  "/copyright-policy",
  "/abuse-reporting-policy",
] as const;
