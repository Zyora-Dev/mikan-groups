"use client";

import { useState } from "react";
import { Briefcase, Check, ChevronDown, Clock, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { jobs } from "@/lib/site";
import { cn } from "@/lib/utils";

export function JobList({ onApply }: { onApply: (title: string) => void }) {
  const [open, setOpen] = useState<string | null>(jobs[0].id);

  return (
    <div className="space-y-4">
      {jobs.map((j) => {
        const isOpen = open === j.id;
        return (
          <article
            key={j.id}
            id={j.id}
            className={cn(
              "scroll-mt-44 border bg-card transition-colors duration-300",
              isOpen ? "border-foreground/25" : "border-border hover:border-foreground/20"
            )}
          >
            <button
              type="button"
              onClick={() => setOpen(isOpen ? null : j.id)}
              aria-expanded={isOpen}
              className="flex w-full items-start justify-between gap-6 p-7 text-left md:p-8"
            >
              <div className="min-w-0">
                <p className="text-sm font-bold uppercase tracking-wide text-brand-green">
                  {j.discipline}
                </p>
                <h3 className="mt-2 font-display text-2xl font-700 uppercase leading-tight text-foreground md:text-3xl">
                  {j.title}
                </h3>
                <p className="mt-3 max-w-2xl leading-relaxed text-foreground/80">
                  {j.summary}
                </p>

                <div className="mt-5 flex flex-wrap items-center gap-x-6 gap-y-2.5 text-sm font-semibold text-foreground/80">
                  <span className="flex items-center gap-2">
                    <MapPin className="size-4 text-brand-green" />{j.location}
                  </span>
                  <span className="flex items-center gap-2">
                    <Briefcase className="size-4 text-brand-green" />{j.type}
                  </span>
                  <span className="flex items-center gap-2">
                    <Clock className="size-4 text-brand-green" />{j.experience}
                  </span>
                </div>
              </div>

              <span
                className={cn(
                  "flex size-11 shrink-0 items-center justify-center border transition-all duration-300",
                  isOpen
                    ? "rotate-180 border-brand-green bg-brand-green text-white"
                    : "border-border text-foreground/60"
                )}
              >
                <ChevronDown className="size-5" />
              </span>
            </button>

            <div
              className={cn(
                "grid transition-[grid-template-rows] duration-500 ease-out",
                isOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
              )}
            >
              <div className="overflow-hidden">
                <div className="border-t border-border p-7 md:p-8">
                  <div className="grid gap-8 md:grid-cols-2">
                    <div>
                      <h4 className="text-sm font-bold uppercase tracking-wide text-foreground">
                        What you&apos;ll do
                      </h4>
                      <ul className="mt-4 grid gap-2.5">
                        {j.responsibilities.map((r) => (
                          <li key={r} className="flex items-start gap-3 text-sm font-medium">
                            <Check className="mt-0.5 size-3.5 shrink-0 text-brand-green" strokeWidth={3} />
                            <span className="text-foreground/90">{r}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <h4 className="text-sm font-bold uppercase tracking-wide text-foreground">
                        What we&apos;re looking for
                      </h4>
                      <ul className="mt-4 grid gap-2.5">
                        {j.requirements.map((r) => (
                          <li key={r} className="flex items-start gap-3 text-sm font-medium">
                            <Check className="mt-0.5 size-3.5 shrink-0 text-brand-green" strokeWidth={3} />
                            <span className="text-foreground/90">{r}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  <Button
                    onClick={() => onApply(j.title)}
                    className="group mt-8 h-12 rounded-none bg-brand-green px-7 font-semibold text-white hover:bg-brand-green/90"
                  >
                    Apply for this role
                    <ChevronDown className="ml-2.5 size-4 transition-transform group-hover:translate-y-0.5" />
                  </Button>
                </div>
              </div>
            </div>
          </article>
        );
      })}
    </div>
  );
}
