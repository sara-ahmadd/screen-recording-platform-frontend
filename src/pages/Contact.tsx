import PublicPageLayout from "@/components/PublicPageLayout";
import { Mail, MessageSquare, Clock } from "lucide-react";

export default function ContactPage() {
  return (
    <PublicPageLayout
      title="Contact"
      subtitle="Get support, ask product questions, or share feedback."
    >
      <div className="grid md:grid-cols-3 gap-4">
        <div className="glass rounded-xl p-4 border border-border/50">
          <Mail className="h-5 w-5 text-primary mb-2" />
          <h2 className="font-semibold mb-1">Email support</h2>
          <p className="text-sm text-muted-foreground">support@updates.therec.site</p>
        </div>
        <div className="glass rounded-xl p-4 border border-border/50">
          <MessageSquare className="h-5 w-5 text-primary mb-2" />
          <h2 className="font-semibold mb-1">General inquiries</h2>
          <p className="text-sm text-muted-foreground">hello@updates.therec.site</p>
        </div>
        <div className="glass rounded-xl p-4 border border-border/50">
          <Clock className="h-5 w-5 text-primary mb-2" />
          <h2 className="font-semibold mb-1">Response time</h2>
          <p className="text-sm text-muted-foreground">Usually within 1-2 business days</p>
        </div>
      </div>
    </PublicPageLayout>
  );
}
