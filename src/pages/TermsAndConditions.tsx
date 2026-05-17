import PublicPageLayout from "@/components/PublicPageLayout";
import { 
  Shield, 
  Video, 
  Users2, 
  CreditCard, 
  Activity, 
  AlertTriangle, 
  RefreshCw, 
  Fingerprint 
} from "lucide-react";

export default function TermsAndConditionsPage() {
  return (
    <PublicPageLayout
      title="Terms & Conditions"
      subtitle="Clear parameters, fair billing rules, and mutual responsibilities for using theRec.site."
    >
      <div className="max-w-full mx-auto space-y-12 text-muted-foreground">

        {/* INTRO */}
        <section className="glass rounded-3xl border border-border/50 p-8 md:p-10">
          <div className="flex items-center gap-3 mb-5">
            <div className="h-10 w-10 rounded-xl bg-violet-500/10 flex items-center justify-center">
              <Fingerprint className="h-5 w-5 text-violet-600 dark:text-violet-400" />
            </div>
            <h2 className="text-3xl font-black text-foreground tracking-tight">
              Welcome to theRec.site
            </h2>
          </div>

          <p className="leading-relaxed text-lg">
            These Terms & Conditions outline the operational rules, user responsibilities, and clear policies governing theRec.site—including subscriptions, automated billing systems, content usage, and system access layers.
          </p>

          <p className="leading-relaxed text-lg mt-4">
            theRec.site is an independently engineered screen recording and sync-video platform built to streamline recording distribution, workspace asset organization, and remote collaboration. By authenticating or utilizing the platform, you implicitly agree to these formalized terms.
          </p>
        </section>

        {/* SERVICE USAGE */}
        <section className="glass rounded-3xl border border-border/50 p-8">
          <div className="flex items-center gap-3 mb-6">
            <Shield className="h-5 w-5 text-violet-600 dark:text-violet-400" />
            <h2 className="text-2xl font-bold text-foreground tracking-tight">
              1. Acceptable Service Usage
            </h2>
          </div>

          <div className="space-y-5 text-base leading-relaxed">
            <p>
              You agree to utilize theRec.site responsibly, lawfully, and in strict accordance with your local and international compliance regulations.
            </p>

            <p>
              Account owners retain full liability for all activity conducted through their authenticated instances. This includes active background recording pipelines, cloud uploads, workspace administration, programmatic share links, and team access credentials.
            </p>

            <div className="bg-background/40 border border-border/40 rounded-2xl p-5 space-y-3">
              <p className="font-semibold text-foreground text-sm uppercase tracking-wider text-violet-600 dark:text-violet-400">
                Prohibited platform activities include:
              </p>
              <ul className="space-y-2.5 text-sm font-medium">
                <li className="flex items-start gap-2.5">
                  <span className="text-red-500 font-bold mt-0.5">✕</span>
                  Distributing malicious payloads, ransomware, or destructive scripts.
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="text-red-500 font-bold mt-0.5">✕</span>
                  Violating proprietary copyright laws or unlicensed intellectual property.
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="text-red-500 font-bold mt-0.5">✕</span>
                  Hosting, processing, or transmitting abusive, exploitative, or explicitly illegal video content.
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="text-red-500 font-bold mt-0.5">✕</span>
                  Artificially abusing backend cloud storage allocations, CDNs, or processing infrastructures.
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="text-red-500 font-bold mt-0.5">✕</span>
                  Attempting unauthorized systemic breach, reverse engineering, or scraping user data.
                </li>
              </ul>
            </div>

            <p className="text-sm">
              theRec.site reserves the baseline right to restrict, suspend, or permanently terminate accounts found violating these platform safety rules or threatening global system infrastructure performance.
            </p>
          </div>
        </section>

        {/* CONTENT OWNERSHIP */}
        <section className="glass rounded-3xl border border-border/50 p-8">
          <div className="flex items-center gap-3 mb-6">
            <Video className="h-5 w-5 text-violet-600 dark:text-violet-400" />
            <h2 className="text-2xl font-bold text-foreground tracking-tight">
              2. Content Ownership & Data Privacy
            </h2>
          </div>

          <div className="space-y-5 text-base leading-relaxed">
            <p>
              <strong>You own your data.</strong> You retain complete intellectual property, distribution rights, and legal ownership over all video assets, audio captures, frame records, canvas configurations, and metadata generated via theRec.site.
            </p>

            <p>
              theRec.site is only granted minimal machine permissions required to safely run the SaaS infrastructure:
            </p>

            <ul className="space-y-2.5 pl-2 text-sm">
              <li className="flex items-center gap-3">
                <span className="h-1.5 w-1.5 rounded-full bg-violet-500" />
                Secure data-at-rest storage and distribution orchestration.
              </li>
              <li className="flex items-center gap-3">
                <span className="h-1.5 w-1.5 rounded-full bg-violet-500" />
                Server-side optimization, cloud encoding, and frame delivery optimization.
              </li>
              <li className="flex items-center gap-3">
                <span className="h-1.5 w-1.5 rounded-full bg-violet-500" />
                Dynamic timeline thumbnail extraction and stream formatting.
              </li>
              <li className="flex items-center gap-3">
                <span className="h-1.5 w-1.5 rounded-full bg-violet-500" />
                Execution of user-triggered sharing protocols and access controls.
              </li>
            </ul>

            <p>
              theRec.site will never claim ownership over your media assets, nor will we monitor, expose, sell, or monetize your private workspace videos or telemetry.
            </p>
          </div>
        </section>

        {/* WORKSPACES */}
        <section className="glass rounded-3xl border border-border/50 p-8">
          <div className="flex items-center gap-3 mb-6">
            <Users2 className="h-5 w-5 text-violet-600 dark:text-violet-400" />
            <h2 className="text-2xl font-bold text-foreground tracking-tight">
              3. Collaborative Workspaces & Access Control
            </h2>
          </div>

          <div className="space-y-5 text-base leading-relaxed">
            <p>
              Workspace administrators assume direct authority over internal group ecosystems. This incorporates the administration of email invitations, role-based configuration flags, file visibility settings, and historical seat deletions.
            </p>

            <p>
              By converting a workspace clip visibility token to "Public" or "Anyone with the link," you explicitly understand that external third parties may parse or stream that content.
            </p>

            <p className="text-sm font-medium border-l-2 border-amber-500/50 pl-4 bg-amber-500/[0.02] py-2 text-foreground">
              It is the sole responsibility of individual workspace administrators to audited video permissions before publishing URLs housing private or confidential system records.
            </p>
          </div>
        </section>

        {/* SUBSCRIPTIONS */}
        <section className="glass rounded-3xl border border-violet-500/20 bg-violet-500/[0.02] p-8 md:p-10">
          <div className="flex items-center gap-3 mb-6">
            <CreditCard className="h-5 w-5 text-violet-600 dark:text-violet-400" />
            <h2 className="text-2xl font-bold text-foreground tracking-tight">
              4. Subscriptions, Tier Scaling & Billing Cycles
            </h2>
          </div>

          <div className="space-y-6 text-base leading-relaxed">
            <p>
              theRec.site employs tiers spanning zero-cost limits and premium paid capabilities. Functional parameters like concurrent clip limits, max continuous recording lengths, aggregate cloud object storage caps, and multi-seat capabilities rely strictly on your active plan matrix.
            </p>

            {/* UPGRADE */}
            <div className="rounded-2xl border border-border/40 bg-background/80 p-6 shadow-sm">
              <h3 className="text-lg font-bold text-foreground mb-2 flex items-center gap-2">
                <span className="text-emerald-500">↑</span> Upgrading Your Tier
              </h3>
              <p className="text-sm text-muted-foreground">
                Upgrades take effect instantaneously. When adjusting your subscription level mid-billing cycle, our integration logic applies accurate, down-to-the-day proration charges. You only pay the direct marginal difference for the remainder of your active subscription window.
              </p>
            </div>

            {/* DOWNGRADE */}
            <div className="rounded-2xl border border-border/40 bg-background/80 p-6 shadow-sm">
              <h3 className="text-lg font-bold text-foreground mb-2 flex items-center gap-2">
                <span className="text-amber-500">↓</span> Downgrading Your Tier
              </h3>
              <p className="text-sm text-muted-foreground space-y-3">
                <span>
                  Downgrades do not disrupt mid-cycle workflows. If you move to a lower price point or the base Free tier, your current premium capabilities persist undisturbed until the active pre-paid billing cycle concludes.
                </span>
                <span className="block mt-2">
                  At the scheduled renewal boundary, the platform scales back system limits to align with your newly selected operational budget automatically. No auxiliary penalties, transaction fees, or downgrade surcharges are assessed.
                </span>
              </p>
            </div>

            {/* RENEWALS */}
            <div className="rounded-2xl border border-border/40 bg-background/80 p-6 shadow-sm">
              <h3 className="text-lg font-bold text-foreground mb-2 flex items-center gap-2">
                <RefreshCw className="h-4 w-4 text-violet-500" /> Subscription Renewals
              </h3>
              <p className="text-sm text-muted-foreground">
                All monthly and annual recurring paid models default to auto-renewal processing. To cease future automated merchant invoices, you must initiate cancellation inside your billing panel before your next billing cycle date kicks off.
              </p>
            </div>

            <p className="text-sm italic">
              Payment tokenization, security keys, and merchant transactions are processed entirely off-site via Stripe. theRec.site infrastructure does not write, parse, or keep unencrypted raw cardholder credentials on site.
            </p>
          </div>
        </section>

        {/* AVAILABILITY */}
        <section className="glass rounded-3xl border border-border/50 p-8">
          <div className="flex items-center gap-3 mb-6">
            <Activity className="h-5 w-5 text-violet-600 dark:text-violet-400" />
            <h2 className="text-2xl font-bold text-foreground tracking-tight">
              5. Service Uptime & Infrastructure Stability
            </h2>
          </div>

          <div className="space-y-5 text-base leading-relaxed">
            <p>
              theRec.site works tirelessly to maintain modern high-availability infrastructure targets, fast encoding tasks, and reliable global asset delivery streams.
            </p>

            <p>
              However, unexpected systemic service disruptions or performance degradation may intermittently occur during:
            </p>

            <ul className="space-y-2 pl-2 text-sm">
              <li className="flex items-center gap-3.5">
                <span className="h-1 w-2 rounded-full bg-violet-400" />
                Scheduled maintenance updates and core framework adjustments.
              </li>
              <li className="flex items-center gap-3.5">
                <span className="h-1 w-2 rounded-full bg-violet-400" />
                Upstream hosting provider hardware faults or third-party web outages.
              </li>
              <li className="flex items-center gap-3.5">
                <span className="h-1 w-2 rounded-full bg-violet-400" />
                Emergency patches targeting critical security vulnerabilities.
              </li>
            </ul>

            <p className="text-sm">
              While engineering redundancies are deployed to curb downtime, theRec.site does not contractually warrant flawless, zero-error service windows across all geographic connections.
            </p>
          </div>
        </section>

        {/* LIABILITY */}
        <section className="glass rounded-3xl border border-border/50 p-8">
          <div className="flex items-center gap-3 mb-6">
            <AlertTriangle className="h-5 w-5 text-violet-600 dark:text-violet-400" />
            <h2 className="text-2xl font-bold text-foreground tracking-tight">
              6. Limitations of Liability
            </h2>
          </div>

          <div className="space-y-5 text-base leading-relaxed">
            <p>
              theRec.site services are rendered on an **"As-Is"** and **"As-Available"** functional basis.
            </p>

            <p>
              To the full baseline threshold authorized under active law, theRec.site disclaims liability for any indirect, operational, punitive, or fiscal performance damage scenarios arising from network interruptions, recording data drops, accidental clip destruction, admin workspace settings errors, or weak master password exploits.
            </p>

            <p className="text-sm font-semibold text-foreground">
              Teams handling critical production material are advised to download local backup archives of paramount recordings.
            </p>
          </div>
        </section>

        {/* CHANGES */}
        <section className="glass rounded-3xl border border-border/50 p-8">
          <h2 className="text-2xl font-bold text-foreground tracking-tight mb-5">
            7. Amendments to Operational Terms
          </h2>

          <div className="space-y-5 text-base leading-relaxed">
            <p>
              These specifications change iteratively alongside platform upgrades, product additions, international compliance adjustments, or foundational feature updates.
            </p>

            <p>
              Continuing platform access following published updates implies binding validation of the revised legal terms.
            </p>
          </div>
        </section>

        {/* FINAL NOTE */}
        <section className="rounded-3xl border border-violet-500/20 bg-gradient-to-br from-violet-500/[0.06] to-transparent p-8 text-center max-w-3xl mx-auto">
          <h2 className="text-2xl font-black text-foreground tracking-tight mb-3">
            Pure, Predictable Transparency.
          </h2>

          <p className="text-base leading-relaxed text-muted-foreground">
            Our goal is to keep legal terms completely logical, plan pricing structures plain and fair, and software behavior predictable for every builder, manager, and team on the platform.
          </p>
        </section>

      </div>
    </PublicPageLayout>
  );
}