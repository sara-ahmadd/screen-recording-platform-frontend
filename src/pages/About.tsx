import { useTranslation } from "react-i18next";
import PublicPageLayout from "@/components/PublicPageLayout";
import {
  HeartHandshake,
  Lightbulb,
  MonitorPlay,
  ShieldCheck,
  Users,
  Rocket,
  Sparkles,
  CheckCircle2,
} from "lucide-react";
import EditorialByline from "@/components/EditorialByline";

export default function AboutPage() {
  const { t } = useTranslation("marketing");

  const whyProblems = ["about.whyProblem1", "about.whyProblem2", "about.whyProblem3"] as const;
  const focusItems = ["about.focus1", "about.focus2", "about.focus3", "about.focus4", "about.focus5"] as const;
  const withoutItems = ["about.without1", "about.without2", "about.without3"] as const;
  const audienceItems = [
    "about.audience1",
    "about.audience2",
    "about.audience3",
    "about.audience4",
    "about.audience5",
  ] as const;
  const expertiseItems = ["eeat.expertise1", "eeat.expertise2", "eeat.expertise3"] as const;

  const commitmentItems = [
    "about.commitment1",
    "about.commitment2",
    "about.commitment3",
    "about.commitment4",
  ] as const;

  return (
    <PublicPageLayout title={t("about.title")} subtitle={t("about.subtitle")}>
      <div className="max-w-full mx-auto space-y-10 md:space-y-12">
        <p className="text-muted-foreground leading-relaxed">{t("about.editorialNote")}</p>

        <section className="rounded-3xl border border-violet-500/20 bg-gradient-to-br from-violet-500/[0.06] to-transparent p-8 md:p-10">
          <div className="inline-flex items-center gap-2 rounded-full border border-violet-500/20 bg-violet-500/10 px-4 py-1.5 font-semibold uppercase tracking-wider text-violet-700 dark:text-violet-300 mb-6">
            <ShieldCheck className="h-3.5 w-3.5" />
            {t("about.transparencyTitle")}
          </div>
          <p className="text-lg leading-relaxed text-foreground font-medium">{t("about.transparencyBody")}</p>
          <p className="mt-6 text-muted-foreground leading-relaxed">{t("about.transparencyNote")}</p>
          <h4 className="mt-8 text-sm font-semibold uppercase tracking-wider text-violet-600 dark:text-violet-400">
            {t("about.commitmentTitle")}
          </h4>
          <ul className="mt-4 space-y-3">
            {commitmentItems.map((key) => (
              <li key={key} className="flex gap-3 text-muted-foreground">
                <CheckCircle2 className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                <span>{t(key)}</span>
              </li>
            ))}
          </ul>
        </section>

        {/* Why */}
        <section className="glass rounded-3xl border border-border/50 p-8 md:p-10 relative overflow-hidden">
          <div className="inline-flex items-center gap-2 rounded-full border border-violet-500/20 bg-violet-500/10 px-4 py-1.5  font-semibold uppercase tracking-wider text-violet-700 dark:text-violet-300 mb-6">
            <Lightbulb className="h-3.5 w-3.5" />
            {t("about.whyTitle")}
          </div>

          <p className="text-lg leading-relaxed text-muted-foreground">{t("about.whyIntro")}</p>

          <p className="mt-6 text-base font-medium text-foreground">{t("about.whyProblemLead")}</p>
          <ul className="mt-4 space-y-3">
            {whyProblems.map((key) => (
              <li key={key} className="flex items-start gap-3 text-muted-foreground">
                <span className="mt-2 flex h-2 w-2 shrink-0 rounded-full bg-violet-500" />
                <span className="leading-relaxed">{t(key)}</span>
              </li>
            ))}
          </ul>

          <p className="mt-6 text-lg leading-relaxed text-muted-foreground">{t("about.whyConclusion")}</p>
        </section>

        {/* Focus */}
        <section className="glass rounded-3xl border border-border/50 p-8 md:p-10">
          <div className="inline-flex items-center gap-2 rounded-full border border-violet-500/20 bg-violet-500/10 px-4 py-1.5  font-semibold uppercase tracking-wider text-violet-700 dark:text-violet-300 mb-6">
            <MonitorPlay className="h-3.5 w-3.5" />
            {t("about.focusTitle")}
          </div>

          <ul className="grid sm:grid-cols-2 gap-4">
            {focusItems.map((key) => (
              <li key={key} className="flex items-start gap-3 text-muted-foreground">
                <Sparkles className="h-4 w-4 shrink-0 mt-0.5 text-violet-600 dark:text-violet-400" />
                <span className="leading-relaxed">{t(key)}</span>
              </li>
            ))}
          </ul>

          <p className="mt-8 text-lg leading-relaxed text-muted-foreground border-t border-border/40 pt-8">
            {t("about.focusGoal")}
          </p>
        </section>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Independent */}
          <section className="glass rounded-3xl border border-border/50 p-8 flex flex-col">
            <div className="h-12 w-12 rounded-xl bg-violet-500/10 flex items-center justify-center mb-6">
              <ShieldCheck className="h-6 w-6 text-violet-600 dark:text-violet-300" />
            </div>
            <h3 className="text-2xl font-bold tracking-tight text-foreground">{t("about.independentTitle")}</h3>
            <p className="mt-4 text-muted-foreground leading-relaxed">{t("about.independentBody")}</p>
            <p className="mt-6 font-medium text-foreground">{t("about.independentLead")}</p>
            <ul className="mt-3 space-y-2">
              {withoutItems.map((key) => (
                <li key={key} className="flex items-center gap-2 text-muted-foreground">
                  <span className="h-1.5 w-1.5 rounded-full bg-violet-500" />
                  {t(key)}
                </li>
              ))}
            </ul>
          </section>

          {/* Audience */}
          <section className="glass rounded-3xl border border-border/50 p-8 flex flex-col">
            <div className="h-12 w-12 rounded-xl bg-violet-500/10 flex items-center justify-center mb-6">
              <Users className="h-6 w-6 text-violet-600 dark:text-violet-300" />
            </div>
            <h3 className="text-2xl font-bold tracking-tight text-foreground">{t("about.audienceTitle")}</h3>
            <p className="mt-4 font-medium text-foreground">{t("about.audienceLead")}</p>
            <ul className="mt-3 space-y-2">
              {audienceItems.map((key) => (
                <li key={key} className="flex items-center gap-2 text-muted-foreground">
                  <span className="h-1.5 w-1.5 rounded-full bg-violet-500" />
                  {t(key)}
                </li>
              ))}
            </ul>
            <p className="mt-6 text-muted-foreground leading-relaxed text-sm">{t("about.audienceClosing")}</p>
          </section>
        </div>

        <section className="glass rounded-3xl border border-border/50 p-8 md:p-10">
          <h3 className="text-2xl font-bold tracking-tight text-foreground">{t("eeat.aboutTeamTitle")}</h3>
          <p className="mt-4 text-muted-foreground leading-relaxed">{t("eeat.aboutTeamBody")}</p>
          <h4 className="mt-8 text-sm font-semibold uppercase tracking-wider text-violet-600 dark:text-violet-400">
            {t("eeat.expertiseTitle")}
          </h4>
          <ul className="mt-4 space-y-3">
            {expertiseItems.map((key) => (
              <li key={key} className="flex gap-3 text-muted-foreground">
                <CheckCircle2 className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                <span>{t(key)}</span>
              </li>
            ))}
          </ul>
        </section>

        <EditorialByline />

        {/* Evolution */}
        <section className="glass rounded-2xl border border-border/50 p-6 md:p-8 flex gap-4 items-start">
          <Rocket className="h-5 w-5 text-violet-600 dark:text-violet-400 shrink-0 mt-1" />
          <div>
            <h4 className="font-bold text-lg text-foreground mb-2">{t("about.evolutionTitle")}</h4>
            <p className="text-muted-foreground leading-relaxed">{t("about.evolutionBody")}</p>
          </div>
        </section>

        {/* Thanks */}
        <div className="rounded-3xl border border-violet-500/20 bg-gradient-to-br from-violet-500/[0.06] to-transparent p-8 md:p-10 text-center max-w-3xl mx-auto">
          <HeartHandshake className="h-8 w-8 text-violet-600 dark:text-violet-400 mx-auto mb-4" />
          <p className="text-lg font-semibold text-foreground">{t("about.closingThanks")}</p>
        </div>
      </div>
    </PublicPageLayout>
  );
}
