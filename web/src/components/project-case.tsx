"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import {
  ArrowRight, Building2, Check, ChevronDown, MapPin, Target, TrendingUp, Wrench,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { projects } from "@/lib/site";
import { cn } from "@/lib/utils";

type Project = (typeof projects)[number];

const STAGES = [
  { key: "challenge", label: "The challenge", Icon: Target },
  { key: "approach", label: "Our approach", Icon: Wrench },
  { key: "outcome", label: "The outcome", Icon: TrendingUp },
] as const;

export function ProjectCase({ p, index }: { p: Project; index: number }) {
  const [stage, setStage] = useState(0);
  const [open, setOpen] = useState(false);
  const flip = index % 2 === 1;

  return (
    <article id={p.id} className="scroll-mt-44 border border-border bg-card">
      <div className={cn("grid lg:grid-cols-2", flip && "lg:[&>figure]:order-2")}>
        {/* ---- Image ---- */}
        <figure className="group relative aspect-[4/3] overflow-hidden lg:aspect-auto lg:min-h-[30rem]">
          <Image
            src={p.image}
            alt={p.title}
            fill
            sizes="(max-width: 1024px) 100vw, 50vw"
            className="object-cover transition-transform duration-[900ms] ease-out group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-neutral-950/85 via-neutral-950/15 to-transparent" />

          <span className="absolute left-6 top-6 bg-neutral-950/70 px-3 py-1.5 font-mono text-xs font-semibold text-white backdrop-blur-sm">
            {String(index + 1).padStart(2, "0")} / {String(projects.length).padStart(2, "0")}
          </span>

          <figcaption className="absolute inset-x-0 bottom-0 p-7">
            <p className="text-sm font-bold uppercase tracking-wide text-brand-green">
              {p.sector}
            </p>
            <h3 className="mt-2 font-display text-2xl font-700 uppercase leading-tight text-white md:text-3xl">
              {p.title}
            </h3>
            <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-1.5 text-sm font-semibold text-white/85">
              <span className="flex items-center gap-2">
                <MapPin className="size-3.5 text-brand-green" />{p.location}
              </span>
              <span className="flex items-center gap-2">
                <Building2 className="size-3.5 text-brand-green" />{p.year}
              </span>
            </div>
          </figcaption>
        </figure>

        {/* ---- Content ---- */}
        <div className="flex flex-col p-8 md:p-11">
          {/* Client */}
          <div>
            <p className="text-sm font-bold uppercase tracking-wide text-brand-green">
              The client
            </p>
            <p className="mt-2 font-display text-xl font-700 uppercase leading-tight text-foreground">
              {p.clientType}
            </p>
            <p className="mt-4 leading-[1.7] text-foreground/85">{p.clientAbout}</p>
          </div>

          <Separator className="my-7" />

          {/* Case-study tabs */}
          <div>
            <div className="flex flex-wrap gap-2">
              {STAGES.map((s, i) => (
                <button
                  key={s.key}
                  type="button"
                  onClick={() => setStage(i)}
                  aria-pressed={stage === i}
                  className={cn(
                    "flex items-center gap-2 border px-4 py-2.5 text-sm font-bold uppercase tracking-wide transition-colors",
                    stage === i
                      ? "border-foreground bg-foreground text-background"
                      : "border-border bg-background text-foreground/70 hover:border-foreground/40 hover:text-foreground"
                  )}
                >
                  <s.Icon className={cn("size-4", stage === i ? "text-brand-green" : "text-foreground/50")} />
                  {s.label}
                </button>
              ))}
            </div>

            <p key={stage} className="mt-6 animate-fade-up text-lg leading-[1.7] text-foreground/85">
              {p[STAGES[stage].key]}
            </p>
          </div>

          {/* Metrics */}
          <div className="mt-8 grid grid-cols-3 gap-px border border-border bg-border">
            {p.metrics.map((m) => (
              <div key={m.label} className="bg-background p-5 text-center">
                <p className="font-display text-2xl font-700 tabular-nums text-brand-green">
                  {m.value}
                </p>
                <p className="mt-1.5 text-xs font-bold uppercase tracking-wide text-foreground/70">
                  {m.label}
                </p>
              </div>
            ))}
          </div>

          {/* Expandable detail */}
          <button
            type="button"
            onClick={() => setOpen((o) => !o)}
            aria-expanded={open}
            className="mt-7 flex w-full items-center justify-between border-t border-border pt-6 text-left"
          >
            <span className="text-sm font-bold uppercase tracking-wide text-foreground">
              {open ? "Hide scope detail" : "View scope detail"}
            </span>
            <ChevronDown
              className={cn(
                "size-5 text-brand-green transition-transform duration-300",
                open && "rotate-180"
              )}
            />
          </button>

          <div
            className={cn(
              "grid transition-[grid-template-rows] duration-500 ease-out",
              open ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
            )}
          >
            <div className="overflow-hidden">
              <div className="grid gap-7 pt-6 sm:grid-cols-2">
                <div>
                  <p className="text-sm font-bold uppercase tracking-wide text-foreground/70">
                    Deliverables
                  </p>
                  <ul className="mt-3 grid gap-2">
                    {p.deliverables.map((d) => (
                      <li key={d} className="flex items-start gap-2.5 text-sm font-medium">
                        <Check className="mt-0.5 size-3.5 shrink-0 text-brand-green" strokeWidth={3} />
                        <span className="text-foreground/90">{d}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="space-y-6">
                  <div>
                    <p className="text-sm font-bold uppercase tracking-wide text-foreground/70">
                      Services used
                    </p>
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {p.services.map((x) => (
                        <span key={x} className="border border-border bg-secondary px-2.5 py-1.5 text-xs font-semibold text-foreground/85">
                          {x}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div>
                    <p className="text-sm font-bold uppercase tracking-wide text-foreground/70">
                      Standards
                    </p>
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {p.standards.map((x) => (
                        <span key={x} className="border border-border px-2.5 py-1.5 font-mono text-xs font-semibold text-foreground/85">
                          {x}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-auto pt-8">
            <Button asChild className="group h-12 rounded-none bg-brand-green px-7 font-semibold text-white hover:bg-brand-green/90">
              <Link href="/contact">
                Discuss a similar project
                <ArrowRight className="ml-2.5 size-4 transition-transform group-hover:translate-x-1" />
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </article>
  );
}
