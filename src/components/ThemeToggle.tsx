import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Moon, Sun } from "lucide-react";
import { cn } from "@/lib/utils";

type Theme = "light" | "dark";

function resolveTheme(): Theme {
  const root = document.documentElement;
  if (root.classList.contains("dark")) return "dark";
  return "light";
}

type ThemeToggleProps = {
  className?: string;
};

export default function ThemeToggle({ className }: ThemeToggleProps) {
  const { t } = useTranslation("layout");
  const [theme, setTheme] = useState<Theme>("light");

  useEffect(() => {
    setTheme(resolveTheme());
  }, []);

  const toggleTheme = () => {
    const nextTheme: Theme = theme === "dark" ? "light" : "dark";
    const useDark = nextTheme === "dark";
    document.documentElement.classList.toggle("dark", useDark);
    localStorage.setItem("theme", nextTheme);
    setTheme(nextTheme);
  };

  return (
    <Button
      type="button"
      size="icon"
      variant="outline"
      className={cn("fixed top-4 right-4 z-[60] rounded-full shadow-sm", className)}
      onClick={toggleTheme}
      aria-label={theme === "dark" ? t("theme.switchToLight") : t("theme.switchToDark")}
      title={theme === "dark" ? t("theme.lightMode") : t("theme.darkMode")}
    >
      {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
    </Button>
  );
}
