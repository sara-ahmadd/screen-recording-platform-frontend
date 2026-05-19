import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import Logo from "./Logo";
import ThemeToggle from "./ThemeToggle";
import LanguageSwitcher from "./LanguageSwitcher";
import { TRUST_FOOTER_LINKS } from "@/lib/trustLinks";

type PublicPageLayoutProps = {
  title: string;
  subtitle: string;
  footer?: boolean;
  /** When false, children must provide the page H1 (e.g. demo page). */
  showPageHeader?: boolean;
  children: ReactNode;
};

export function useHeaderLinks() {
  const { t } = useTranslation("common");
  return [
    { href: "/how-it-works", label: t("nav.howItWorks") },
    { href: "/demo", label: t("nav.demo") },
    { href: "/plans", label: t("nav.pricing") },
    { href: "/blogs", label: t("nav.blogs") },
    { href: "/about", label: t("nav.about") },
    { href: "/contact", label: t("nav.contact") },
    { href: "/terms-and-conditions", label: t("nav.termsConditions") },
    { href: "/privacy-policy", label: t("nav.securityPrivacy") },
  ];
}

export default function PublicPageLayout({
  title,
  subtitle,
  children,
  footer = true,
  showPageHeader = true,
}: PublicPageLayoutProps) {
  const { t } = useTranslation("common");
  const headerLinks = useHeaderLinks();
  const footerLinks = TRUST_FOOTER_LINKS.map((item) => ({
    href: item.href,
    label: t(item.labelKey),
  }));

  return (
    <div className="min-h-screen bg-background relative">
      <nav className="border-b border-border/50 backdrop-blur-sm sticky top-0 z-50 bg-background/80">
        <div className="max-w-[95%] mx-auto px-6 h-16 flex items-center justify-between gap-4">
          <Link to="/" className="flex items-center gap-2 shrink-0">
            <Logo imageClassName="h-auto" withText textClassName="font-bold" />
          </Link>
          <div className="hidden md:flex items-center gap-5">
            {headerLinks.map((item) => (
              <Link
                key={item.href}
                to={item.href}
                className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
              >
                {item.label}
              </Link>
            ))}
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <LanguageSwitcher className="h-9" />
            <ThemeToggle className="sticky h-9 w-9" />
            <Link to="/login">
              <Button variant="ghost">{t("actions.signIn")}</Button>
            </Link>
            <Link to="/register">
              <Button className="gradient-primary">{t("actions.getStarted")}</Button>
            </Link>
          </div>
        </div>
        <div className="md:hidden border-t border-border/40">
          <div className="max-w-[95%] mx-auto px-6 h-12 flex items-center gap-4 overflow-x-auto">
            {headerLinks.map((item) => (
              <Link
                key={item.href}
                to={item.href}
                className="text-sm font-medium whitespace-nowrap text-muted-foreground hover:text-foreground transition-colors"
              >
                {item.label}
              </Link>
            ))}
          </div>
        </div>
      </nav>

      <main className="max-w-[95%] mx-auto px-6 py-12 md:py-16">
        {showPageHeader && title ? (
          <section className="mb-8 text-start">
            <h1 className="text-3xl md:text-4xl font-bold tracking-tight">{title}</h1>
            {subtitle ? <p className="text-muted-foreground mt-3 text-lg leading-relaxed">{subtitle}</p> : null}
          </section>
        ) : null}
        <section className="glass rounded-2xl p-6 md:p-8">{children}</section>
      </main>

      {footer && (
        <footer className="border-t border-border/50 py-8">
          <div className="max-w-[95%] mx-auto px-6 flex flex-wrap items-center justify-between gap-4">
            <p className="text-sm text-muted-foreground">
              {t("footer.copyright", { year: new Date().getFullYear() })}
            </p>
            <div className="flex flex-wrap items-center gap-4 text-sm">
              {footerLinks.map((item) => (
                <Link
                  key={item.href}
                  to={item.href}
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  {item.label}
                </Link>
              ))}
            </div>
          </div>
        </footer>
      )}
    </div>
  );
}
