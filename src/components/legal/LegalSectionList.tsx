import type { LucideIcon } from "lucide-react";

export type LegalSection = {
  icon: LucideIcon;
  title: string;
  paragraphs?: string[];
  list?: string[];
  footnote?: string;
  highlight?: boolean;
  example?: { title: string; body: string };
};

type LegalSectionListProps = {
  sections: LegalSection[];
};

export default function LegalSectionList({ sections }: LegalSectionListProps) {
  return (
    <div className="max-w-full mx-auto space-y-10 text-muted-foreground">
      {sections.map((section) => {
        const Icon = section.icon;
        const wrapperClass = section.highlight
          ? "rounded-3xl border border-violet-500/20 bg-violet-500/[0.02] p-8 md:p-10"
          : "glass rounded-3xl border border-border/50 p-8";

        return (
          <section key={section.title} className={wrapperClass}>
            <div className="flex items-center gap-3 mb-4">
              <Icon className="h-5 w-5 text-violet-600 dark:text-violet-400" />
              <h2 className="text-2xl font-bold text-foreground tracking-tight">{section.title}</h2>
            </div>
            <div className="space-y-4 text-lg leading-relaxed">
              {section.paragraphs?.map((paragraph) => (
                <p key={paragraph}>{paragraph}</p>
              ))}
              {section.list && section.list.length > 0 ? (
                <ul className="space-y-2.5 ps-2 text-base">
                  {section.list.map((item) => (
                    <li key={item} className="flex items-start gap-3">
                      <span className="h-1.5 w-1.5 rounded-full bg-violet-500 shrink-0 mt-2" />
                      {item}
                    </li>
                  ))}
                </ul>
              ) : null}
              {section.example ? (
                <div className="rounded-2xl border border-border/40 bg-background/60 p-5 space-y-2">
                  <h3 className="text-base font-bold text-foreground">{section.example.title}</h3>
                  <p className="text-base text-muted-foreground">{section.example.body}</p>
                </div>
              ) : null}
              {section.footnote ? (
                <p className="text-base font-medium text-foreground border-s-2 border-violet-500/30 ps-4 py-2 bg-violet-500/[0.03] rounded-r-lg">
                  {section.footnote}
                </p>
              ) : null}
            </div>
          </section>
        );
      })}
    </div>
  );
}
