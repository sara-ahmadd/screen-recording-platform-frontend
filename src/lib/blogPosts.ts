/**
 * Blog registry — single source of truth for IDs, SEO slugs, routing, and AdSense content calendar.
 * Every post maps to an independent URL: /blogs/{slug}
 */

export type BlogPostDefinition = {
  /** i18n key under marketing:blogs.posts.{id} */
  id: string;
  /** Clean URL segment for /blogs/{slug} */
  slug: string;
  /** Primary SEO keyword target */
  primaryKeyword: string;
  /** Featured in the 15-article AdSense educational calendar */
  calendarFeatured: boolean;
  /** Sort priority on index (lower = higher) */
  sortOrder: number;
};

export const BLOG_POSTS: readonly BlogPostDefinition[] = [
  {
    id: "remote-communication",
    slug: "improve-remote-team-communication",
    primaryKeyword: "improve remote team communication",
    calendarFeatured: true,
    sortOrder: 1,
  },
  {
    id: "timezone-collaboration",
    slug: "collaborate-across-time-zones-without-burnout",
    primaryKeyword: "collaborate across time zones",
    calendarFeatured: true,
    sortOrder: 2,
  },
  {
    id: "meeting-fatigue",
    slug: "reduce-meeting-fatigue-remote-teams",
    primaryKeyword: "meeting fatigue remote teams",
    calendarFeatured: true,
    sortOrder: 3,
  },
  {
    id: "async-onboarding",
    slug: "async-onboarding-remote-hires",
    primaryKeyword: "async onboarding remote employees",
    calendarFeatured: true,
    sortOrder: 4,
  },
  {
    id: "video-vs-text",
    slug: "when-to-send-video-vs-written-update",
    primaryKeyword: "async video vs text communication",
    calendarFeatured: true,
    sortOrder: 5,
  },
  {
    id: "remote-feedback",
    slug: "giving-clear-feedback-distributed-teams",
    primaryKeyword: "giving feedback remote teams",
    calendarFeatured: true,
    sortOrder: 6,
  },
  {
    id: "async-video",
    slug: "complete-guide-async-video-communication",
    primaryKeyword: "async video communication",
    calendarFeatured: true,
    sortOrder: 7,
  },
  {
    id: "remote-work-culture",
    slug: "building-strong-remote-work-culture",
    primaryKeyword: "remote work culture",
    calendarFeatured: true,
    sortOrder: 8,
  },
  {
    id: "distributed-productivity",
    slug: "distributed-team-productivity-framework",
    primaryKeyword: "distributed team productivity",
    calendarFeatured: true,
    sortOrder: 9,
  },
  {
    id: "async-standups",
    slug: "async-standups-remote-teams-guide",
    primaryKeyword: "async standups remote teams",
    calendarFeatured: true,
    sortOrder: 10,
  },
  {
    id: "use-cases",
    slug: "screen-recording-use-cases-remote-teams",
    primaryKeyword: "screen recording remote teams",
    calendarFeatured: true,
    sortOrder: 11,
  },
  {
    id: "recording-quality",
    slug: "professional-screen-recording-best-practices",
    primaryKeyword: "screen recording best practices",
    calendarFeatured: true,
    sortOrder: 12,
  },
  {
    id: "screen-camera",
    slug: "screen-camera-vs-screen-only-recording",
    primaryKeyword: "screen recording with camera",
    calendarFeatured: true,
    sortOrder: 13,
  },
  {
    id: "video-onboarding-customers",
    slug: "video-onboarding-customer-success-teams",
    primaryKeyword: "video onboarding customers",
    calendarFeatured: true,
    sortOrder: 14,
  },
  {
    id: "async-communication-etiquette",
    slug: "async-communication-etiquette-distributed-teams",
    primaryKeyword: "async communication etiquette",
    calendarFeatured: true,
    sortOrder: 15,
  },
  {
    id: "recording-flow",
    slug: "browser-screen-recording-for-remote-staff",
    primaryKeyword: "browser screen recording for remote staff",
    calendarFeatured: false,
    sortOrder: 16,
  },
  {
    id: "lifecycle",
    slug: "recording-status-video-lifecycle",
    primaryKeyword: "video upload processing status",
    calendarFeatured: false,
    sortOrder: 17,
  },
  {
    id: "secure-sharing",
    slug: "secure-video-sharing-teams",
    primaryKeyword: "secure video sharing",
    calendarFeatured: false,
    sortOrder: 18,
  },
  {
    id: "upload-performance",
    slug: "improve-video-upload-reliability",
    primaryKeyword: "video upload reliability",
    calendarFeatured: false,
    sortOrder: 19,
  },
] as const;

export const BLOG_POST_IDS = BLOG_POSTS.map((p) => p.id) as readonly string[];
export type BlogPostId = (typeof BLOG_POSTS)[number]["id"];

export const BLOG_CALENDAR_POSTS = BLOG_POSTS.filter((p) => p.calendarFeatured);

const slugMap = new Map(BLOG_POSTS.map((p) => [p.slug, p]));
const idMap = new Map(BLOG_POSTS.map((p) => [p.id, p]));

export function getBlogPostBySlug(slug: string): BlogPostDefinition | undefined {
  return slugMap.get(slug);
}

export function getBlogPostById(id: string): BlogPostDefinition | undefined {
  return idMap.get(id);
}

export function getBlogPostPath(slug: string): string {
  return `/blogs/${slug}`;
}

export function getBlogPostPathById(id: string): string | undefined {
  const post = getBlogPostById(id);
  return post ? getBlogPostPath(post.slug) : undefined;
}

/** Absolute paths for SSG pre-rendering and sitemap generation */
export function getAllBlogPostPaths(): string[] {
  return BLOG_POSTS.map((p) => getBlogPostPath(p.slug));
}

export function getSortedBlogPosts(): readonly BlogPostDefinition[] {
  return [...BLOG_POSTS].sort((a, b) => a.sortOrder - b.sortOrder);
}
