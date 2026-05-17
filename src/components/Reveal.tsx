import { ReactNode, useEffect, useRef, useState } from "react";

export function Reveal({ children, from = "left" }: { children: ReactNode; from?: "left" | "right" }) {
  const ref = useRef<HTMLDivElement | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.15 }
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  const hiddenClass = from === "right" ? "translate-x-8" : "-translate-x-8";

  return (
    <div
      ref={ref}
      className={`transition-all duration-700 ease-out ${visible ? "opacity-100 translate-x-0" : `opacity-0 ${hiddenClass}`}`}
    >
      {children}
    </div>
  );
}