/** Ordered blog post ids — shared by home teaser and blogs page. */
export const BLOG_POST_IDS = [
  "remote-communication",
  "timezone-collaboration",
  "meeting-fatigue",
  "async-onboarding",
  "video-vs-text",
  "remote-feedback",
  "async-video",
  "recording-flow",
  "screen-camera",
  "use-cases",
  "recording-quality",
  "lifecycle",
  "secure-sharing",
  "upload-performance",
] as const;

export type BlogPostId = (typeof BLOG_POST_IDS)[number];
