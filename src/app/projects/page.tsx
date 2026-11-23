import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CountUp } from "@/components/count-up";
import { PageHero } from "@/components/page-hero";
import { ProjectsBrowser } from "@/components/projects-browser";
import { Reveal } from "@/components/reveal";

export const metadata: Metadata = {
  title: "Projects",
  description:
    "Selected engineering projects by Mikan — structural steel detailing, BIM coordination, offshore and process plant work across Asia-Pacific and Europe.",
};

export default function ProjectsPage() {
  return (
    <>
      <PageHero
        breadcrumb="Projects"
        eyebrow="Selected work"
        title={<>Drawings that<br />became buildings</>}
        intro="Most of our work is delivered under NDA, so projects are shown by scope, sector and outcome rather than by name. Full references available on request."
        image="/media/datacentre.jpg"
      />

      {/* ---------- Summary band ---------- */}
      <section className="border-b border-border bg-secondary/30">
        <div className="container grid gap-px bg-border py-px sm:grid-cols-2 lg:grid-cols-4">
          {[
            { n: 200, sfx: "+", l: "Projects delivered" },
            { n: 12, sfx: "k+", l: "Drawings issued" },
            { n: 6, sfx: "", l: "Engineering disciplines" },
            { n: 9, sfx: "", l: "Countries served" },
          ].map((s) => (
            <div key={s.l} className="group bg-background p-8 transition-colors duration-300 hover:bg-secondary/60">
              <span className="block h-0.5 w-10 origin-left bg-brand-green transition-transform duration-500 group-hover:scale-x-[2.4]" />
              <CountUp
                to={s.n}
                suffix={s.sfx}
                className="mt-6 font-display text-5xl font-700 tabular-nums text-brand-green"
              />
              <p className="mt-3 text-base font-bold text-foreground">{s.l}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ---------- Case studies ---------- */}
      <section className="container py-20 md:py-28">
        <Reveal>
          <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:gap-16">
            <div>
              <div className="flex items-center gap-3">
                <span className="h-px w-10 bg-brand-green" />
                <span className="text-sm font-bold uppercase tracking-[0.14em] text-brand-green">
                  Case studies
                </span>
              </div>
              <h2 className="mt-5 text-balance font-display text-3xl font-700 uppercase leading-[1.05] text-foreground md:text-5xl">
                How we work,<br />project by project
              </h2>
            </div>
            <p className="border-l-2 border-brand-green pl-6 text-lg leading-[1.7] text-foreground lg:self-center">
              Each case sets out who the client was, the problem they brought us,
              how we approached it and what was delivered.
            </p>
          </div>
        </Reveal>

        <div className="mt-12">
          <ProjectsBrowser />
        </div>
      </section>

      {/* ---------- CTA ---------- */}
      <section className="relative isolate overflow-hidden border-t border-border bg-foreground py-20 text-background md:py-24">
        <div className="absolute inset-0 bg-grid opacity-[0.06]" aria-hidden="true" />
        <div className="container relative text-center">
          <h2 className="mx-auto max-w-3xl text-balance font-display text-3xl font-700 uppercase leading-[1.05] md:text-5xl">
            Have a similar project?
          </h2>
          <p className="mx-auto mt-6 max-w-xl text-lg leading-[1.7] text-background/80">
            Send us a scope and we&apos;ll come back with a fixed price, a
            programme and a named lead engineer.
          </p>
          <div className="mt-9 flex flex-wrap justify-center gap-3">
            <Button asChild className="group h-14 rounded-none bg-brand-green px-8 text-base font-semibold text-white hover:bg-brand-green/90">
              <Link href="/contact">
                Request a quote
                <ArrowRight className="ml-3 size-4 transition-transform duration-300 group-hover:translate-x-1" />
              </Link>
            </Button>
            <Button asChild variant="outline"
              className="h-14 rounded-none border-background/30 bg-transparent px-8 text-base font-medium text-background hover:border-background hover:bg-background hover:text-foreground">
              <Link href="/services">Our services</Link>
            </Button>
          </div>
        </div>
      </section>
    </>
  );
}
