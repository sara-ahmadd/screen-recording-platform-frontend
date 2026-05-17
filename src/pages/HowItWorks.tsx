// HowItWorksPage.tsx

import { useState } from "react";
import PublicPageLayout from "@/components/PublicPageLayout";
import SubscriptionWorkflow from "@/components/SubscriptionFlow";
import {
  Circle,
  CloudUpload,
  LoaderCircle,
  PlaySquare,
  LayoutGrid,
  X,
  ZoomIn,
} from "lucide-react";
import Footer from "@/components/Footer";
import { Link } from "react-router-dom";

export default function HowItWorksPage() {
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  const steps = [
    {
      id: "01",
      title: "Start Recording",
      topDesc:
        "Open the recorder and configure your screen, mic, and title.",
      bottomDesc:
        'Go to the Record page, turn on your microphone if needed, add a title, and click "Start Recording". You can record your entire screen, a window, or a browser tab.',
      icon: Circle,
    },
    {
      id: "02",
      title: "Initialize Upload",
      topDesc:
        "Once you stop, the upload and finalization process begins.",
      bottomDesc:
        "After you stop recording, the system finalizes the recording and uploads it securely to our servers. Please keep the tab open while this is in progress.",
      icon: CloudUpload,
    },
    {
      id: "03",
      title: "Processing Video",
      topDesc:
        "Your video is uploaded and processed securely in the cloud.",
      bottomDesc:
        "Once the upload is complete, the video is automatically processed in the cloud. This includes optimization, generating thumbnails, and preparing it for smooth playback.",
      icon: LoaderCircle,
    },
    {
      id: "04",
      title: "Recording Details",
      topDesc:
        "Preview, manage, and share your recording with ease.",
      bottomDesc:
        "Your recording is ready! You can preview the video, change visibility, download, share a link, remove watermark, or delete it anytime.",
      icon: PlaySquare,
    },
    {
      id: "05",
      title: "Workspace Dashboard",
      topDesc:
        "All your recordings are organized and ready in your dashboard.",
      bottomDesc:
        "All your recordings are neatly listed in your dashboard. You can filter, search, and manage them across your workspaces.",
      icon: LayoutGrid,
    },
  ];

  return (
    <>
      <PublicPageLayout footer={false}
        title="How it works"
        subtitle="A simple workflow from recording your screen to sharing it with your team."
      >

        {/* HERO */}
 

<section className="py-10">
  <div className="mx-auto text-center">

    <div className="inline-flex items-center rounded-full border border-violet-500/20 bg-violet-500/10 dark:bg-violet-500/15 px-5 py-2 text-sm font-semibold text-violet-700 dark:text-violet-300 mb-6 transition-all duration-300 origin-center cursor-default backdrop-blur-sm">
      Screen Recording workflow
    </div>

    <h1 className="text-4xl md:text-5xl font-black tracking-tight leading-[1.05] text-foreground">
      <span className="inline-block transition-all duration-300 origin-center">
        Record.
      </span>{" "}

      <span className="inline-block text-[#6C47FF] dark:text-violet-400 transition-all duration-300 origin-center">
        Process.
      </span>{" "}

      <span className="inline-block text-[#6C47FF] dark:text-violet-400 transition-all duration-300 origin-center">
        Share.
      </span>
    </h1>

  </div>
</section>

{/* top minni steps */}
<section>
  <div className="max-w-full mx-auto grid md:grid-cols-5 gap-3 mb-14">

    {steps.map((step) => (
      <div key={step.id} className="text-center">

        {/* Number */}
        <div className="h-14 w-14 rounded-full bg-gradient-to-r from-[#4F46E5] to-[#7C3AED] text-white flex items-center justify-center mx-auto font-bold text-lg shadow-lg transition-all duration-300">
          {step.id}
        </div>

        {/* Title */}
        <h3 className="font-extrabold text-[24px] text-foreground mt-6 transition-all duration-300 origin-center cursor-default">
          {step.title}
        </h3>

        {/* Desc */}
        <p className="text-muted-foreground text-[15px] mt-4 leading-relaxed max-w-[270px] mx-auto transition-all duration-300 hover:z-20 hover:relative hover:bg-background/80 dark:hover:bg-white/[0.03] hover:backdrop-blur-xl hover:p-2 hover:rounded-xl cursor-default">
          {step.topDesc}
        </p>
      </div>
    ))}
  </div>
</section>

{/* center image */}

<section className="px-6">
  <div className="max-w-[1700px] mx-auto">

    <div
      onClick={() =>
        setPreviewImage("/assets/how-it-works/full-workflow.png")
      }
      className="group relative rounded-[34px] overflow-hidden border border-border shadow-[0_20px_80px_rgba(0,0,0,0.08)] dark:shadow-[0_20px_80px_rgba(0,0,0,0.45)] cursor-pointer bg-background"
    >

      <img
        src="/assets/how-it-works/full-workflow.png"
        alt="Workflow"
        className="w-full h-auto object-cover transition-all duration-500 group-hover:scale-[1.02]"
      />

      {/* Overlay */}
      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 dark:group-hover:bg-black/40 transition-all duration-300 flex items-center justify-center">
        <div className="opacity-0 group-hover:opacity-100 transition-all duration-300 bg-white/90 dark:bg-black/70 backdrop-blur-xl rounded-full p-5 shadow-2xl">
          <ZoomIn className="h-10 w-10 text-[#6C47FF] dark:text-violet-300" />
        </div>
      </div>

    </div>

  </div>
</section>
        {/* BOTTOM STEPS */}
      

<section className="py-10">
  <div className="max-w-full mx-auto grid md:grid-cols-5 gap-7">

    {steps.map((step, index) => {
      const Icon = step.icon;

      return (
        <div
          key={index}
          className="rounded-[30px] border border-border bg-background/70 dark:bg-white/[0.03] backdrop-blur-xl p-7 shadow-[0_8px_30px_rgba(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgba(0,0,0,0.35)] hover:shadow-[0_12px_40px_rgba(108,71,255,0.08)] transition-all duration-300"
        >

          {/* Icon */}
          <div className="h-16 w-16 rounded-2xl bg-violet-500/10 dark:bg-violet-500/15 flex items-center justify-center mb-7 transition-all duration-300">
            <Icon
              className="h-8 w-8 text-[#6C47FF] dark:text-violet-300"
              strokeWidth={2.2}
            />
          </div>

          {/* Title */}
          <h3 className="text-[26px] font-black tracking-tight text-foreground leading-tight mb-5 transition-all duration-300 origin-left cursor-default">
            {step.id}. {step.title}
          </h3>

          {/* Desc */}
          <p className="text-muted-foreground text-[15px] leading-[1.9] font-medium transition-all duration-300 hover:z-20 hover:relative hover:bg-background/80 dark:hover:bg-white/[0.03] hover:backdrop-blur-xl hover:p-3 hover:rounded-xl cursor-default">
            {step.bottomDesc}
          </p>
        </div>
      );
    })}
  </div>
</section>
       

     

      </PublicPageLayout>
 <SubscriptionWorkflow />
    {/* CTA */}

<section className="py-28 px-6">
  <div className="max-w-5xl mx-auto rounded-[40px] border border-border bg-gradient-to-b from-background to-violet-500/[0.03] dark:from-white/[0.02] dark:to-violet-500/[0.08] backdrop-blur-xl p-14 text-center shadow-[0_20px_80px_rgba(108,71,255,0.06)] dark:shadow-[0_20px_80px_rgba(0,0,0,0.35)]">

    <h2 className="text-4xl md:text-5xl font-black tracking-tight text-foreground transition-all duration-300 inline-block">
      Start recording in minutes
    </h2>

    <p className="text-muted-foreground text-lg mt-6 max-w-2xl mx-auto my-3 transition-all duration-300 p-3">
      Capture your screen, process videos automatically,
      and collaborate faster with theRec.
    </p>

    <Link
      to={"/record"}
      className="inline-flex items-center justify-center mt-10 bg-gradient-to-r from-[#4F46E5] to-[#7C3AED] text-white px-10 py-5 rounded-2xl text-lg font-bold shadow-xl hover:scale-[1.03] transition-all duration-300"
    >
      Start Recording Now
    </Link>
  </div>
</section>
 <Footer/>
      {/* IMAGE PREVIEW MODAL */}
      {previewImage && (
        <div className="fixed inset-0 z-[9999] bg-black/80 backdrop-blur-sm flex items-center justify-center p-6">

          {/* Close Button */}
          <button
            onClick={() => setPreviewImage(null)}
            className="absolute top-6 right-6 h-14 w-14 rounded-full bg-white text-black flex items-center justify-center shadow-2xl  transition-all duration-300"
          >
            <X className="h-7 w-7" />
          </button>

          {/* Image */}
          <img
            src={previewImage}
            alt="Preview"
            className="max-w-[95vw] max-h-[92vh] object-contain rounded-3xl shadow-[0_20px_120px_rgba(0,0,0,0.5)] animate-in fade-in zoom-in duration-300"
          />
        </div>
      )}
    </>
  );
}