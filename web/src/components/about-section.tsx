import Image from "next/image";
import { ShieldCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { PurposeValues } from "@/components/purpose-values";
import { Separator } from "@/components/ui/separator";
import { site } from "@/lib/site";

export function AboutSection() {
  return (
    <section id="about" className="scroll-mt-44 border-b border-border bg-secondary/25">
      <div className="container py-24 md:py-32">
        {/* ============ Heading ============ */}
        <div className="grid gap-8 lg:grid-cols-[1fr_auto] lg:items-end">
          <div className="max-w-2xl">
            <div className="flex items-center gap-3">
              <span className="h-px w-10 bg-brand-green" />
              <span className="text-sm font-bold uppercase tracking-[0.14em] text-primary">
                Who we are
              </span>
            </div>
            <h2 className="mt-6 text-balance font-display text-4xl font-700 uppercase leading-[1.02] md:text-5xl">
              Engineering partners,<br />not just a drawing office
            </h2>
          </div>

          <div className="flex gap-2.5">
            {site.offices.map((o) => (
              <Badge
                key={o.country}
                variant="outline"
                className="rounded-none border-border bg-background px-3 py-2 font-mono text-xs font-semibold uppercase tracking-wider"
              >
                {o.country}
              </Badge>
            ))}
          </div>
        </div>

        {/* ============ Images + intro ============ */}
        <div className="mt-14 grid items-stretch gap-4 lg:grid-cols-12">
          {/* Large image */}
          <figure className="relative col-span-full aspect-[16/10] overflow-hidden lg:col-span-7 lg:aspect-auto lg:min-h-[26rem]">
            <Image
              src="/media/steel-frame.jpg"
              alt="Mikan engineers reviewing drawings on site"
              fill
              sizes="(max-width: 1024px) 100vw, 58vw"
              className="object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-neutral-950/75 via-neutral-950/10 to-transparent" />
            <figcaption className="absolute inset-x-0 bottom-0 p-7">
              <p className="text-sm font-bold uppercase tracking-wide text-brand-green">
                On site
              </p>
              <p className="mt-2 font-display text-2xl font-600 uppercase leading-tight text-white">
                Engineers where the work happens
              </p>
            </figcaption>
          </figure>

          {/* Right column — image and card share the same height */}
          <div className="col-span-full grid grid-rows-[1fr_auto] gap-4 lg:col-span-5">
            <figure className="relative aspect-[16/10] overflow-hidden lg:aspect-auto lg:min-h-[16rem]">
              <Image
                src="/media/about-main.jpg"
                alt="Mikan engineers inspecting a fabricated component"
                fill
                sizes="(max-width: 1024px) 100vw, 40vw"
                className="object-cover"
              />
            </figure>

            <div className="flex items-center gap-6 bg-foreground p-7 text-background">
              <ShieldCheck className="size-9 shrink-0 text-brand-green" aria-hidden="true" />
              <Separator orientation="vertical" className="h-14 bg-background/20" />
              <div>
                <p className="font-display text-2xl font-600 uppercase leading-none">
                  Independent check
                </p>
                <p className="mt-2 text-sm leading-relaxed text-background/85">
                  A second engineer verifies every drawing against the source
                  model before issue.
                </p>
              </div>
            </div>
          </div>
        </div>

        <PurposeValues />
      </div>
    </section>
  );
}
