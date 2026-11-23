import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CountUp } from "@/components/count-up";
import { PageHero } from "@/components/page-hero";
import { Reveal } from "@/components/reveal";
import { ServiceExplorer } from "@/components/service-explorer";
import { ServiceJump } from "@/components/service-jump";
import { certifications } from "@/lib/site";

export const metadata: Metadata = {
  title: "Services",
  description:
    "Engineering consultation, BIM, structural engineering, manufacturing, offshore services and process plant design — delivered to AS/NZS, AISC, BS, EN and API standards.",
};

export default function ServicesPage() {
  return (
    <>
      <PageHero
        breadcrumb="Services"
        eyebrow="What we do"
        title={<>Six disciplines,<br />one delivery team</>}
        intro="From feasibility through detailing to commissioned plant. Each discipline works to the standard your project is governed by, and to your own conventions where you have them."
        image="/media/s-structural.jpg"
      />

      {/* ---------- Summary ---------- */}
      <section className="border-b border-border bg-secondary/30">
        <div className="container grid gap-px bg-border py-px sm:grid-cols-2 lg:grid-cols-4">
          {[
            { n: 6, sfx: "", l: "Engineering disciplines" },
            { n: 14, sfx: "+", l: "Software platforms" },
            { n: 18, sfx: "+", l: "Codes and standards" },
            { n: 2, sfx: "×", l: "Independent check on every drawing" },
          ].map((s) => (
            <div key={s.l} className="group bg-background p-8 transition-colors duration-300 hover:bg-secondary/60">
              <span className="block h-0.5 w-10 origin-left bg-brand-green transition-transform duration-500 group-hover:scale-x-[2.4]" />
              <CountUp to={s.n} suffix={s.sfx}
                className="mt-6 font-display text-5xl font-700 tabular-nums text-brand-green" />
              <p className="mt-3 text-base font-bold text-foreground">{s.l}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ---------- Jump bar ---------- */}
      <ServiceJump />

      {/* ---------- Explorer ---------- */}
      <section className="py-16 md:py-20">
        <Reveal>
          <div className="container">
            <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:gap-16">
              <div>
                <div className="flex items-center gap-3">
                  <span className="h-px w-10 bg-brand-green" />
                  <span className="text-sm font-bold uppercase tracking-[0.14em] text-brand-green">
                    How each discipline works
                  </span>
                </div>
                <h2 className="mt-5 text-balance font-display text-3xl font-700 uppercase leading-[1.05] text-foreground md:text-5xl">
                  Scroll through<br />the capabilities
                </h2>
              </div>
              <p className="border-l-2 border-brand-green pl-6 text-lg leading-[1.7] text-foreground lg:self-center">
                Each service sets out the stages of work, what you receive at the
                end, and the software and standards we work to.
              </p>
            </div>
          </div>
        </Reveal>

        <div className="mt-12">
          <ServiceExplorer />
        </div>
      </section>

      {/* ---------- Certifications + CTA ---------- */}
      <section className="relative isolate overflow-hidden border-t border-border bg-foreground py-20 text-background md:py-24">
        <div className="absolute inset-0 bg-grid opacity-[0.06]" aria-hidden="true" />
        <div className="container relative">
          <div className="grid items-center gap-12 lg:grid-cols-[1fr_1fr] lg:gap-20">
            <div>
              <div className="flex items-center gap-3">
                <span className="h-px w-10 bg-brand-green" />
                <span className="text-sm font-bold uppercase tracking-[0.14em] text-brand-green">
                  Certified
                </span>
              </div>
              <h2 className="mt-6 text-balance font-display text-3xl font-700 uppercase leading-[1.05] md:text-4xl">
                Every discipline,<br />the same quality system
              </h2>
              <p className="mt-6 text-lg leading-[1.7] text-background/80">
                Independently certified for quality, environmental performance
                and occupational health and safety.
              </p>
              <div className="mt-8 flex flex-wrap gap-2.5">
                {certifications.map((c) => (
                  <span key={c.code}
                    className="border border-background/25 px-4 py-2 text-sm font-bold tracking-wide">
                    {c.code}
                  </span>
                ))}
              </div>
            </div>

            <div className="border border-background/20 bg-background/[0.04] p-9">
              <h3 className="font-display text-2xl font-700 uppercase leading-tight">
                Not sure which service you need?
              </h3>
              <p className="mt-4 text-lg leading-[1.7] text-background/80">
                Send us the drawings, model or scope note you have. We&apos;ll tell
                you what&apos;s involved and come back with a fixed price.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Button asChild
                  className="group h-14 rounded-none bg-brand-green px-8 text-base font-semibold text-white hover:bg-brand-green/90">
                  <Link href="/contact">
                    Request a quote
                    <ArrowRight className="ml-3 size-4 transition-transform duration-300 group-hover:translate-x-1" />
                  </Link>
                </Button>
                <Button asChild variant="outline"
                  className="h-14 rounded-none border-background/30 bg-transparent px-8 text-base font-medium text-background hover:border-background hover:bg-background hover:text-foreground">
                  <Link href="/projects">See our work</Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
