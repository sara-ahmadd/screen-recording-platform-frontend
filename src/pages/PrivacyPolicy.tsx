import PublicPageLayout from "@/components/PublicPageLayout";
import { 
  Database, 
  Cpu, 
  Share2, 
  Trash2, 
  Lock, 
  HelpCircle, 
  DollarSign,
  ArrowRight
} from "lucide-react";

export default function PrivacyPolicyPage() {
  const yearlyRefundDays = Number(import.meta.env.VITE_YEARLY_REFUND_WINDOW_DAYS || 7);
  
  return (
    <PublicPageLayout
      title="Privacy Policy"
      subtitle="How theRec collects, uses, and safeguards your workspace data."
    >
      <div className="max-w-full mx-auto space-y-10 text-muted-foreground">
        
        {/* BLOCK 1: COLLECTIONS */}
        <section className="glass rounded-3xl border border-border/50 p-8">
          <div className="flex items-center gap-3 mb-4">
            <Database className="h-5 w-5 text-violet-600 dark:text-violet-400" />
            <h2 className="text-2xl font-bold text-foreground tracking-tight">1. Information We Collect</h2>
          </div>
          <p className="leading-relaxed text-lg">
            We store core identity profiles such as your authenticated name, primary email address, and security credentials. To properly execute workflows across our infrastructure, we also capture dynamic video metadata, active workspace parameters, historical subscription statuses, and aggregate user interaction events.
          </p>
        </section>

        {/* BLOCK 2: HOW WE USE IT */}
        <section className="glass rounded-3xl border border-border/50 p-8">
          <div className="flex items-center gap-3 mb-4">
            <Cpu className="h-5 w-5 text-violet-600 dark:text-violet-400" />
            <h2 className="text-2xl font-bold text-foreground tracking-tight">2. Algorithmic Data Usage</h2>
          </div>
          <p className="leading-relaxed text-lg">
            Your telemetry and data feeds are applied explicitly to maintain browser-level recording captures, optimize automated encoding queues, route real-time workspace collaborations, settle subscription billing, emit critical event notifications, prevent automated platform abuse, and iterate code performance over time.
          </p>
        </section>

        {/* BLOCK 3: THIRD PARTIES */}
        <section className="glass rounded-3xl border border-border/50 p-8">
          <div className="flex items-center gap-3 mb-4">
            <Share2 className="h-5 w-5 text-violet-600 dark:text-violet-400" />
            <h2 className="text-2xl font-bold text-foreground tracking-tight">3. System Sharing & Third Parties</h2>
          </div>
          <p className="leading-relaxed text-lg">
            We operate under a strict baseline: <strong>we do not sell your personal files or telemetry.</strong> Data is strictly exposed to trusted third-party cloud infrastructure processors tasked with critical tasks like asset hosting, core storage replication, product analytics pipelines, and secure transaction handling.
          </p>
        </section>

        {/* BLOCK 4: RETENTION */}
        <section className="glass rounded-3xl border border-border/50 p-8">
          <div className="flex items-center gap-3 mb-4">
            <Trash2 className="h-5 w-5 text-violet-600 dark:text-violet-400" />
            <h2 className="text-2xl font-bold text-foreground tracking-tight">4. Data Lifecycle & Retention</h2>
          </div>
          <p className="leading-relaxed text-lg">
            Active workspace matrices are kept intact while your root account is marked open. When a video is intentionally sent to the trash container, our system maintains it for a temporary safety window to prevent accidental loss prior to running permanent database deletion cycles.
          </p>
        </section>

        {/* BLOCK 5: SECURITY */}
        <section className="glass rounded-3xl border border-border/50 p-8">
          <div className="flex items-center gap-3 mb-4">
            <Lock className="h-5 w-5 text-violet-600 dark:text-violet-400" />
            <h2 className="text-2xl font-bold text-foreground tracking-tight">5. Cryptographic Security Guards</h2>
          </div>
          <p className="leading-relaxed text-lg">
            We enforce modern technical configurations and access restrictions to lock down assets both during browser-to-cloud transit and while stored at-rest on storage partitions. While absolute internet zero-risk is mathematically impossible, we scale up our defenses systematically to outpace system vulnerabilities.
          </p>
        </section>

        {/* BLOCK 6: CONTACT LINK */}
        <section className="glass rounded-3xl border border-border/50 p-8">
          <div className="flex items-center gap-3 mb-4">
            <HelpCircle className="h-5 w-5 text-violet-600 dark:text-violet-400" />
            <h2 className="text-2xl font-bold text-foreground tracking-tight">6. Privacy & Compliance Requests</h2>
          </div>
          <p className="leading-relaxed text-lg flex items-center gap-2 flex-wrap">
            <span>To process structural data extractions, account erasures, or specialized privacy requests, route a request directly through our digital</span>
            <a href="/contact" className="text-violet-600 dark:text-violet-400 hover:underline font-medium inline-flex items-center gap-1">
              Contact Page <ArrowRight className="h-3.5 w-3.5" />
            </a>
          </p>
        </section>

        {/* BLOCK 7: REFUND TIER POLICY */}
        <section className="rounded-3xl border border-violet-500/20 bg-violet-500/[0.02] p-8 md:p-10">
          <div className="flex items-center gap-3 mb-5">
            <DollarSign className="h-5 w-5 text-violet-600 dark:text-violet-400" />
            <h2 className="text-2xl font-black text-foreground tracking-tight">7. Fair Refund Policy Matrix</h2>
          </div>

          <div className="space-y-4 text-lg leading-relaxed">
            <p>
              Standard monthly billing operations are non-refundable once the cycle goes live. However, annual contracts remain open for a partial refund evaluation within a strict window of <strong>{yearlyRefundDays} days</strong> following the payment timestamp, verified against basic misuse parameters.
            </p>
            <p className="bg-background/60 rounded-2xl border border-border/40 p-5 text-base">
              <span className="font-semibold text-foreground block mb-1 uppercase tracking-wider text-base text-violet-600 dark:text-violet-400">Important Provision Note:</span>
              Refund authorizations are automatically nullified if services have been heavily consumed. This includes extensive background cloud storage allocation, video encoding actions, multi-user workspace seats, or custom link provisioning. Requesting an account cancellation locks subsequent recurring renewal periods cleanly; it does not issue trailing partial balances for past active cycles.
            </p>
          </div>
        </section>

      </div>
    </PublicPageLayout>
  );
}