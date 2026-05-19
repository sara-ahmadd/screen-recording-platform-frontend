import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { TRUST_FOOTER_LINKS } from "@/lib/trustLinks";

export default function Footer() {
  const { t } = useTranslation("common");

  return (
    <footer className="border-t border-border/50 py-8">
      <div className="max-w-[95%] mx-auto px-6 flex flex-wrap items-center justify-between gap-4">
        <p className="text-sm text-muted-foreground">
          {t("footer.copyright", { year: new Date().getFullYear() })}
        </p>
        <nav aria-label={t("footer.navAria", { defaultValue: "Footer" })} className="flex flex-wrap items-center gap-4 text-sm">
          {TRUST_FOOTER_LINKS.map((item) => (
            <Link
              key={item.href}
              to={item.href}
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              {t(item.labelKey)}
            </Link>
          ))}
        </nav>
      </div>
    </footer>
  );
}
