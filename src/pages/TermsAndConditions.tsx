import PublicPageLayout from "@/components/PublicPageLayout";

export default function TermsAndConditionsPage() {
  return (
    <PublicPageLayout
      title="Terms & Conditions"
      subtitle="Rules and responsibilities for using ScreenFlow."
    >
      <div className="space-y-6 text-sm leading-6 text-muted-foreground">
        <section>
          <h2 className="text-lg font-semibold text-foreground mb-2">1. Service usage</h2>
          <p>
            By using ScreenFlow, you agree to use the platform lawfully and responsibly. You are responsible for all
            activity under your account and workspace.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-foreground mb-2">2. Content ownership</h2>
          <p>
            You retain ownership of your recordings and related content. You grant us a limited right to process and
            store that content solely to provide platform features.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-foreground mb-2">3. Workspace responsibilities</h2>
          <p>
            Workspace owners and admins are responsible for member invitations, access permissions, and shared content
            visibility settings.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-foreground mb-2">4. Subscriptions and billing</h2>
          <p>
            Paid features and limits depend on your active plan. Billing cycles, upgrades, and cancellations are
            handled according to the subscription terms shown during checkout.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-foreground mb-2">5. Prohibited behavior</h2>
          <p>
            You may not use ScreenFlow to violate laws, abuse infrastructure, distribute malware, or infringe rights
            of others. We may suspend access for serious violations.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-foreground mb-2">6. Limitation of liability</h2>
          <p>
            ScreenFlow is provided on an "as available" basis. To the extent permitted by law, we are not liable for
            indirect or consequential losses arising from service use.
          </p>
        </section>
      </div>
    </PublicPageLayout>
  );
}
