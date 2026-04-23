import { Ad } from "@/components/Ads";
import PublicPageLayout from "@/components/PublicPageLayout";

const articles = [
  {
    title: "How Screen Recording Flow Works in ScreenFlow",
    body: "A recording starts from capture or upload, then moves into multipart transfer, processing, thumbnail generation, and final shareable output. Understanding this flow helps teams debug delays and improve recording quality.",
    points: [
      "Capture or upload stage",
      "Reliable multipart transfer",
      "Processing and status updates",
      "Ready state and sharing",
    ],
  },
  {
    title: "Screen + Camera Track vs Single Source Recording",
    body: "Use both screen and camera when context, personality, or demos benefit from face visibility. Use screen-only for focused walkthroughs and camera-only for quick announcements or feedback.",
    points: [
      "Screen + camera for explainers and onboarding",
      "Screen-only for technical walkthroughs",
      "Camera-only for async team updates",
      "Choose based on audience and objective",
    ],
  },
  {
    title: "Top Use Cases for a Screen Recording SaaS",
    body: "Screen recording platforms help across engineering, product, design, support, and sales. Teams can reduce meetings and improve clarity by sending concise visual updates.",
    points: [
      "Bug reporting and QA reproduction",
      "Feature demos and release updates",
      "Customer support responses",
      "Internal training and onboarding",
    ],
  },
  {
    title: "Best Practices for High-Quality Recordings",
    body: "Plan your message, keep recordings short, and control visual noise. Better source quality reduces processing issues and improves viewer retention.",
    points: [
      "Use a clear outline before recording",
      "Keep videos task-focused and concise",
      "Record in a quiet environment",
      "Set correct visibility before sharing",
    ],
  },

  // NEW ARTICLES 👇

  {
    title: "Understanding Recording Statuses and Lifecycle",
    body: "Each recording goes through multiple states from upload to final readiness. Knowing what each status means helps users and developers quickly identify issues and track progress.",
    points: [
      "Uploading: chunks are being transferred",
      "Processing: transcoding and thumbnail generation",
      "Ready: video is fully available",
      "Failed: errors during upload or processing",
    ],
  },
  {
    title: "How to Optimize Video Upload Performance",
    body: "Efficient uploads improve user experience and reduce failure rates. Proper chunk sizing, retries, and network handling are critical for reliable large video transfers.",
    points: [
      "Use multipart uploads for large files",
      "Choose optimal chunk sizes (e.g., 5MB+)",
      "Implement retry logic for failed parts",
      "Track progress and handle network interruptions",
    ],
  },
];
export default function BlogsPage() {
  return (
    <PublicPageLayout
      title="Blogs"
      subtitle="Helpful articles for teams using a screen recording SaaS platform."
    >
      <div className="grid md:grid-cols-1 gap-4">
        {articles.map((article) => (
          <article key={article.title} className="glass rounded-xl p-5 border border-border/50">
            <h2 className="text-lg font-semibold mb-2">{article.title}</h2>
            <p className="text-sm text-muted-foreground leading-6 mb-3">{article.body}</p>
            <ul className="text-sm text-muted-foreground list-disc pl-5 space-y-1">
              {article.points.map((point) => (
                <li key={point}>{point}</li>
              ))}
            </ul>
          </article>
        ))}
        <Ad/>
      </div>
    </PublicPageLayout>
  );
}
