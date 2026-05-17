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
  return (
    <PublicPageLayout
      title="About theRec.site"
      subtitle="A modern screen recording platform built to replace bloat with speed."
    >
      <div className="max-w-full mx-auto space-y-12">

        {/* INTRO */}
        <div className="glass rounded-3xl border border-border/50 p-8 md:p-10 relative overflow-hidden">
          <div className="inline-flex items-center gap-2 rounded-full border border-violet-500/20 bg-violet-500/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-violet-700 dark:text-violet-300 mb-6">
            <HeartHandshake className="h-3.5 w-3.5" />
            Why theRec.site exists
          </div>

          <h2 className="text-3xl md:text-4xl font-black tracking-tight text-foreground leading-tight max-w-3xl">
            Built out of frustration with complex, enterprise-bloated video tools.
          </h2>

          <p className="mt-6 text-lg leading-relaxed text-muted-foreground">
            theRec.site started because I needed a screen recording platform that was instantly fast, highly reliable, and actually pleasant to use every single day. 
          </p>

          <p className="mt-4 text-lg leading-relaxed text-muted-foreground">
            Most tools on the market have become overly complicated, locked behind steep paywalls, or tuned exclusively for giant corporate sales teams. I wanted a lightweight, frictionless alternative built for high-velocity builders, creators, and teams who just need to:
          </p>

          <div className="mt-8 grid sm:grid-cols-2 gap-4 text-muted-foreground text-base font-medium">
            <div className="flex items-center gap-3">
              <span className="flex h-2 w-2 rounded-full bg-violet-500" />
              Launch records instantly right from the browser
            </div>
            <div className="flex items-center gap-3">
              <span className="flex h-2 w-2 rounded-full bg-violet-500" />
              Process and host high-def video automatically
            </div>
            <div className="flex items-center gap-3">
              <span className="flex h-2 w-2 rounded-full bg-violet-500" />
              Share instant-copy links with zero friction
            </div>
            <div className="flex items-center gap-3">
              <span className="flex h-2 w-2 rounded-full bg-violet-500" />
              Organize team communication in clean workspaces
            </div>
          </div>

          <p className="mt-8 text-lg leading-relaxed text-muted-foreground">
            Instead of waiting for someone else to fix the broken UX of modern video sharing, I decided to build the solution myself.
          </p>
        </div>

        {/* TRUST SECTION */}
        <div className="grid lg:grid-cols-2 gap-6">
          <div className="glass rounded-3xl border border-border/50 p-8 flex flex-col justify-between">
            <div>
              <div className="h-12 w-12 rounded-xl bg-violet-500/10 flex items-center justify-center mb-6">
                <ShieldCheck className="h-6 w-6 text-violet-600 dark:text-violet-300" />
              </div>

              <h3 className="text-2xl font-bold tracking-tight text-foreground">
                Radically transparent
              </h3>

              <p className="mt-4 text-muted-foreground leading-relaxed">
                theRec.site isn’t backed by aggressive venture capital or hidden corporate agendas. It is an independent platform focused purely on engineering a dependable, fast product for real people.
              </p>
            </div>

            <p className="mt-6 text-sm font-medium text-violet-600 dark:text-violet-400">
              The promise: No hidden catch. Just clear, honest software.
            </p>
          </div>

          <div className="glass rounded-3xl border border-border/50 p-8 flex flex-col justify-between">
            <div>
              <div className="h-12 w-12 rounded-xl bg-violet-500/10 flex items-center justify-center mb-6">
                <MonitorPlay className="h-6 w-6 text-violet-600 dark:text-violet-300" />
              </div>

              <h3 className="text-2xl font-bold tracking-tight text-foreground">
                Obsessed with UX speed
              </h3>

              <p className="mt-4 text-muted-foreground leading-relaxed">
                Every feature is designed to cut down your time-to-share. By removing confusing sub-menus, optimizing cloud rendering, and refining the recorder layout, your asynchronous workflows become effortless.
              </p>
            </div>

            <p className="mt-6 text-sm font-medium text-violet-600 dark:text-violet-400">
              Perfect for: Bug reports, tutorials, and rapid team updates.
            </p>
          </div>
        </div>

        {/* VALUES */}
        <div className="grid md:grid-cols-3 gap-6">
          <div className="glass rounded-2xl p-6 border border-border/50">
            <Rocket className="h-5 w-5 text-violet-600 dark:text-violet-400 mb-4" />
            <h4 className="font-bold text-lg text-foreground mb-2">
              Frictionless Workflows
            </h4>
            <p className="text-muted-foreground text-sm leading-relaxed">
              Capture, render, and deploy your video links seamlessly with minimal clicks.
            </p>
          </div>

          <div className="glass rounded-2xl p-6 border border-border/50">
            <Users className="h-5 w-5 text-violet-600 dark:text-violet-400 mb-4" />
            <h4 className="font-bold text-lg text-foreground mb-2">
              Async Collaboration
            </h4>
            <p className="text-muted-foreground text-sm leading-relaxed">
              Shared workspaces engineered specifically to keep modern distributed teams aligned.
            </p>
          </div>

          <div className="glass rounded-2xl p-6 border border-border/50">
            <Sparkles className="h-5 w-5 text-violet-600 dark:text-violet-400 mb-4" />
            <h4 className="font-bold text-lg text-foreground mb-2">
              Continuous Iteration
            </h4>
            <p className="text-muted-foreground text-sm leading-relaxed">
              Evolving aggressively based on actual community feedback and practical utility.
            </p>
          </div>
        </div>

        {/* FINAL MESSAGE */}
        <div className="rounded-3xl border border-violet-500/20 bg-gradient-to-br from-violet-500/[0.06] to-transparent p-8 md:p-10 text-center max-w-3xl mx-auto">
          <h2 className="text-2xl md:text-3xl font-black text-foreground tracking-tight">
            A communication tool built with care.
          </h2>

          <p className="mt-4 text-base leading-relaxed text-muted-foreground">
            No dynamic pricing traps. No unnecessary bells and whistles. Just an ultra-reliable platform focused entirely on helping you communicate clearly through instant video.
          </p>

          <p className="mt-6 text-sm font-semibold text-violet-600 dark:text-violet-400 tracking-wide uppercase">
            Thanks for being part of the journey.
          </p>
        </div>

      </div>
    </PublicPageLayout>
  );
}