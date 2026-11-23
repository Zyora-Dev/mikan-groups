"use client";

import { useEffect, useState } from "react";
import { services } from "@/lib/site";
import { cn } from "@/lib/utils";

/** Sticky chip bar that tracks the service in view and jumps between them. */
export function ServiceJump() {
  const [active, setActive] = useState("");
  const [stuck, setStuck] = useState(false);

  useEffect(() => {
    const onScroll = () => {
      setStuck(window.scrollY > 520);
      const mid = window.innerHeight / 2;
      let best = "", dist = Infinity;
      services.forEach((s) => {
        const el = document.getElementById(s.id);
        if (!el) return;
        const r = el.getBoundingClientRect();
        const d = Math.abs(r.top + r.height / 2 - mid);
        if (d < dist) { dist = d; best = s.id; }
      });
      setActive(best);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div
      className={cn(
        "sticky top-36 z-30 border-y transition-colors duration-300",
        stuck ? "border-border bg-background/95 backdrop-blur-md" : "border-transparent bg-transparent"
      )}
    >
      <div className="container flex gap-2 overflow-x-auto py-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {services.map((s) => (
          <button
            key={s.id}
            type="button"
            onClick={() =>
              document.getElementById(s.id)?.scrollIntoView({ behavior: "smooth", block: "center" })
            }
            aria-current={active === s.id}
            className={cn(
              "flex shrink-0 items-center gap-2.5 border px-4 py-2.5 text-sm font-bold uppercase tracking-wide transition-colors",
              active === s.id
                ? "border-foreground bg-foreground text-background"
                : "border-border bg-background text-foreground/70 hover:border-foreground/40 hover:text-foreground"
            )}
          >
            <span className={cn(
              "font-mono text-xs font-semibold",
              active === s.id ? "text-brand-green" : "text-foreground/50"
            )}>
              {s.index}
            </span>
            {s.title}
          </button>
        ))}
      </div>
    </div>
  );
}
