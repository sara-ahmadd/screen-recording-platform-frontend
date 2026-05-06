import PublicPageLayout from "@/components/PublicPageLayout";
import { Mail, MessageSquare, Clock, Phone, MapPin } from "lucide-react";

export default function ContactPage() {
  const phone = import.meta.env.VITE_CONTACT_PHONE || "+20 1211716865";
  const address =
    import.meta.env.VITE_CONTACT_ADDRESS ||
    "51 memfais - Bab sharqi - Alexandria, Egypt";
  return (
    <PublicPageLayout
      title="Contact"
      subtitle="Get support, ask product questions, or share feedback."
    >
      <div className="grid md:grid-cols-2 lg:grid-cols-5 gap-4">
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
          <Phone className="h-5 w-5 text-primary mb-2" />
          <h2 className="font-semibold mb-1">Phone</h2>
          <a href={`tel:${phone.replace(/\s+/g, "")}`} className="text-sm text-primary underline">
            {phone}
          </a>
        </div>
        <div className="glass rounded-xl p-4 border border-border/50">
          <MapPin className="h-5 w-5 text-primary mb-2" />
          <h2 className="font-semibold mb-1">Address</h2>
          <p className="text-sm text-muted-foreground">{address}</p>
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
