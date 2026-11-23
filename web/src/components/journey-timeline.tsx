"use client";

import { useEffect, useRef, useState } from "react";
import { milestones } from "@/lib/site";
import { cn } from "@/lib/utils";

export function JourneyTimeline() {
  const [active, setActive] = useState(0);
  const listRef = useRef<HTMLOListElement>(null);
  const itemRefs = useRef<(HTMLLIElement | null)[]>([]);

  // highlight whichever milestone is nearest the middle of the viewport
  useEffect(() => {
    const onScroll = () => {
      const mid = window.innerHeight / 2;
      let best = 0, bestDist = Infinity;
      itemRefs.current.forEach((el, i) => {
        if (!el) return;
        const r = el.getBoundingClientRect();
        const d = Math.abs(r.top + r.height / 2 - mid);
        if (d < bestDist) { bestDist = d; best = i; }
      });
      setActive(best);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const pct = ((active + 1) / milestones.length) * 100;

  return (
    <div className="grid gap-12 lg:grid-cols-[0.8fr_1.2fr] lg:gap-20">
      <div className="lg:sticky lg:top-48 lg:self-start">
        <div className="flex items-center gap-3">
          <span className="h-px w-10 bg-brand-green" />
          <span className="text-sm font-bold uppercase tracking-[0.14em] text-brand-green">
            Our journey
          </span>
        </div>
        <h2 className="mt-6 text-balance font-display text-3xl font-700 uppercase leading-[1.05] text-foreground md:text-4xl">
          Five years,<br />three countries
        </h2>
        <p className="mt-6 text-lg leading-[1.7] text-foreground/80">
          From a steel detailing office in Tamil Nadu to a multidiscipline
          practice working across Asia-Pacific and Europe.
        </p>

        {/* year chips */}
        <div className="mt-9 flex flex-wrap gap-2">
          {milestones.map((m, i) => (
            <button
              key={m.year}
              type="button"
              onClick={() =>
                itemRefs.current[i]?.scrollIntoView({ behavior: "smooth", block: "center" })
              }
              aria-current={i === active}
              className={cn(
                "border px-4 py-2 font-display text-base font-700 tabular-nums transition-colors",
                i === active
                  ? "border-brand-green bg-brand-green text-white"
                  : "border-border bg-background text-foreground/70 hover:border-brand-green/50 hover:text-foreground"
              )}
            >
              {m.year}
            </button>
          ))}
        </div>
      </div>

      <ol ref={listRef} className="relative">
        {/* track + progress fill */}
        <span className="absolute left-0 top-0 h-full w-0.5 bg-border" aria-hidden="true" />
        <span
          className="absolute left-0 top-0 w-0.5 bg-brand-green transition-[height] duration-700 ease-out"
          style={{ height: `${pct}%` }}
          aria-hidden="true"
        />

        {milestones.map((m, i) => (
          <li
            key={m.year}
            ref={(el) => { itemRefs.current[i] = el; }}
            className="relative pb-12 pl-10 last:pb-0"
          >
            <span
              className={cn(
                "absolute -left-[7px] top-1.5 size-4 rounded-full border-4 border-background transition-all duration-500",
                i === active ? "scale-125 bg-brand-green" : "bg-border"
              )}
            />
            <div
              className={cn(
                "transition-all duration-500",
                i === active ? "opacity-100" : "opacity-55"
              )}
            >
              <p className="font-display text-2xl font-700 tabular-nums text-brand-green">
                {m.year}
              </p>
              <h3 className="mt-1.5 font-display text-xl font-700 uppercase leading-tight text-foreground">
                {m.title}
              </h3>
              <p className="mt-3 leading-relaxed text-foreground/80">{m.body}</p>
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}
