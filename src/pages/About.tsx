import { useTranslation } from "react-i18next";
import PublicPageLayout from "@/components/PublicPageLayout";
import {
  Rocket,
  Users,
  ShieldCheck,
  HeartHandshake,
  MonitorPlay,
  Sparkles,
} from "lucide-react";

export default function AboutPage() {
  const { t } = useTranslation("marketing");

  const bullets = ["about.bullet1", "about.bullet2", "about.bullet3", "about.bullet4"] as const;
  const cards = [
    { icon: Rocket, titleKey: "about.card1Title", bodyKey: "about.card1Body" },
    { icon: Users, titleKey: "about.card2Title", bodyKey: "about.card2Body" },
    { icon: Sparkles, titleKey: "about.card3Title", bodyKey: "about.card3Body" },
  ] as const;

  return (
    <PublicPageLayout title={t("about.title")} subtitle={t("about.subtitle")}>
      <div className="max-w-full mx-auto space-y-12">
        <div className="glass rounded-3xl border border-border/50 p-8 md:p-10 relative overflow-hidden">
          <div className="inline-flex items-center gap-2 rounded-full border border-violet-500/20 bg-violet-500/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-violet-700 dark:text-violet-300 mb-6">
            <HeartHandshake className="h-3.5 w-3.5" />
            {t("about.whyTitle")}
          </div>

          <h2 className="text-3xl md:text-4xl font-black tracking-tight text-foreground leading-tight max-w-3xl">
            {t("about.whyBody")}
          </h2>

          <p className="mt-6 text-lg leading-relaxed text-muted-foreground">{t("about.intro1")}</p>

          <p className="mt-4 text-lg leading-relaxed text-muted-foreground">{t("about.intro2")}</p>

          <div className="mt-8 grid sm:grid-cols-2 gap-4 text-muted-foreground text-base font-medium">
            {bullets.map((key) => (
              <div key={key} className="flex items-center gap-3">
                <span className="flex h-2 w-2 rounded-full bg-violet-500" />
                {t(key)}
              </div>
            ))}
          </div>

          <p className="mt-8 text-lg leading-relaxed text-muted-foreground">{t("about.intro3")}</p>
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          <div className="glass rounded-3xl border border-border/50 p-8 flex flex-col justify-between">
            <div>
              <div className="h-12 w-12 rounded-xl bg-violet-500/10 flex items-center justify-center mb-6">
                <ShieldCheck className="h-6 w-6 text-violet-600 dark:text-violet-300" />
              </div>
              <h3 className="text-2xl font-bold tracking-tight text-foreground">{t("about.transparent")}</h3>
              <p className="mt-4 text-muted-foreground leading-relaxed">{t("about.transparentBody")}</p>
            </div>
            <p className="mt-6 text-sm font-medium text-violet-600 dark:text-violet-400">{t("about.promise")}</p>
          </div>

          <div className="glass rounded-3xl border border-border/50 p-8 flex flex-col justify-between">
            <div>
              <div className="h-12 w-12 rounded-xl bg-violet-500/10 flex items-center justify-center mb-6">
                <MonitorPlay className="h-6 w-6 text-violet-600 dark:text-violet-300" />
              </div>
              <h3 className="text-2xl font-bold tracking-tight text-foreground">{t("about.uxTitle")}</h3>
              <p className="mt-4 text-muted-foreground leading-relaxed">{t("about.uxBody")}</p>
            </div>
            <p className="mt-6 text-sm font-medium text-violet-600 dark:text-violet-400">{t("about.uxNote")}</p>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {cards.map(({ icon: Icon, titleKey, bodyKey }) => (
            <div key={titleKey} className="glass rounded-2xl p-6 border border-border/50">
              <Icon className="h-5 w-5 text-violet-600 dark:text-violet-400 mb-4" />
              <h4 className="font-bold text-lg text-foreground mb-2">{t(titleKey)}</h4>
              <p className="text-muted-foreground text-sm leading-relaxed">{t(bodyKey)}</p>
            </div>
          ))}
        </div>

        <div className="rounded-3xl border border-violet-500/20 bg-gradient-to-br from-violet-500/[0.06] to-transparent p-8 md:p-10 text-center max-w-3xl mx-auto">
          <h2 className="text-2xl md:text-3xl font-black text-foreground tracking-tight">
            {t("about.closingTitle")}
          </h2>
          <p className="mt-4 text-base leading-relaxed text-muted-foreground">{t("about.closingBody")}</p>
          <p className="mt-6 text-sm font-semibold text-violet-600 dark:text-violet-400 tracking-wide uppercase">
            {t("about.closingThanks")}
          </p>
        </div>
      </div>
    </PublicPageLayout>
  );
}
