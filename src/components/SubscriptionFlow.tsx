// SubscriptionWorkflow.tsx

import React, { useState } from "react";
import { ZoomIn, X } from "lucide-react";

const SubscriptionWorkflow: React.FC = () => {
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  const subscriptionSteps = [
    {
      id: "01",
      title: "Current Subscription",
      desc: "After logging into the platform, the user navigates to the Billing page from the dashboard sidebar. The current workspace subscription details, billing cycle, active plan, and subscription history are displayed here.",
    },
    {
      id: "02",
      title: "Choose a Plan",
      desc: "The user can click “Change your plan” or upgrade to another plan. A pricing page is displayed with all available plans alongside monthly and yearly billing options for easy comparison.",
    },
    {
      id: "03",
      title: "Confirm Subscription",
      desc: "After selecting a plan, the user is redirected to a confirmation page where recurring billing authorization and agreement to the terms and conditions must be accepted before continuing.",
    },
    {
      id: "04",
      title: "Enter Billing Information",
      desc: "A billing popup or dialog appears requesting customer billing information such as name, email, country, city, address, and optional promo code before proceeding.",
    },
    {
      id: "05",
      title: "Final Review & Payment",
      desc: "The final checkout review page displays the selected subscription plan, billing cycle, and payment summary. Clicking “Continue to Payment” redirects the user to Stripe Checkout where the payment is securely completed.",
    },
  ];

  return (
    <>
      <section className="py-28 px-6 overflow-hidden bg-background">

        <div className="max-w-[1700px] mx-auto">

          {/* Heading */}
          <div className="text-center mb-20">

            <div className="inline-flex items-center rounded-full border border-violet-500/20 bg-violet-500/10 dark:bg-violet-500/15 px-5 py-2 text-sm font-semibold text-violet-700 dark:text-violet-300 mb-6 transition-all duration-300 backdrop-blur-sm">
              Subscription workflow
            </div>

            <h2 className="text-4xl md:text-5xl font-black tracking-tight leading-[1.05] text-foreground">
              <span className="inline-block transition-all duration-300">
                Upgrade your workspace
              </span>

              <span className="text-[#6C47FF] dark:text-violet-400 inline-block transition-all duration-300">
                {" "}in minutes
              </span>
            </h2>

            <p className="max-w-3xl mx-auto text-[20px] text-muted-foreground mt-8 leading-relaxed font-medium transition-all duration-300 hover:bg-background/80 dark:hover:bg-white/[0.03] hover:backdrop-blur-xl hover:p-4 hover:rounded-2xl">
              A seamless billing and subscription experience designed for teams,
              creators, and businesses using theRec platform.
            </p>
          </div>

          {/* FLOW IMAGE */}
          <div
            onClick={() =>
              setPreviewImage("/assets/how-it-works/subscription-flow.png")
            }
            className="group relative rounded-[34px] overflow-hidden border border-border shadow-[0_20px_80px_rgba(0,0,0,0.08)] dark:shadow-[0_20px_80px_rgba(0,0,0,0.45)] mb-24 bg-background cursor-pointer"
          >

            <img
              src="/assets/how-it-works/subscription-flow.png"
              alt="Subscription workflow"
              className="w-full h-auto object-cover transition-all duration-500 group-hover:scale-[1.02]"
            />

            {/* Overlay */}
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 dark:group-hover:bg-black/40 transition-all duration-300 flex items-center justify-center">

              <div className="opacity-0 group-hover:opacity-100 transition-all duration-300 bg-white/90 dark:bg-black/70 backdrop-blur-xl rounded-full p-5 shadow-2xl">

                <ZoomIn className="h-10 w-10 text-[#6C47FF] dark:text-violet-300" />

              </div>
            </div>

          </div>

          {/* BOTTOM DETAILED STEPS */}
          <div className="grid md:grid-cols-2 xl:grid-cols-5 gap-7">

            {subscriptionSteps.map((step) => (
              <div
                key={step.id}
                className="rounded-[30px] border border-border bg-background/70 dark:bg-white/[0.03] backdrop-blur-xl p-7 shadow-[0_8px_30px_rgba(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgba(0,0,0,0.35)] hover:shadow-[0_12px_40px_rgba(108,71,255,0.08)] transition-all duration-300"
              >

                {/* Step Number */}
                <div className="h-14 w-14 rounded-2xl bg-gradient-to-r from-[#4F46E5] to-[#7C3AED] text-white flex items-center justify-center text-lg font-black mb-6 shadow-lg transition-all duration-300">
                  {step.id}
                </div>

                {/* Title */}
                <h3 className="text-[26px] leading-tight font-black tracking-tight text-foreground mb-5 transition-all duration-300 origin-left cursor-default">
                  {step.title}
                </h3>

                {/* Description */}
                <p className="text-muted-foreground text-[15px] leading-[1.9] font-medium hover:z-20 hover:relative hover:bg-background/80 dark:hover:bg-white/[0.03] hover:backdrop-blur-xl hover:p-3 hover:rounded-xl transition-all duration-300 cursor-default">
                  {step.desc}
                </p>
              </div>
            ))}
          </div>

        </div>
      </section>

      {/* PREVIEW MODAL */}
      {previewImage && (
        <div className="fixed inset-0 z-[9999] bg-black/80 backdrop-blur-md flex items-center justify-center p-6">

          {/* Close Button */}
          <button
            onClick={() => setPreviewImage(null)}
            className="absolute top-6 right-6 h-14 w-14 rounded-full bg-white dark:bg-zinc-900 border border-white/10 text-black dark:text-white flex items-center justify-center shadow-2xl transition-all duration-300 hover:scale-105"
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
};

export default SubscriptionWorkflow;