import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import PublicPageLayout from "@/components/PublicPageLayout";
import EditorialByline from "@/components/EditorialByline";
import {
  Mail,
  MessageSquare,
  Clock,
  MapPin,
  ArrowUpRight,
  MessageSquareReplyIcon,
  ShieldCheck,
} from "lucide-react";

export default function ContactPage() {
  const { t } = useTranslation(["marketing", "common"]);
  const phone = import.meta.env.VITE_CONTACT_PHONE || "+20 1211716865";
  const address =
    import.meta.env.VITE_CONTACT_ADDRESS ||
    "51 memfais - Bab sharqi - Alexandria, Egypt";

  const trustItems = ["contact.trust1", "contact.trust2", "contact.trust3"] as const;

  return (
    <PublicPageLayout title={t("marketing:contact.title")} subtitle={t("marketing:contact.subtitle")}>
      <div className="max-w-full mx-auto space-y-10">
        <section>
          {/* <h2 className="text-xl font-bold text-foreground">{t("marketing:contact.introTitle")}</h2> */}
          {/* <p className="mt-3 text-muted-foreground leading-relaxed">{t("marketing:contact.introBody")}</p> */}
        </section>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="glass rounded-2xl p-6 border border-border/50 flex flex-col justify-between group hover:border-violet-500/30 transition-all duration-300">
            <div>
              <div className="h-10 w-10 rounded-xl bg-violet-500/10 flex items-center justify-center mb-5">
                <Mail className="h-5 w-5 text-violet-600 dark:text-violet-400" />
              </div>
              <h3 className="font-bold text-lg text-foreground mb-1">{t("marketing:contact.support")}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{t("marketing:contact.supportDesc")}</p>
            </div>
            <a
              href="mailto:support@updates.therec.site"
              className="mt-6 text-sm font-semibold text-violet-600 dark:text-violet-400 inline-flex items-center gap-1 hover:underline"
            >
              support@updates.therec.site{" "}
              <ArrowUpRight className="h-3.5 w-3.5 opacity-0 group-hover:opacity-100 transition-opacity" />
            </a>
          </div>

          <div className="glass rounded-2xl p-6 border border-border/50 flex flex-col justify-between group hover:border-violet-500/30 transition-all duration-300">
            <div>
              <div className="h-10 w-10 rounded-xl bg-violet-500/10 flex items-center justify-center mb-5">
                <MessageSquare className="h-5 w-5 text-violet-600 dark:text-violet-400" />
              </div>
              <h3 className="font-bold text-lg text-foreground mb-1">{t("marketing:contact.general")}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{t("marketing:contact.generalDesc")}</p>
            </div>
            <a
              href="mailto:hello@updates.therec.site"
              className="mt-6 text-sm font-semibold text-violet-600 dark:text-violet-400 inline-flex items-center gap-1 hover:underline"
            >
              hello@updates.therec.site{" "}
              <ArrowUpRight className="h-3.5 w-3.5 opacity-0 group-hover:opacity-100 transition-opacity" />
            </a>
          </div>

          <div className="glass rounded-2xl p-6 border border-border/50 flex flex-col justify-between">
            <div>
              <div className="h-10 w-10 rounded-xl bg-violet-500/10 flex items-center justify-center mb-5">
                <Clock className="h-5 w-5 text-violet-600 dark:text-violet-400" />
              </div>
              <h3 className="font-bold text-lg text-foreground mb-1">{t("marketing:contact.sla")}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{t("marketing:contact.slaDesc")}</p>
            </div>
            <p className="mt-6 text-sm font-bold text-foreground bg-violet-500/10 rounded-lg px-3 py-1.5 w-fit">
              {t("marketing:contact.slaValue")}
            </p>
          </div>

          <div className="glass rounded-2xl p-6 border border-border/50 flex items-center gap-4 sm:col-span-1">
            <div className="h-10 w-10 shrink-0 rounded-xl bg-violet-500/10 flex items-center justify-center">
              <MessageSquareReplyIcon className="h-5 w-5 text-violet-600 dark:text-violet-400" />
            </div>
            <div>
              <h4 className="font-bold text-sm text-foreground">{t("marketing:contact.directLine")}</h4>
              <a
                className="text-sm text-violet-600 dark:text-violet-400 font-medium hover:underline tracking-wide"
                href={`https://wa.me/${phone.replace(/\s+/g, "")}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                {phone}
              </a>
            </div>
          </div>

          <div className="glass rounded-2xl p-6 border border-border/50 flex items-center gap-4 sm:col-span-2">
            <div className="h-10 w-10 shrink-0 rounded-xl bg-violet-500/10 flex items-center justify-center">
              <MapPin className="h-5 w-5 text-violet-600 dark:text-violet-400" />
            </div>
            <div>
              <h4 className="font-bold text-sm text-foreground">{t("marketing:contact.location")}</h4>
              <p className="text-sm text-muted-foreground font-medium">{address}</p>
            </div>
          </div>
        </div>

        <section className="glass rounded-2xl border border-border/50 p-6 md:p-8">
          <h2 className="text-xl font-bold text-foreground">{t("marketing:contact.businessTitle")}</h2>
          <p className="mt-3 text-muted-foreground leading-relaxed">{t("marketing:contact.businessBody")}</p>
          <p className="mt-4 text-sm text-muted-foreground">
            <Link to="/privacy-policy" className="text-violet-600 dark:text-violet-400 hover:underline">
              {t("common:nav.privacyPolicy")}
            </Link>
            {" · "}
            <Link to="/terms-and-conditions" className="text-violet-600 dark:text-violet-400 hover:underline">
              {t("common:nav.termsConditions")}
            </Link>
          </p>
        </section>

        <section className="glass rounded-2xl border border-border/50 p-6 md:p-8">
          <div className="flex items-center gap-2 mb-4">
            <ShieldCheck className="h-5 w-5 text-violet-600 dark:text-violet-400" />
            <h2 className="text-xl font-bold text-foreground">{t("marketing:contact.trustTitle")}</h2>
          </div>
          <ul className="space-y-2">
            {trustItems.map((key) => (
              <li key={key} className="flex items-start gap-2 text-muted-foreground text-sm">
                <span className="mt-2 h-1.5 w-1.5 rounded-full bg-violet-500 shrink-0" />
                {t(`marketing:${key}`)}
              </li>
            ))}
          </ul>
        </section>

        <EditorialByline />
      </div>
    </PublicPageLayout>
  );
}
