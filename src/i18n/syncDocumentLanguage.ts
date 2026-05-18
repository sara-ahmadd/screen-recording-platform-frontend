import { isRtlLanguage, type AppLanguage } from "./constants";

export function syncDocumentLanguage(lang: AppLanguage): void {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  root.lang = lang;
  root.dir = isRtlLanguage(lang) ? "rtl" : "ltr";
}
