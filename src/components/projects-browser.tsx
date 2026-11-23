"use client";

import { useMemo, useState } from "react";
import { ProjectCase } from "@/components/project-case";
import { Reveal } from "@/components/reveal";
import { projects } from "@/lib/site";
import { cn } from "@/lib/utils";

export function ProjectsBrowser() {
  const sectors = useMemo(
    () => ["All sectors", ...Array.from(new Set(projects.map((p) => p.sector)))],
    []
  );
  const [filter, setFilter] = useState("All sectors");
  const shown =
    filter === "All sectors" ? projects : projects.filter((p) => p.sector === filter);

  return (
    <>
      <div className="flex flex-wrap items-center gap-2">
        {sectors.map((s) => {
          const count = s === "All sectors"
            ? projects.length
            : projects.filter((p) => p.sector === s).length;
          return (
            <button
              key={s}
              type="button"
              onClick={() => setFilter(s)}
              aria-pressed={filter === s}
              className={cn(
                "flex items-center gap-2.5 border px-4 py-2.5 text-sm font-bold uppercase tracking-wide transition-colors",
                filter === s
                  ? "border-foreground bg-foreground text-background"
                  : "border-border bg-background text-foreground/70 hover:border-foreground/40 hover:text-foreground"
              )}
            >
              {s}
              <span className={cn(
                "font-mono text-xs font-semibold tabular-nums",
                filter === s ? "text-brand-green" : "text-foreground/50"
              )}>
                {String(count).padStart(2, "0")}
              </span>
            </button>
          );
        })}
      </div>

      <div className="mt-10 space-y-8">
        {shown.map((p, i) => (
          <Reveal key={p.id} delay={i === 0 ? 0 : 80}>
            <ProjectCase p={p} index={projects.indexOf(p)} />
          </Reveal>
        ))}
      </div>
    </>
  );
}
