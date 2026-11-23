"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { ArrowRight, Check, Cpu, Ruler } from "lucide-react";
import { Button } from "@/components/ui/button";
import { services } from "@/lib/site";
import { cn } from "@/lib/utils";

export function ServiceExplorer() {
  const [active, setActive] = useState(0);
  const sectionRefs = useRef<(HTMLDivElement | null)[]>([]);
  const s = services[active];

  // Track which service block is nearest the middle of the viewport.
  useEffect(() => {
    const onScroll = () => {
      const mid = window.innerHeight / 2;
      let best = 0, dist = Infinity;
      sectionRefs.current.forEach((el, i) => {
        if (!el) return;
        const r = el.getBoundingClientRect();
        const d = Math.abs(r.top + r.height / 2 - mid);
        if (d < dist) { dist = d; best = i; }
      });
      setActive(best);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div className="container">
      <div className="grid gap-12 lg:grid-cols-[0.95fr_1.05fr] lg:gap-16">
        {/* ============ Sticky visual panel ============ */}
        <div className="lg:sticky lg:top-56 lg:h-[32rem] lg:self-start">
          <div className="relative h-full min-h-[22rem] overflow-hidden border border-border">
            {services.map((svc, i) => (
              <Image
                key={svc.id}
                src={svc.image}
                alt={svc.title}
                fill
                sizes="(max-width: 1024px) 100vw, 46vw"
                priority={i === 0}
                className={cn(
                  "object-cover transition-all duration-700 ease-out",
                  i === active ? "scale-100 opacity-100" : "scale-105 opacity-0"
                )}
              />
            ))}
            <div className="absolute inset-0 bg-gradient-to-t from-neutral-950 via-neutral-950/35 to-neutral-950/10" />
            <span className={cn("absolute inset-x-0 bottom-0 h-1.5 transition-colors duration-500", s.accent)} />

            <div className="absolute inset-x-0 bottom-0 p-8">
              <div className="flex items-center gap-3">
                <span className="font-display text-5xl font-700 leading-none text-white/35">
                  {s.index}
                </span>
                <span className="h-px flex-1 bg-white/20" />
                <span className="text-sm font-bold uppercase tracking-wide text-brand-green">
                  {String(active + 1).padStart(2, "0")} / {String(services.length).padStart(2, "0")}
                </span>
              </div>

              <h3 className="mt-4 font-display text-3xl font-700 uppercase leading-tight text-white">
                {s.title}
              </h3>

              <div className="mt-5 grid gap-4 border-t border-white/15 pt-5 sm:grid-cols-2">
                <div>
                  <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-white/60">
                    <Cpu className="size-3.5 text-brand-green" /> Software
                  </p>
                  <p className="mt-2 text-sm font-semibold text-white/90">
                    {s.software.join(" · ")}
                  </p>
                </div>
                <div>
                  <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-white/60">
                    <Ruler className="size-3.5 text-brand-green" /> Standards
                  </p>
                  <p className="mt-2 font-mono text-sm font-semibold text-white/90">
                    {s.standards.join(" · ")}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* progress rail */}
          <div className="mt-5 hidden gap-1.5 lg:flex">
            {services.map((svc, i) => (
              <button
                key={svc.id}
                type="button"
                onClick={() =>
                  sectionRefs.current[i]?.scrollIntoView({ behavior: "smooth", block: "center" })
                }
                aria-label={`Go to ${svc.title}`}
                className="group flex-1 py-2"
              >
                <span className={cn(
                  "block h-1 transition-colors duration-300",
                  i === active ? "bg-brand-green" : "bg-border group-hover:bg-foreground/30"
                )} />
              </button>
            ))}
          </div>
        </div>

        {/* ============ Scrolling content ============ */}
        <div>
          {services.map((svc, i) => (
            <div
              key={svc.id}
              id={svc.id}
              ref={(el) => { sectionRefs.current[i] = el; }}
              className={cn(
                "scroll-mt-44 border-b border-border py-14 first:pt-0 last:border-0 last:pb-0 transition-opacity duration-500",
                i === active ? "opacity-100" : "opacity-60"
              )}
            >
              <div className="flex items-center gap-3">
                <span className={cn("h-px w-10 transition-colors duration-500",
                  i === active ? "bg-brand-green" : "bg-border")} />
                <span className="text-sm font-bold uppercase tracking-[0.14em] text-brand-green">
                  {svc.index} — {svc.title}
                </span>
              </div>

              <p className="mt-5 text-xl leading-[1.6] text-foreground/90">{svc.summary}</p>

              {/* process stages */}
              <ol className="mt-9 space-y-5">
                {svc.stages.map((st, k) => (
                  <li key={st.title} className="group flex gap-5">
                    <span className="flex size-9 shrink-0 items-center justify-center border border-border font-mono text-xs font-bold text-foreground/70 transition-colors group-hover:border-brand-green group-hover:bg-brand-green group-hover:text-white">
                      {k + 1}
                    </span>
                    <div className="border-b border-border pb-5 last:border-0">
                      <h4 className="font-display text-lg font-700 uppercase leading-tight text-foreground">
                        {st.title}
                      </h4>
                      <p className="mt-2 leading-relaxed text-foreground/80">{st.body}</p>
                    </div>
                  </li>
                ))}
              </ol>

              {/* deliverables */}
              <div className="mt-8 border border-border bg-secondary/40 p-6">
                <p className="text-sm font-bold uppercase tracking-wide text-foreground">
                  What you receive
                </p>
                <ul className="mt-4 grid gap-2.5 sm:grid-cols-2">
                  {svc.deliverables.map((d) => (
                    <li key={d} className="flex items-start gap-2.5 text-sm font-medium">
                      <Check className="mt-0.5 size-3.5 shrink-0 text-brand-green" strokeWidth={3} />
                      <span className="text-foreground/90">{d}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <Button asChild
                className="group mt-7 h-12 rounded-none bg-brand-green px-7 font-semibold text-white hover:bg-brand-green/90">
                <Link href="/contact">
                  Enquire about {svc.title}
                  <ArrowRight className="ml-2.5 size-4 transition-transform group-hover:translate-x-1" />
                </Link>
              </Button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
