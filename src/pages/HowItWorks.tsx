import { useState } from "react";
import { useTranslation } from "react-i18next";
import PublicPageLayout from "@/components/PublicPageLayout";
import SubscriptionWorkflow from "@/components/SubscriptionFlow";
import { Circle, CloudUpload, LoaderCircle, PlaySquare, LayoutGrid, X, ZoomIn } from "lucide-react";
import Footer from "@/components/Footer";
import { Link } from "react-router-dom";

export default function HowItWorksPage() {
  const { t } = useTranslation("marketing");
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  const steps = [
    {
      id: "01",
      title: t("howItWorks.step1Title"),
      topDesc: t("howItWorks.step1Top"),
      bottomDesc: t("howItWorks.step1Bottom"),
      icon: Circle,
    },
    {
      id: "02",
      title: t("howItWorks.step2Title"),
      topDesc: t("howItWorks.step2Top"),
      bottomDesc: t("howItWorks.step2Bottom"),
      icon: CloudUpload,
    },
    {
      id: "03",
      title: t("howItWorks.step3Title"),
      topDesc: t("howItWorks.step3Top"),
      bottomDesc: t("howItWorks.step3Bottom"),
      icon: LoaderCircle,
    },
    {
      id: "04",
      title: t("howItWorks.step4Title"),
      topDesc: t("howItWorks.step4Top"),
      bottomDesc: t("howItWorks.step4Bottom"),
      icon: PlaySquare,
    },
    {
      id: "05",
      title: t("howItWorks.step5Title"),
      topDesc: t("howItWorks.step5Top"),
      bottomDesc: t("howItWorks.step5Bottom"),
      icon: LayoutGrid,
    },
  ];

  return (
    <>
      <PublicPageLayout footer={false} title={t("howItWorks.pageTitle")} subtitle={t("howItWorks.pageSubtitle")}>
        <section className="mb-10 rounded-2xl border border-border/50 bg-muted/20 p-6 md:p-8">
          <h2 className="text-xl font-bold text-foreground">{t("howItWorks.introTitle")}</h2>
          <p className="mt-3 text-muted-foreground leading-relaxed">{t("howItWorks.introBody")}</p>
        </section>

        <section>
          <div className="max-w-full mx-auto grid md:grid-cols-5 gap-3 mb-14">
            {steps.map((step) => (
              <div key={step.id} className="text-center">
                <div className="h-14 w-14 rounded-full bg-gradient-to-r from-[#4F46E5] to-[#7C3AED] text-white flex items-center justify-center mx-auto font-bold text-lg shadow-lg transition-all duration-300">
                  {step.id}
                </div>
                <h3 className="font-extrabold text-[24px] text-foreground mt-6">{step.title}</h3>
                <p className="text-muted-foreground text-[15px] mt-4 leading-relaxed max-w-[270px] mx-auto">{step.topDesc}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="px-6">
          <div className="max-w-[1700px] mx-auto">
            <div
              onClick={() => setPreviewImage("/assets/how-it-works/full-workflow.png")}
              className="group relative rounded-[34px] overflow-hidden border border-border shadow-[0_20px_80px_rgba(0,0,0,0.08)] dark:shadow-[0_20px_80px_rgba(0,0,0,0.45)] cursor-pointer bg-background"
            >
              <img
                src="/assets/how-it-works/full-workflow.png"
                alt={t("howItWorks.preview")}
                className="w-full h-auto object-cover transition-all duration-500 group-hover:scale-[1.02]"
              />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 dark:group-hover:bg-black/40 transition-all duration-300 flex items-center justify-center">
                <div className="opacity-0 group-hover:opacity-100 transition-all duration-300 bg-white/90 dark:bg-black/70 backdrop-blur-xl rounded-full p-5 shadow-2xl">
                  <ZoomIn className="h-10 w-10 text-[#6C47FF] dark:text-violet-300" />
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="py-10">
          <div className="max-w-full mx-auto grid md:grid-cols-5 gap-7">
            {steps.map((step, index) => {
              const Icon = step.icon;
              return (
                <div
                  key={index}
                  className="rounded-[30px] border border-border bg-background/70 dark:bg-white/[0.03] backdrop-blur-xl p-7 shadow-[0_8px_30px_rgba(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgba(0,0,0,0.35)] hover:shadow-[0_12px_40px_rgba(108,71,255,0.08)] transition-all duration-300"
                >
                  <div className="h-16 w-16 rounded-2xl bg-violet-500/10 dark:bg-violet-500/15 flex items-center justify-center mb-7">
                    <Icon className="h-8 w-8 text-[#6C47FF] dark:text-violet-300" strokeWidth={2.2} />
                  </div>
                  <h3 className="text-[26px] font-black tracking-tight text-foreground leading-tight mb-5">
                    {step.id}. {step.title}
                  </h3>
                  <p className="text-muted-foreground text-[15px] leading-[1.9] font-medium">{step.bottomDesc}</p>
                </div>
              );
            })}
          </div>
        </section>
      </PublicPageLayout>
      <SubscriptionWorkflow />
      <section className="py-28 px-6">
        <div className="max-w-5xl mx-auto rounded-[40px] border border-border bg-gradient-to-b from-background to-violet-500/[0.03] dark:from-white/[0.02] dark:to-violet-500/[0.08] backdrop-blur-xl p-14 text-center shadow-[0_20px_80px_rgba(108,71,255,0.06)] dark:shadow-[0_20px_80px_rgba(0,0,0,0.35)]">
          <h2 className="text-4xl md:text-5xl font-black tracking-tight text-foreground">{t("howItWorks.recordStep")}</h2>
          <p className="text-muted-foreground text-lg mt-6 max-w-2xl mx-auto my-3">{t("howItWorks.componentSubtitle")}</p>
          <Link
            to="/record"
            className="inline-flex items-center justify-center mt-10 bg-gradient-to-r from-[#4F46E5] to-[#7C3AED] text-white px-10 py-5 rounded-2xl text-lg font-bold shadow-xl hover:scale-[1.03] transition-all duration-300"
          >
            {t("howItWorks.recordStep")}
          </Link>
        </div>
      </section>
      <Footer />
      {previewImage && (
        <div className="fixed inset-0 z-[9999] bg-black/80 backdrop-blur-sm flex items-center justify-center p-6">
          <button
            type="button"
            onClick={() => setPreviewImage(null)}
            className="absolute top-6 right-6 h-14 w-14 rounded-full bg-white text-black flex items-center justify-center shadow-2xl transition-all duration-300"
          >
            <X className="h-7 w-7" />
          </button>
          <img
            src={previewImage}
            alt={t("howItWorks.preview")}
            className="max-w-[95vw] max-h-[92vh] object-contain rounded-3xl shadow-[0_20px_120px_rgba(0,0,0,0.5)] animate-in fade-in zoom-in duration-300"
          />
        </div>
      )}
    </>
  );
}
