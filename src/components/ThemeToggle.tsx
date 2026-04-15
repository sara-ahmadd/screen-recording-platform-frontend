import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Moon, Sun } from "lucide-react";

type Theme = "light" | "dark";

function resolveTheme(): Theme {
  const root = document.documentElement;
  if (root.classList.contains("dark")) return "dark";
  return "light";
}

export default function ThemeToggle() {
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
      className="fixed top-4 right-4 z-[60] rounded-full shadow-sm"
      onClick={toggleTheme}
      aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
      title={theme === "dark" ? "Light mode" : "Dark mode"}
    >
      {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
    </Button>
  );
}
