import PublicPageLayout from "@/components/PublicPageLayout";

export default function PrivacyPolicyPage() {
  return (
    <PublicPageLayout
      title="Privacy Policy"
      subtitle="How ScreenFlow collects, uses, and protects your information."
    >
      <div className="space-y-6 text-sm leading-6 text-muted-foreground">
        <section>
          <h2 className="text-lg font-semibold text-foreground mb-2">1. Information we collect</h2>
          <p>
            We collect account information such as your name, email, and authentication details. We also process
            recording metadata, workspace details, subscription data, and usage events needed to operate the platform.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-foreground mb-2">2. How we use your data</h2>
          <p>
            Data is used to provide recording features, upload and processing workflows, team collaboration, billing,
            notifications, abuse prevention, and product improvements.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-foreground mb-2">3. Sharing and third parties</h2>
          <p>
            We only share data with trusted service providers required for hosting, storage, analytics, and payments.
            We do not sell your personal information.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-foreground mb-2">4. Data retention</h2>
          <p>
            We retain account and workspace data while your account is active. Deleted recordings may remain in trash
            for a grace period before permanent deletion, in line with product behavior.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-foreground mb-2">5. Security</h2>
          <p>
            We apply reasonable technical and organizational controls to protect data in transit and at rest. No
            system is completely risk-free, so we continuously monitor and improve our safeguards.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-foreground mb-2">6. Contact</h2>
          <p>
            For privacy requests, contact us via the <a href="/contact" className="text-primary underline">Contact page</a>.
          </p>
        </section>
      </div>
    </PublicPageLayout>
  );
}
