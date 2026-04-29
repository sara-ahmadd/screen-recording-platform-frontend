import PublicPageLayout from "@/components/PublicPageLayout";
import { Rocket, Users, ShieldCheck } from "lucide-react";

export default function AboutPage() {
  return (
    <PublicPageLayout
      title="About theRec"
      subtitle="Built for teams that want faster communication through clear video."
    >
      <div className="space-y-6">
        <p className="text-sm leading-6 text-muted-foreground">
          theRec is a modern screen recording SaaS platform focused on speed, collaboration, and reliable video
          workflows. We help teams replace long meetings and unclear text threads with concise, visual updates.
        </p>

        <div className="grid md:grid-cols-3 gap-4">
          <div className="glass rounded-xl p-4 border border-border/50">
            <Rocket className="h-5 w-5 text-primary mb-2" />
            <h2 className="font-semibold mb-1">Fast creation</h2>
            <p className="text-sm text-muted-foreground">
              Record or upload quickly, then let processing and sharing happen seamlessly.
            </p>
          </div>
          <div className="glass rounded-xl p-4 border border-border/50">
            <Users className="h-5 w-5 text-primary mb-2" />
            <h2 className="font-semibold mb-1">Team-first workflows</h2>
            <p className="text-sm text-muted-foreground">
              Workspaces, permissions, and visibility settings support real collaboration.
            </p>
          </div>
          <div className="glass rounded-xl p-4 border border-border/50">
            <ShieldCheck className="h-5 w-5 text-primary mb-2" />
            <h2 className="font-semibold mb-1">Trusted sharing</h2>
            <p className="text-sm text-muted-foreground">
              Control access with private recordings or share links when needed.
            </p>
          </div>
        </div>
      </div>
    </PublicPageLayout>
  );
}
