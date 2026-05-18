import { useTranslation } from "react-i18next";
import { ArrowLeft, Sparkles, Monitor, Share2, Layers } from "lucide-react";
import { Link } from "react-router-dom";
import PublicPageLayout from "@/components/PublicPageLayout";

const DEMO_VIDEO_SRC = "/assets/updated%20demo.mp4";

export default function DemoPage() {
  const { t } = useTranslation("marketing");

  return (
    <PublicPageLayout title={''} subtitle={''}>
      <div className="relative min-h-screen w-full bg-background text-foreground overflow-x-hidden antialiased selection:bg-violet-500/30">
      <div className="absolute inset-0 bg-noise opacity-[0.015] dark:opacity-[0.03] pointer-events-none z-50" />
      <div className="absolute top-[-10%] left-[-10%] h-[600px] w-[600px] rounded-full bg-violet-500/10 dark:bg-violet-500/[0.07] blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[10%] right-[-10%] h-[500px] w-[500px] rounded-full bg-fuchsia-500/10 dark:bg-fuchsia-500/[0.05] blur-[100px] pointer-events-none" />

      <main className="max-w-full mx-auto px-6 py-12 relative z-10">
        <div className="flex items-center justify-between mb-12">
          <Link
            to="/"
            className="group inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors duration-200"
          >
            <ArrowLeft className="h-4 w-4 transform group-hover:-translate-x-0.5 transition-transform" />
            {t("demo.backHome")}
          </Link>
          <div className="flex items-center gap-2 rounded-full border border-violet-500/20 bg-violet-500/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-violet-700 dark:text-violet-300">
            <Sparkles className="h-3.5 w-3.5 animate-pulse" />
            {t("demo.walkthrough")}
          </div>
        </div>

        <div className="max-w-3xl mb-10">
          <h1 className="text-4xl md:text-5xl font-black tracking-tight leading-none bg-gradient-to-r from-foreground via-foreground to-foreground/70 bg-clip-text text-transparent">
            {t("demo.seeAction")}
          </h1>
          <p className="mt-4 text-lg md:text-xl text-muted-foreground leading-relaxed">{t("demo.tour")}</p>
        </div>

        <div className="relative rounded-3xl border border-border/60 dark:border-white/[0.08] bg-white/[0.02] dark:bg-black/[0.15] backdrop-blur-xl p-3 md:p-4 shadow-2xl shadow-violet-500/[0.03] max-w-5xl mx-auto">
          <div className="absolute inset-0 rounded-3xl border border-gradient-to-br from-violet-500/20 to-transparent pointer-events-none" />
          <div className="relative aspect-video w-full rounded-2xl overflow-hidden bg-muted/30 group border border-border/40">
            <video
              className="h-full w-full object-fill bg-black"
              controls
              preload="metadata"
              playsInline
              autoPlay
              
            >
              <source src={DEMO_VIDEO_SRC} type="video/mp4" />
              {t("demo.noVideoTag")}
            </video>
            <div className="absolute top-4 left-4 bg-background/80 backdrop-blur-md border border-border/60 px-3 py-1.5 rounded-full text-xs font-semibold flex items-center gap-2 pointer-events-none">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-ping" />
              <span className="h-2 w-2 rounded-full bg-emerald-500 absolute left-3" />
              {t("demo.systemDemo")}
            </div>
          </div>
        </div>

        <div className="mt-16 border-t border-border/40 pt-12">
          <h2 className="text-2xl font-black tracking-tight text-foreground mb-8">{t("demo.journey")}</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="relative rounded-2xl border border-border/40 bg-white/[0.01] dark:bg-white/[0.002] backdrop-blur-md p-6 hover:border-violet-500/20 transition-all duration-300">
              <div className="h-10 w-10 rounded-xl bg-violet-500/10 flex items-center justify-center mb-4 border border-violet-500/10">
                <Monitor className="h-5 w-5 text-violet-600 dark:text-violet-400" />
              </div>
              <h3 className="font-bold text-lg text-foreground mb-2">1. {t("demo.init")}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{t("demo.initBody")}</p>
            </div>
            <div className="relative rounded-2xl border border-border/40 bg-white/[0.01] dark:bg-white/[0.002] backdrop-blur-md p-6 hover:border-violet-500/20 transition-all duration-300">
              <div className="h-10 w-10 rounded-xl bg-violet-500/10 flex items-center justify-center mb-4 border border-violet-500/10">
                <Layers className="h-5 w-5 text-violet-600 dark:text-violet-400" />
              </div>
              <h3 className="font-bold text-lg text-foreground mb-2">2. {t("demo.encoding")}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{t("demo.encodingBody")}</p>
            </div>
            <div className="relative rounded-2xl border border-border/40 bg-white/[0.01] dark:bg-white/[0.002] backdrop-blur-md p-6 hover:border-violet-500/20 transition-all duration-300">
              <div className="h-10 w-10 rounded-xl bg-violet-500/10 flex items-center justify-center mb-4 border border-violet-500/10">
                <Share2 className="h-5 w-5 text-violet-600 dark:text-violet-400" />
              </div>
              <h3 className="font-bold text-lg text-foreground mb-2">3. {t("demo.distribution")}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{t("demo.distributionBody")}</p>
            </div>
          </div>
        </div>

        <div className="mt-16 rounded-3xl border border-violet-500/20 bg-gradient-to-br from-violet-500/[0.05] via-transparent to-fuchsia-500/[0.02] p-8 md:p-10 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="max-w-xl text-center md:text-left">
            <h3 className="text-xl font-bold text-foreground tracking-tight">{t("demo.ready")}</h3>
            <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{t("demo.ctaBody")}</p>
          </div>
          <Link
            to="/dashboard"
            className="w-full md:w-auto text-center px-6 py-3 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-semibold text-sm shadow-lg shadow-violet-500/20 transition-all active:scale-[0.98]"
          >
            {t("demo.startFree")}
          </Link>
        </div>
      </main>
    </div>
    </PublicPageLayout>
  );
}
