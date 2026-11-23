"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import {
  ArrowLeft, ArrowRight, ArrowUpRight, Check, Cpu, FileCheck2,
} from "lucide-react";
import {
  Carousel, CarouselContent, CarouselItem, type CarouselApi,
} from "@/components/ui/carousel";
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { services } from "@/lib/site";
import { cn } from "@/lib/utils";

type Service = (typeof services)[number];

/* ---------------- Detail dialog ---------------- */
function ServiceDialog({ s, children }: { s: Service; children: React.ReactNode }) {
  return (
    <Dialog>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-h-[88vh] gap-0 overflow-y-auto rounded-none p-0 sm:max-w-3xl">
        <div className="relative aspect-[21/9] w-full shrink-0">
          <Image src={s.image} alt="" fill sizes="768px" className="object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-neutral-950 via-neutral-950/40 to-transparent" />
          <span className={cn("absolute inset-x-0 bottom-0 h-1", s.accent)} />
          <div className="absolute inset-x-0 bottom-0 p-7">
            <span className="font-mono text-sm font-semibold text-white/85">{s.index}</span>
            <DialogTitle className="mt-2 font-display text-3xl font-700 uppercase leading-tight text-white">
              {s.title}
            </DialogTitle>
          </div>
        </div>

        <div className="p-7 md:p-9">
          <DialogHeader className="space-y-0 text-left">
            <DialogDescription className="text-base leading-[1.7] text-foreground/85">
              {s.summary}
            </DialogDescription>
          </DialogHeader>

          <div className="mt-8 grid gap-8 sm:grid-cols-2">
            <div>
              <div className="flex items-center gap-2.5">
                <FileCheck2 className="size-4 text-brand-green" />
                <h4 className="text-sm font-bold uppercase tracking-wide text-foreground/60">
                  Deliverables
                </h4>
              </div>
              <ul className="mt-4 grid gap-2.5">
                {s.deliverables.map((d) => (
                  <li key={d} className="flex items-start gap-3 text-sm">
                    <Check className="mt-0.5 size-3.5 shrink-0 text-brand-green" strokeWidth={3} />
                    <span className="text-foreground/90">{d}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="space-y-8">
              <div>
                <div className="flex items-center gap-2.5">
                  <Cpu className="size-4 text-brand-green" />
                  <h4 className="text-sm font-bold uppercase tracking-wide text-foreground/60">
                    Software
                  </h4>
                </div>
                <div className="mt-4 flex flex-wrap gap-1.5">
                  {s.software.map((x) => (
                    <Badge key={x} variant="secondary" className="rounded-none font-mono text-xs font-semibold font-normal">
                      {x}
                    </Badge>
                  ))}
                </div>
              </div>

              <div>
                <h4 className="text-sm font-bold uppercase tracking-wide text-foreground/60">
                  Standards
                </h4>
                <div className="mt-4 flex flex-wrap gap-1.5">
                  {s.standards.map((x) => (
                    <span key={x} className="border border-border px-2 py-1 font-mono text-xs font-semibold text-foreground/80">
                      {x}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <Separator className="my-8" />

          <Button asChild className="group h-12 rounded-none bg-brand-green px-7 font-semibold text-white hover:bg-brand-green/90">
            <Link href="/contact">
              Enquire about this service
              <ArrowRight className="ml-2.5 size-4 transition-transform group-hover:translate-x-1" />
            </Link>
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

/* ---------------- Card ---------------- */
function ServiceCard({ s }: { s: Service }) {
  return (
    <ServiceDialog s={s}>
      <article
        id={s.id}
        tabIndex={0}
        role="button"
        className="group relative flex h-full scroll-mt-44 cursor-pointer flex-col overflow-hidden border border-border bg-card text-left outline-none transition-all duration-500 hover:-translate-y-2 hover:shadow-2xl hover:shadow-foreground/15 focus-visible:ring-2 focus-visible:ring-brand-green focus-visible:ring-offset-2"
      >
        <div className="relative aspect-[4/3] shrink-0 overflow-hidden">
          <Image
            src={s.image}
            alt={s.title}
            fill
            sizes="(max-width: 768px) 85vw, (max-width: 1280px) 45vw, 30vw"
            className="object-cover transition-transform duration-[900ms] ease-out group-hover:scale-110"
          />
          {/* base scrim, deepens on hover */}
          <div className="absolute inset-0 bg-gradient-to-t from-neutral-950 via-neutral-950/35 to-transparent transition-opacity duration-500" />
          <div className="absolute inset-0 bg-neutral-950/0 transition-colors duration-500 group-hover:bg-neutral-950/45" />

          <span className="absolute left-5 top-5 flex size-10 items-center justify-center border border-white/25 bg-neutral-950/50 font-mono text-xs text-white backdrop-blur-sm transition-colors duration-500 group-hover:border-brand-green group-hover:bg-brand-green group-hover:text-white">
            {s.index}
          </span>

          {/* content pinned low, slides up on hover */}
          <div className="absolute inset-x-0 bottom-0 p-6">
            <h3 className="font-display text-xl font-600 uppercase leading-tight text-white transition-transform duration-500 group-hover:-translate-y-1">
              {s.title}
            </h3>

            <div className="grid grid-rows-[0fr] transition-[grid-template-rows] duration-500 ease-out group-hover:grid-rows-[1fr]">
              <div className="overflow-hidden">
                <p className="pt-3 text-sm leading-relaxed text-white/80">{s.summary}</p>
                <span className="mt-4 inline-flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-brand-green">
                  View details <ArrowUpRight className="size-3.5" />
                </span>
              </div>
            </div>
          </div>

          <span className={cn("absolute inset-x-0 bottom-0 h-1 origin-left scale-x-0 transition-transform duration-500 group-hover:scale-x-100", s.accent)} />
        </div>

        {/* standards footer */}
        <div className="flex flex-wrap items-center gap-1.5 border-t border-border p-5">
          {s.standards.slice(0, 3).map((x) => (
            <span key={x} className="border border-border px-2 py-1 font-mono text-xs font-semibold text-foreground/70">
              {x}
            </span>
          ))}
          {s.standards.length > 3 && (
            <span className="font-mono text-xs font-semibold text-foreground/70">
              +{s.standards.length - 3}
            </span>
          )}
        </div>
      </article>
    </ServiceDialog>
  );
}

/* ---------------- Section ---------------- */
export function ServicesGrid() {
  const [api, setApi] = useState<CarouselApi>();
  const [current, setCurrent] = useState(0);
  const [count, setCount] = useState(0);
  const pinRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!api) return;
    setCount(api.scrollSnapList().length);
    setCurrent(api.selectedScrollSnap());
    const onSelect = () => setCurrent(api.selectedScrollSnap());
    api.on("select", onSelect);
    return () => { api.off("select", onSelect); };
  }, [api]);

  /**
   * Desktop only: while the section is pinned in view, wheel events advance
   * the carousel instead of the page. Once the track reaches either end the
   * wheel is released so the page scrolls on normally.
   */
  useEffect(() => {
    if (!api) return;
    const el = pinRef.current;
    if (!el) return;

    const mq = window.matchMedia("(min-width: 1024px)");
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (!mq.matches || reduced.matches) return;

    let locked = false;      // cooldown between slide changes
    let accum = 0;           // accumulated wheel delta

    const onWheel = (e: WheelEvent) => {
      const rect = el.getBoundingClientRect();
      const vh = window.innerHeight;
      // engage once most of the section is on screen, in either direction
      const visible = Math.min(rect.bottom, vh) - Math.max(rect.top, 0);
      const engaged = visible > vh * 0.6;
      if (!engaged) return;

      const forward = e.deltaY > 0;
      const atEnd = forward ? !api.canScrollNext() : !api.canScrollPrev();
      if (atEnd) return; // let the page scroll away

      e.preventDefault();
      if (locked) return;

      accum += e.deltaY;
      if (Math.abs(accum) < 60) return; // ignore small trackpad jitter

      accum = 0;
      locked = true;
      if (forward) api.scrollNext();
      else api.scrollPrev();
      window.setTimeout(() => { locked = false; }, 520);
    };

    window.addEventListener("wheel", onWheel, { passive: false });
    return () => window.removeEventListener("wheel", onWheel);
  }, [api]);

  return (
    <section
      id="services"
      ref={pinRef}
      className="flex scroll-mt-44 flex-col justify-center overflow-hidden py-24 md:py-32 lg:min-h-screen"
    >
      <div className="container">
        <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:gap-16">
          <div>
            <div className="flex items-center gap-3">
              <span className="h-px w-10 bg-brand-green" />
              <span className="text-sm font-bold uppercase tracking-[0.14em] text-primary">
                What we do
              </span>
            </div>
            <h2 className="mt-5 text-balance font-display text-4xl font-700 uppercase leading-[1.02] md:text-5xl">
              Seven disciplines,<br />one delivery team
            </h2>
          </div>

          <p className="border-l-2 border-brand-green pl-6 text-base leading-[1.7] text-foreground lg:self-center lg:text-lg">
            From feasibility through detailing to commissioned plant — each
            discipline works to the standard your project is governed by.
            Select any service to see the full scope.
          </p>
        </div>
      </div>

      <Carousel setApi={setApi} opts={{ align: "start", loop: false }} className="mt-12">
        <div className="container">
          <CarouselContent className="-ml-5">
            {services.map((s) => (
              <CarouselItem key={s.id} className="basis-[85%] pl-5 sm:basis-1/2 xl:basis-1/3">
                <ServiceCard s={s} />
              </CarouselItem>
            ))}
          </CarouselContent>
        </div>
      </Carousel>

      <div className="container mt-10">
        <div className="flex items-center justify-between gap-6">
          <div className="flex items-center gap-2">
            {Array.from({ length: count }).map((_, i) => (
              <button
                key={i}
                type="button"
                onClick={() => api?.scrollTo(i)}
                aria-label={`Go to slide ${i + 1}`}
                className="py-2"
              >
                <span
                  className={cn(
                    "block h-0.5 transition-all duration-300",
                    i === current ? "w-10 bg-brand-green" : "w-5 bg-border hover:bg-foreground/35"
                  )}
                />
              </button>
            ))}
          </div>

          <div className="flex items-center gap-3">
            <span className="hidden text-sm font-bold uppercase tracking-wide text-foreground/70 lg:inline">
              Scroll to browse
            </span>
            <span className="font-mono text-sm font-semibold tabular-nums text-foreground/75">
              {String(current + 1).padStart(2, "0")} / {String(count || services.length).padStart(2, "0")}
            </span>
            <Button
              variant="outline"
              size="icon"
              onClick={() => api?.scrollPrev()}
              disabled={!api?.canScrollPrev()}
              aria-label="Previous service"
              className="size-11 rounded-none"
            >
              <ArrowLeft className="size-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={() => api?.scrollNext()}
              disabled={!api?.canScrollNext()}
              aria-label="Next service"
              className="size-11 rounded-none"
            >
              <ArrowRight className="size-4" />
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
