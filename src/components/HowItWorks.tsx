import { useState } from "react";
import { X, ArrowRight, CreditCard } from "lucide-react";
import { Reveal } from "./Reveal";
import { Badge } from "./Badge";
import { Link } from "react-router-dom";

export default function HowItWorksSection() {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  const items = [
    {
      step: "01",
      title: "Start Recording",
      desc: "Capture your screen directly from the browser without installing software.",
      image: "/assets/how-it-works/record.png",
    },
    {
      step: "02",
      title: "Automatic Processing",
      desc: "Your videos are optimized automatically with thumbnails and streaming support.",
      image: "/assets/how-it-works/processing-rec.png",
    },
    {
      step: "03",
      title: "Share Instantly",
      desc: "Send secure video links or collaborate privately inside your workspace.",
      image: "/assets/how-it-works/rec-details.png",
    },
  ];

  const subscriptionItems = [
    {
      step: "01",
      title: "Choose Your Plan",
      desc: "Upgrade your workspace using monthly or yearly subscription plans.",
      image:"/assets/how-it-works/choose-plan.png"
    },
    {
      step: "02",
      title: "Confirm Billing",
      desc: "Review recurring billing terms and confirm your subscription details.",
      image:"/assets/how-it-works/check-boxes.png"
    },
    {
      step: "03",
      title: "Secure Checkout",
      desc: "Review your billing data securely in Checkout review page.",
      image:"/assets/how-it-works/checkout-page.png"
    },
  ];

  return (
    <>
      {/* HOW IT WORKS */}
      <Reveal from="right">
        <section className="max-w-7xl mx-auto px-6 py-24">

          {/* HEADER */}
          <div className="text-center mb-14">

            <Badge className="gradient-primary border-0 mb-4 text-primary-foreground px-4 py-1.5">
              How It Works
            </Badge>

            <h2 className="text-3xl md:text-5xl font-bold tracking-tight">
              Record, process,
              <span className="gradient-text block mt-2">
                and share in minutes
              </span>
            </h2>

            <p className="text-muted-foreground mt-5 text-lg max-w-2xl mx-auto">
              A simple workflow built for async communication and fast team collaboration.
            </p>
          </div>

          {/* RECORDING WORKFLOW */}
          <div className="grid md:grid-cols-3 gap-6 mb-20">

            {items.map((item) => (
              <div
                key={item.step}
                className="relative glass rounded-3xl p-8 hover:-translate-y-1 transition-all duration-300"
              >

                <div className="absolute top-6 right-6 text-5xl font-bold text-primary/10">
                  {item.step}
                </div>

                <div className="relative z-10">

                  <div className="gradient-primary h-12 w-12 rounded-2xl flex items-center justify-center text-primary-foreground font-bold">
                    {item.step}
                  </div>

                  <h3 className="text-xl font-semibold mt-6">
                    {item.title}
                  </h3>

                  <p className="text-sm text-muted-foreground mt-4 leading-relaxed">
                    {item.desc}
                  </p>

                  <div
                    className="mt-6 rounded-2xl overflow-hidden border border-border bg-background/50 cursor-pointer group"
                    onClick={() => setSelectedImage(item.image)}
                  >

                    <img
                      src={item.image}
                      alt={item.title}
                      className="w-full h-[220px] object-fill transition-transform duration-300 group-hover:scale-105"
                      loading="lazy"
                    />

                  </div>
                </div>
              </div>
            ))}
          </div>

         {/* SUBSCRIPTION WORKFLOW */}
<div className="relative overflow-hidden rounded-[36px] border border-border bg-gradient-to-br from-violet-500/5 via-background to-background dark:from-violet-500/10 p-10 md:p-14">

  {/* Background Glow */}
  <div className="absolute top-0 right-0 h-72 w-72 bg-violet-500/10 dark:bg-violet-500/20 blur-3xl rounded-full" />

  <div className="relative z-10">

    {/* Badge */}
    <div className="inline-flex items-center gap-2 rounded-full border border-violet-500/20 bg-violet-500/10 dark:bg-violet-500/15 text-violet-700 dark:text-violet-300 px-4 py-2 text-sm font-semibold mb-6 backdrop-blur-sm">
      <CreditCard className="h-4 w-4" />
      Subscription Workflow
    </div>

    {/* Title */}
    <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-8">

      <div>
        <h3 className="text-3xl md:text-4xl font-bold tracking-tight text-foreground">
          Upgrade and manage
          <span className="gradient-text block mt-2">
            your workspace easily
          </span>
        </h3>

        <p className="text-muted-foreground mt-5 text-lg max-w-2xl leading-relaxed">
          Users can upgrade subscriptions, manage billing,
          confirm recurring payments, and securely complete checkout
          through a smooth Stripe-powered workflow.
        </p>
      </div>

      {/* DETAILS BUTTON */}
      <Link
        to="/how-it-works"
        className="group inline-flex items-center justify-center gap-3 rounded-2xl gradient-primary text-white px-7 py-4 font-semibold shadow-lg hover:scale-[1.03] transition-all duration-300"
      >
        View Full Workflow
        <ArrowRight className="h-5 w-5 transition-transform duration-300 group-hover:translate-x-1" />
      </Link>
    </div>

    {/* MINI STEPS */}
    <div className="grid md:grid-cols-3 gap-6 mt-14">

      {subscriptionItems.map((item) => (
        <div
          key={item.step}
          className="rounded-3xl border border-border bg-background/60 dark:bg-white/[0.03] backdrop-blur-xl p-7 hover:border-violet-400/40 transition-all duration-300 shadow-[0_10px_40px_rgba(0,0,0,0.04)] dark:shadow-[0_10px_40px_rgba(0,0,0,0.35)]"
        >

          {/* Step Number */}
          <div className="gradient-primary h-12 w-12 rounded-2xl flex items-center justify-center text-primary-foreground font-bold mb-5 shadow-lg">
            {item.step}
          </div>

          {/* Title */}
          <h4 className="text-xl font-semibold text-foreground">
            {item.title}
          </h4>

          {/* Desc */}
          <p className="text-sm text-muted-foreground mt-4 leading-relaxed">
            {item.desc}
          </p>

          {/* IMAGE */}
          <div
            className="mt-6 rounded-2xl overflow-hidden border border-border bg-background/50 dark:bg-black/20 cursor-pointer group"
            onClick={() => setSelectedImage(item.image)}
          >

            <img
              src={item.image}
              alt={item.title}
              className="w-full h-[220px] object-fill transition-transform duration-300 group-hover:scale-105"
              loading="lazy"
            />

          </div>
        </div>
      ))}
    </div>

    {/* FOOTER NOTE */}
    <div className="mt-12 flex flex-col md:flex-row md:items-center md:justify-between gap-6 rounded-3xl border border-border bg-background/70 dark:bg-white/[0.03] backdrop-blur-xl p-6">

      <div>
        <h4 className="font-semibold text-lg text-foreground">
          Explore the complete platform workflow
        </h4>

        <p className="text-muted-foreground mt-2">
          We created a dedicated page explaining the full recording,
          upload, processing, sharing, and subscription experience in detail.
        </p>
      </div>

      <Link
        to="/how-it-works"
        className="inline-flex items-center gap-2 text-violet-600 dark:text-violet-400 font-semibold hover:text-violet-700 dark:hover:text-violet-300 transition-colors"
      >
        Continue reading
        <ArrowRight className="h-4 w-4" />
      </Link>

    </div>
  </div>
</div>
        </section>
      </Reveal>

      {/* IMAGE PREVIEW */}
      {selectedImage && (
        <div
          className="fixed inset-0 z-[9999] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setSelectedImage(null)}
        >

          <div
            className="relative max-w-6xl w-full"
            onClick={(e) => e.stopPropagation()}
          >

            <button
              onClick={() => setSelectedImage(null)}
              className="absolute -top-12 right-0 text-white hover:opacity-80 transition"
            >
              <X size={32} />
            </button>

            <img
              src={selectedImage}
              alt="Preview"
              className="w-full max-h-[90vh] object-contain rounded-2xl shadow-2xl"
            />

          </div>
        </div>
      )}
    </>
  );
}
