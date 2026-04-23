import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { Monitor } from "lucide-react";
import { Button } from "@/components/ui/button";

type PublicPageLayoutProps = {
  title: string;
  subtitle: string;
  children: ReactNode;
};

const footerLinks = [
  { href: "/privacy-policy", label: "Privacy Policy" },
  { href: "/terms-and-conditions", label: "Terms & Conditions" },
  { href: "/contact", label: "Contact" },
  { href: "/about", label: "About" },
  { href: "/blogs", label: "Blogs" },
];

export default function PublicPageLayout({
  title,
  subtitle,
  children,
}: PublicPageLayoutProps) {
  return (
    <div className="min-h-screen bg-background">
      <nav className="border-b border-border/50 backdrop-blur-sm sticky top-0 z-50 bg-background/80">
        <div className="max-w-[95%] mx-auto px-6 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <div className="gradient-primary rounded-xl p-2">
              <Monitor className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="text-lg font-bold">ScreenFlow</span>
          </Link>
          <div className="flex items-center gap-2">
            <Link to="/login">
              <Button variant="ghost">Sign in</Button>
            </Link>
            <Link to="/register">
              <Button className="gradient-primary">Get Started</Button>
            </Link>
          </div>
        </div>
      </nav>

      <main className="max-w-[95%] mx-auto px-6 py-12 md:py-16">
        <section className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight">{title}</h1>
          <p className="text-muted-foreground mt-3">{subtitle}</p>
        </section>
        <section className="glass rounded-2xl p-6 md:p-8">{children}</section>
      </main>

      <footer className="border-t border-border/50 py-8">
        <div className="max-w-[95%] mx-auto px-6 flex flex-wrap items-center justify-between gap-4">
          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} ScreenFlow. All rights reserved.
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
    </div>
  );
}
