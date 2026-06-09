export const SITE_URL = (import.meta.env.VITE_SITE_URL || "https://therec.site").replace(/\/$/, "");

export const SITE_NAME = "theRec";
export const SITE_LEGAL_NAME = "theRec.site";

/** TODO: Replace with your registered legal business name before Paddle onboarding submission. */
export const LEGAL_BUSINESS_NAME = import.meta.env.VITE_LEGAL_BUSINESS_NAME || "theRec.site";

/** TODO: Add commercial registration number when available. */
export const LEGAL_REGISTRATION_NUMBER = import.meta.env.VITE_LEGAL_REGISTRATION_NUMBER || "";

/** TODO: Add tax/VAT registration identifier when available. */
export const LEGAL_TAX_ID = import.meta.env.VITE_LEGAL_TAX_ID || "";

export const ORGANIZATION = {
  name: SITE_LEGAL_NAME,
  legalBusinessName: LEGAL_BUSINESS_NAME,
  registrationNumber: LEGAL_REGISTRATION_NUMBER,
  taxId: LEGAL_TAX_ID,
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

import { getAllBlogPostPaths } from "./blogPosts";

/** Public indexable paths for sitemap and internal linking. */
export const PUBLIC_INDEXABLE_PATHS = [
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
] as const;
