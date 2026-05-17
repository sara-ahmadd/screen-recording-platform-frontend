import PublicPageLayout from "@/components/PublicPageLayout";
import { Mail, MessageSquare, Clock, Phone, MapPin, ArrowUpRight } from "lucide-react";

export default function ContactPage() {
 const phone = import.meta.env.VITE_CONTACT_PHONE || "+20 1211716865";
  const address =
    import.meta.env.VITE_CONTACT_ADDRESS ||
    "51 memfais - Bab sharqi - Alexandria, Egypt";
  return (
    <PublicPageLayout
      title="Contact Our Team"
      subtitle="Connect with engineering support, pitch operational feedback, or register account inquiries."
    >
      <div className="max-w-full mx-auto">
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          
          {/* CARD 1: EMAIL SUPPORT */}
          <div className="glass rounded-2xl p-6 border border-border/50 flex flex-col justify-between group hover:border-violet-500/30 transition-all duration-300">
            <div>
              <div className="h-10 w-10 rounded-xl bg-violet-500/10 flex items-center justify-center mb-5">
                <Mail className="h-5 w-5 text-violet-600 dark:text-violet-400" />
              </div>
              <h3 className="font-bold text-lg text-foreground mb-1">Technical Support</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Reach out for active platform issues, workspace account lockouts, or video processing glitches.
              </p>
            </div>
            <a 
              href="mailto:support@updates.therec.site" 
              className="mt-6 text-sm font-semibold text-violet-600 dark:text-violet-400 inline-flex items-center gap-1 hover:underline"
            >
              support@updates.therec.site <ArrowUpRight className="h-3.5 w-3.5 opacity-0 group-hover:opacity-100 transition-opacity" />
            </a>
          </div>

          {/* CARD 2: INQUIRIES */}
          <div className="glass rounded-2xl p-6 border border-border/50 flex flex-col justify-between group hover:border-violet-500/30 transition-all duration-300">
            <div>
              <div className="h-10 w-10 rounded-xl bg-violet-500/10 flex items-center justify-center mb-5">
                <MessageSquare className="h-5 w-5 text-violet-600 dark:text-violet-400" />
              </div>
              <h3 className="font-bold text-lg text-foreground mb-1">General Inquiries</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Drop us a line regarding bulk workspace upgrades, enterprise discussions, or media collaborations.
              </p>
            </div>
            <a 
              href="mailto:hello@updates.therec.site" 
              className="mt-6 text-sm font-semibold text-violet-600 dark:text-violet-400 inline-flex items-center gap-1 hover:underline"
            >
              hello@updates.therec.site <ArrowUpRight className="h-3.5 w-3.5 opacity-0 group-hover:opacity-100 transition-opacity" />
            </a>
          </div>

          {/* CARD 3: RESPONSE TIMES */}
          <div className="glass rounded-2xl p-6 border border-border/50 flex flex-col justify-between">
            <div>
              <div className="h-10 w-10 rounded-xl bg-violet-500/10 flex items-center justify-center mb-5">
                <Clock className="h-5 w-5 text-violet-600 dark:text-violet-400" />
              </div>
              <h3 className="font-bold text-lg text-foreground mb-1">Expected SLA Response</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                We read every engineer ticket manually. Our response rate hovers between standard operational timelines.
              </p>
            </div>
            <p className="mt-6 text-sm font-bold text-foreground bg-violet-500/10 rounded-lg px-3 py-1.5 w-fit">
              Usually within 1–2 business days
            </p>
          </div>

          {/* CARD 4: PHONE (FULL WIDTH ON TIER OR ADJUSTED GRID) */}
          <div className="glass rounded-2xl p-6 border border-border/50 flex items-center gap-4 sm:col-span-1">
            <div className="h-10 w-10 shrink-0 rounded-xl bg-violet-500/10 flex items-center justify-center">
              <Phone className="h-5 w-5 text-violet-600 dark:text-violet-400" />
            </div>
            <div>
              <h4 className="font-bold text-sm text-foreground">Direct Line</h4>
              <a 
                href={`tel:${phone.replace(/\s+/g, "")}`} 
                className="text-sm text-violet-600 dark:text-violet-400 font-medium hover:underline tracking-wide"
              >
                {phone}
              </a>
            </div>
          </div>

          {/* CARD 5: ADDRESS */}
          <div className="glass rounded-2xl p-6 border border-border/50 flex items-center gap-4 sm:col-span-2">
            <div className="h-10 w-10 shrink-0 rounded-xl bg-violet-500/10 flex items-center justify-center">
              <MapPin className="h-5 w-5 text-violet-600 dark:text-violet-400" />
            </div>
            <div>
              <h4 className="font-bold text-sm text-foreground">Location</h4>
              <p className="text-sm text-muted-foreground font-medium">{address}</p>
            </div>
          </div>

        </div>
      </div>
    </PublicPageLayout>
  );
}