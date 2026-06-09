import React, { useMemo } from "react";
import { useTranslation } from "react-i18next";

const SubscriptionWorkflow: React.FC = () => {
  const { t } = useTranslation("marketing");

  const subscriptionSteps = useMemo(
    () =>
      (["01", "02", "03", "04", "05"] as const).map((id) => ({
        id,
        title: t(`subscriptionFlow.steps.${id}.title`),
        desc: t(`subscriptionFlow.steps.${id}.desc`),
      })),
    [t],
  );

  return (
    <>
      <section className="py-28 px-6 overflow-hidden bg-background">

        <div className="max-w-[1700px] mx-auto">

          {/* Heading */}
          <div className="text-center mb-20">

            <div className="inline-flex items-center rounded-full border border-violet-500/20 bg-violet-500/10 dark:bg-violet-500/15 px-5 py-2 text-sm font-semibold text-violet-700 dark:text-violet-300 mb-6 transition-all duration-300 backdrop-blur-sm">
              {t("subscriptionFlow.badge")}
            </div>

            <h2 className="text-4xl md:text-5xl font-black tracking-tight leading-[1.05] text-foreground">
              <span className="inline-block transition-all duration-300">
                {t("subscriptionFlow.headingPart1")}
              </span>

              <span className="text-[#6C47FF] dark:text-violet-400 inline-block transition-all duration-300">
                {" "}
                {t("subscriptionFlow.headingPart2")}
              </span>
            </h2>

            <p className="max-w-3xl mx-auto text-[20px] text-muted-foreground mt-8 leading-relaxed font-medium transition-all duration-300 hover:bg-background/80 dark:hover:bg-white/[0.03] hover:backdrop-blur-xl hover:p-4 hover:rounded-2xl">
              {t("subscriptionFlow.subtitle")}
            </p>
          </div>

          {/* FLOW IMAGE */}
          <div className="relative rounded-[34px] overflow-hidden border border-border shadow-[0_20px_80px_rgba(0,0,0,0.08)] dark:shadow-[0_20px_80px_rgba(0,0,0,0.45)] mb-24 bg-background">
            <img
              src="/assets/how-it-works/subscription-flow.png"
              alt={t("subscriptionFlow.imageAlt")}
              className="w-full h-auto object-cover"
            />
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
    </>
  );
};

export default SubscriptionWorkflow;