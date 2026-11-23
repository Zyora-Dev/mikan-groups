"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";
import { ArrowRight, ArrowUpRight, MapPin, Ruler } from "lucide-react";
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Table, TableBody, TableCell, TableRow } from "@/components/ui/table";
import { projects } from "@/lib/site";
import { cn } from "@/lib/utils";

type Project = (typeof projects)[number];

function ProjectDialog({ p, children }: { p: Project; children: React.ReactNode }) {
  return (
    <Dialog>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-h-[88vh] gap-0 overflow-y-auto rounded-none p-0 sm:max-w-3xl">
        <div className="relative aspect-[21/9] w-full shrink-0">
          <Image src={p.image} alt="" fill sizes="768px" className="object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-neutral-950 via-neutral-950/45 to-transparent" />
          <span className="absolute inset-x-0 bottom-0 h-1 bg-brand-green" />
          <div className="absolute inset-x-0 bottom-0 p-7">
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm font-bold uppercase tracking-wide text-brand-green">
              <span>{p.sector}</span>
              <span className="text-white/35">/</span>
              <span className="text-white/70">{p.location}</span>
              <span className="text-white/35">/</span>
              <span className="text-white/70">{p.year}</span>
            </div>
            <DialogTitle className="mt-2.5 font-display text-3xl font-700 uppercase leading-tight text-white">
              {p.title}
            </DialogTitle>
          </div>
        </div>

        <div className="p-7 md:p-9">
          <DialogHeader className="space-y-0 text-left">
            <DialogDescription className="text-base leading-[1.7] text-foreground/85">
              {p.scope}. Delivered for a confidential client under NDA — project
              details available on request.
            </DialogDescription>
          </DialogHeader>

          <div className="mt-8 grid gap-px border border-border bg-border sm:grid-cols-3">
            {p.metrics.map((m) => (
              <div key={m.label} className="bg-card p-5">
                <p className="font-display text-3xl font-700 tabular-nums text-brand-green">{m.value}</p>
                <p className="mt-1.5 text-xs font-bold uppercase tracking-wide text-foreground/75">
                  {m.label}
                </p>
              </div>
            ))}
          </div>

          <Table className="mt-8">
            <TableBody>
              {[
                ["Client", p.client],
                ["Disciplines", p.disciplines.join(", ")],
                ["Standards", p.standards.join(", ")],
                ["Location", p.location],
              ].map(([k, v]) => (
                <TableRow key={k as string} className="border-border">
                  <TableCell className="w-36 py-3 pl-0 text-sm font-bold uppercase tracking-wide text-foreground/75">
                    {k}
                  </TableCell>
                  <TableCell className="py-3 pr-0 text-sm text-foreground/90">{v}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          <Separator className="my-8" />

          <Button asChild className="group h-12 rounded-none bg-brand-green px-7 font-semibold text-white hover:bg-brand-green/90">
            <Link href="/contact">
              Discuss a similar project
              <ArrowRight className="ml-2.5 size-4 transition-transform group-hover:translate-x-1" />
            </Link>
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function ProjectsSection() {
  const sectors = useMemo(
    () => ["All", ...Array.from(new Set(projects.map((p) => p.sector)))],
    []
  );
  const [filter, setFilter] = useState("All");
  const shown = filter === "All" ? projects : projects.filter((p) => p.sector === filter);

  return (
    <section id="projects" className="scroll-mt-44 border-y border-border bg-secondary/25 py-24 md:py-32">
      <div className="container">
        <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:gap-16">
          <div>
            <div className="flex items-center gap-3">
              <span className="h-px w-10 bg-brand-green" />
              <span className="text-sm font-bold uppercase tracking-[0.14em] text-primary">
                Selected work
              </span>
            </div>
            <h2 className="mt-5 text-balance font-display text-4xl font-700 uppercase leading-[1.02] md:text-5xl">
              Drawings that<br />became buildings
            </h2>
          </div>

          <p className="border-l-2 border-brand-green pl-6 text-base leading-[1.7] text-foreground lg:self-center lg:text-lg">
            Most of our work is delivered under NDA, so projects are shown by
            scope and sector rather than by name. Full references available on
            request.
          </p>
        </div>

        {/* Filter */}
        <div className="mt-12 flex flex-wrap gap-2">
          {sectors.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setFilter(s)}
              aria-pressed={filter === s}
              className={cn(
                "border px-4 py-2 text-sm font-bold uppercase tracking-wide transition-colors",
                filter === s
                  ? "border-foreground bg-foreground text-background"
                  : "border-border bg-background text-foreground/70 hover:border-foreground/40 hover:text-foreground"
              )}
            >
              {s}
            </button>
          ))}
        </div>

        {/* Grid */}
        <div className="mt-8 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {shown.map((p) => (
            <ProjectDialog key={p.id} p={p}>
              <article
                tabIndex={0}
                role="button"
                className="group relative flex cursor-pointer flex-col overflow-hidden border border-border bg-card text-left outline-none transition-all duration-500 hover:-translate-y-2 hover:shadow-2xl hover:shadow-foreground/15 focus-visible:ring-2 focus-visible:ring-brand-green focus-visible:ring-offset-2"
              >
                <div className="relative aspect-[4/3] overflow-hidden">
                  <Image
                    src={p.image}
                    alt={p.title}
                    fill
                    sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    className="object-cover transition-transform duration-[900ms] ease-out group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-neutral-950 via-neutral-950/30 to-transparent" />
                  <div className="absolute inset-0 bg-neutral-950/0 transition-colors duration-500 group-hover:bg-neutral-950/40" />

                  <Badge className="absolute left-5 top-5 rounded-none border-0 bg-neutral-950/70 font-mono text-xs font-semibold font-normal uppercase tracking-[0.14em] text-white backdrop-blur-sm">
                    {p.year}
                  </Badge>
                  <ArrowUpRight className="absolute right-5 top-5 size-5 text-white/0 transition-all duration-300 group-hover:text-white" />

                  <div className="absolute inset-x-0 bottom-0 p-6">
                    <p className="text-xs font-bold uppercase tracking-wide text-brand-green">
                      {p.sector}
                    </p>
                    <h3 className="mt-2 font-display text-xl font-600 uppercase leading-tight text-white">
                      {p.title}
                    </h3>
                    <div className="grid grid-rows-[0fr] transition-[grid-template-rows] duration-500 ease-out group-hover:grid-rows-[1fr]">
                      <div className="overflow-hidden">
                        <p className="pt-2.5 text-sm text-white/80">{p.scope}</p>
                      </div>
                    </div>
                  </div>
                  <span className="absolute inset-x-0 bottom-0 h-1 origin-left scale-x-0 bg-brand-green transition-transform duration-500 group-hover:scale-x-100" />
                </div>

                {/* metric strip */}
                <div className="grid grid-cols-3 gap-px border-t border-border bg-border">
                  {p.metrics.map((m) => (
                    <div key={m.label} className="bg-card px-3 py-4 text-center">
                      <p className="font-display text-base font-700 tabular-nums">{m.value}</p>
                      <p className="mt-0.5 text-xs font-bold uppercase tracking-wide text-foreground/75">
                        {m.label}
                      </p>
                    </div>
                  ))}
                </div>

                <div className="flex items-center gap-2 border-t border-border px-5 py-3.5">
                  <MapPin className="size-3.5 text-brand-green" />
                  <span className="text-xs text-foreground/70">{p.location}</span>
                  <Ruler className="ml-auto size-3.5 text-foreground/35" />
                  <span className="font-mono text-xs font-semibold text-foreground/75">{p.standards[0]}</span>
                </div>
              </article>
            </ProjectDialog>
          ))}
        </div>
      </div>
    </section>
  );
}
