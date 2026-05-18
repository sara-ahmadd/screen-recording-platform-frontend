import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";

export default function Footer() {
  const { t } = useTranslation("common");
  const footerLinks = [
    { href: "/privacy-policy", label: t("nav.privacyPolicy") },
    { href: "/terms-and-conditions", label: t("nav.termsConditions") },
    { href: "/contact", label: t("nav.contact") },
    { href: "/about", label: t("nav.about") },
    { href: "/blogs", label: t("nav.blogs") },
    { href: "/how-it-works", label: t("nav.howItWorks") },
  ];

  return (
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
  );
}
