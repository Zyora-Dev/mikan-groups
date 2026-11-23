"use client";

import AutoScroll from "embla-carousel-auto-scroll";
import { Building2 } from "lucide-react";
import { Carousel, CarouselContent, CarouselItem } from "@/components/ui/carousel";
import { clientMarks } from "@/lib/site";

/**
 * PLACEHOLDER client marks — typographic, not real logos.
 * Replace each item with an SVG/PNG logo once client consent is in place.
 */
export function ClientMarquee() {
  return (
    <section className="border-b border-border bg-background py-16 md:py-20">
      <div className="container">
        <div className="flex flex-col items-center gap-3 text-center">
          <div className="flex items-center gap-3">
            <span className="h-px w-10 bg-brand-green" />
            <span className="text-sm font-bold uppercase tracking-[0.14em] text-primary">
              Who we work with
            </span>
            <span className="h-px w-10 bg-brand-green" />
          </div>
          <p className="max-w-xl text-sm leading-relaxed text-foreground/70">
            Contractors, fabricators, EPCs and owners across Asia-Pacific,
            Europe and the Middle East.
          </p>
        </div>
      </div>

      <Carousel
        opts={{ loop: true, align: "start", dragFree: true }}
        plugins={[AutoScroll({ speed: 0.7, stopOnInteraction: false, stopOnMouseEnter: true })]}
        className="mt-10"
      >
        <CarouselContent className="-ml-0">
          {[...clientMarks, ...clientMarks].map((c, i) => (
            <CarouselItem
              key={`${c.name}-${i}`}
              className="basis-1/2 pl-0 sm:basis-1/3 lg:basis-1/5"
            >
              <div className="group mx-3 flex h-28 flex-col items-center justify-center gap-2 border border-border bg-card px-5 transition-colors duration-300 hover:border-brand-green/40">
                <Building2 className="size-5 text-foreground/30 transition-colors duration-300 group-hover:text-brand-green" />
                <p className="text-center font-display text-sm font-600 uppercase leading-tight tracking-wide text-foreground/75 transition-colors group-hover:text-foreground">
                  {c.name}
                </p>
                <p className="text-xs font-bold uppercase tracking-wide text-foreground/70">
                  {c.sector}
                </p>
              </div>
            </CarouselItem>
          ))}
        </CarouselContent>
      </Carousel>

      <div className="container mt-8">
        <p className="text-center text-xs font-bold uppercase tracking-wide text-foreground/70">
          Client names withheld under NDA · references available on request
        </p>
      </div>
    </section>
  );
}
