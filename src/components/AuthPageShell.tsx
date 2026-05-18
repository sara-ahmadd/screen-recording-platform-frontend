import type { ReactNode } from "react";
import LanguageSwitcher from "@/components/LanguageSwitcher";

type AuthPageShellProps = {
  children: ReactNode;
};

/** Centered auth card layout with language switcher (login, register, verify, etc.). */
export default function AuthPageShell({ children }: AuthPageShellProps) {
  return (
    <div className="min-h-screen relative bg-background">
      <div className="absolute top-4 end-4 z-10 flex">
        <LanguageSwitcher />
      </div>
      {children}
    </div>
  );
}
