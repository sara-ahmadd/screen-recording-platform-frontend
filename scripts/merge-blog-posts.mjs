#!/usr/bin/env node
/**
 * Merges new blog posts into locale files, reorders by registry, and regenerates sitemap.xml.
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");

const POST_ORDER = [
  "remote-communication",
  "timezone-collaboration",
  "meeting-fatigue",
  "async-onboarding",
  "video-vs-text",
  "remote-feedback",
  "async-video",
  "remote-work-culture",
  "distributed-productivity",
  "async-standups",
  "use-cases",
  "recording-quality",
  "screen-camera",
  "video-onboarding-customers",
  "async-communication-etiquette",
  "recording-flow",
  "lifecycle",
  "secure-sharing",
  "upload-performance",
];

const SLUGS = {
  "remote-communication": "improve-remote-team-communication",
  "timezone-collaboration": "collaborate-across-time-zones-without-burnout",
  "meeting-fatigue": "reduce-meeting-fatigue-remote-teams",
  "async-onboarding": "async-onboarding-remote-hires",
  "video-vs-text": "when-to-send-video-vs-written-update",
  "remote-feedback": "giving-clear-feedback-distributed-teams",
  "async-video": "complete-guide-async-video-communication",
  "remote-work-culture": "building-strong-remote-work-culture",
  "distributed-productivity": "distributed-team-productivity-framework",
  "async-standups": "async-standups-remote-teams-guide",
  "use-cases": "screen-recording-use-cases-remote-teams",
  "recording-quality": "professional-screen-recording-best-practices",
  "screen-camera": "screen-camera-vs-screen-only-recording",
  "video-onboarding-customers": "video-onboarding-customer-success-teams",
  "async-communication-etiquette": "async-communication-etiquette-distributed-teams",
  "recording-flow": "browser-screen-recording-for-remote-staff",
  lifecycle: "recording-status-video-lifecycle",
  "secure-sharing": "secure-video-sharing-teams",
  "upload-performance": "improve-video-upload-reliability",
};

function mergeLocale(locale, newPostsFile) {
  const filePath = path.join(root, "src/i18n/locales", locale, "blogPosts.json");
  const data = JSON.parse(fs.readFileSync(filePath, "utf8"));
  const newPosts = JSON.parse(fs.readFileSync(path.join(root, newPostsFile), "utf8"));
  const merged = { ...data.posts, ...newPosts };
  const reordered = {};
  for (const id of POST_ORDER) {
    if (merged[id]) reordered[id] = merged[id];
  }
  data.posts = reordered;
  fs.writeFileSync(filePath, `${JSON.stringify(data, null, 2)}\n`);
  console.log(`Updated ${filePath}`);
}

function addImageFlags(locale) {
  const filePath = path.join(root, "src/i18n/locales", locale, "blogPosts.json");
  const data = JSON.parse(fs.readFileSync(filePath, "utf8"));
  const post = data.posts["remote-communication"];
  if (!post?.intro) return;
  const flag =
    locale === "ar"
      ? "[INSERT CUSTOM SCREENSHOT: مخطط قنوات تواصل الفريق عن بُعد يوضح Slack والمستندات وسير الفيديو غير المتزامن]"
      : "[INSERT CUSTOM SCREENSHOT: Remote team communication channel map showing Slack, docs, and async video workflows]";
  if (!post.intro.includes(flag)) {
    post.intro = [...post.intro, flag];
  }
  const section4 = post.sections?.find((s) => s.title?.includes("4") || s.title?.includes("٤"));
  if (section4?.paragraphs) {
    const recFlag =
      locale === "ar"
        ? "[INSERT CUSTOM SCREENSHOT: مثال على تسجيل شاشة قصير مرفق بتذكرة خطأ]"
        : "[INSERT CUSTOM SCREENSHOT: Example short screen recording attached to a bug ticket]";
    if (!section4.paragraphs.some((p) => p.startsWith("[INSERT"))) {
      section4.paragraphs.push(recFlag);
    }
  }
  fs.writeFileSync(filePath, `${JSON.stringify(data, null, 2)}\n`);
}

function generateSitemap() {
  const staticPaths = [
    "/",
    "/about",
    "/blogs",
    "/how-it-works",
    "/demo",
    "/contact",
    "/privacy-policy",
    "/terms-and-conditions",
    "/refund-policy",
    "/copyright-policy",
    "/abuse-reporting-policy",
    "/cookie-policy",
    "/plans",
  ];
  const blogPaths = POST_ORDER.map((id) => `/blogs/${SLUGS[id]}`);
  const all = [...staticPaths, ...blogPaths];
  const urls = all
    .map(
      (p) => `  <url>
    <loc>https://therec.site${p}</loc>
    <changefreq>${p.startsWith("/blogs/") ? "monthly" : p === "/" || p === "/blogs" ? "weekly" : "monthly"}</changefreq>
    <priority>${p === "/" ? "1.0" : p === "/blogs" ? "0.9" : p.startsWith("/blogs/") ? "0.8" : "0.7"}</priority>
  </url>`,
    )
    .join("\n");
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>
`;
  fs.writeFileSync(path.join(root, "public/sitemap.xml"), xml);
  console.log("Updated public/sitemap.xml");
}

mergeLocale("en", "scripts/newBlogPosts.en.json");
mergeLocale("ar", "scripts/newBlogPosts.ar.json");
addImageFlags("en");
addImageFlags("ar");
generateSitemap();
console.log("Done.");
