import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight, Compass, Globe2, Layers, Ruler, ShieldCheck, Target,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { CountUp } from "@/components/count-up";
import { JourneyTimeline } from "@/components/journey-timeline";
import { Reveal } from "@/components/reveal";
import { about, certifications, differentiators, site } from "@/lib/site";

export const metadata: Metadata = {
  title: "About",
  description:
    "Mikan Engineering & Construction — an engineering design practice delivering structural, BIM, electrical and offshore services from India, Singapore and Ireland.",
};

const ICONS = { ShieldCheck, Globe2, Ruler, Layers } as const;

export default function AboutPage() {
  return (
    <>
      {/* ================= Hero ================= */}
      <section className="border-b border-border bg-secondary/25 py-20 md:py-28">
        <div className="container">
          <Reveal>
          <div className="mx-auto max-w-3xl text-center">
            <div className="flex items-center justify-center gap-3">
              <span className="h-px w-10 bg-brand-green" />
              <span className="text-sm font-bold uppercase tracking-[0.14em] text-brand-green">
                About Mikan
              </span>
              <span className="h-px w-10 bg-brand-green" />
            </div>
            <h1 className="mt-7 text-balance font-display text-4xl font-700 uppercase leading-[1.02] text-foreground md:text-6xl">
              Where precision meets delivery
            </h1>
            <p className="mx-auto mt-7 max-w-2xl text-lg font-medium leading-[1.7] text-foreground/80">
              We produce the drawings, models and calculations that fabrication
              shops and site teams build from — across six engineering
              disciplines and three countries.
            </p>
          </div>
          </Reveal>

          {/* ---- Bento mosaic ---- */}
          <Reveal delay={120}>
          <div className="mt-16 grid gap-4 md:grid-cols-4 md:grid-rows-2">
            <figure className="group relative col-span-2 row-span-2 aspect-[4/3] overflow-hidden md:aspect-auto md:min-h-[32rem]">
              <Image src="/media/steel-frame.jpg" alt="Mikan engineers reviewing drawings on site"
                fill sizes="(max-width:768px) 100vw, 50vw" className="object-cover transition-transform duration-[900ms] ease-out group-hover:scale-105" priority />
              <div className="absolute inset-0 bg-gradient-to-t from-neutral-950/85 to-transparent" />
              <figcaption className="absolute inset-x-0 bottom-0 p-8">
                <p className="text-sm font-bold uppercase tracking-wide text-brand-green">On site</p>
                <p className="mt-2 font-display text-2xl font-700 uppercase leading-tight text-white">
                  Engineers where the work happens
                </p>
              </figcaption>
            </figure>

            <div className="group flex flex-col justify-between bg-brand-green p-8 text-white transition-transform duration-500 hover:-translate-y-1">
              <Layers className="size-7" />
              <div>
                <p className="font-display text-5xl font-700 leading-none">06</p>
                <p className="mt-3 text-base font-bold uppercase tracking-wide">
                  Engineering disciplines
                </p>
              </div>
            </div>

            <figure className="group relative aspect-[4/3] overflow-hidden md:aspect-auto">
              <Image src="/media/about-main.jpg" alt="Engineers inspecting a fabricated component"
                fill sizes="25vw" className="object-cover transition-transform duration-[900ms] ease-out group-hover:scale-110" />
            </figure>

            <figure className="group relative aspect-[4/3] overflow-hidden md:aspect-auto">
              <Image src="/media/s-bim.jpg" alt="BIM coordination on a steel structure"
                fill sizes="25vw" className="object-cover transition-transform duration-[900ms] ease-out group-hover:scale-110" />
            </figure>

            <div className="group flex flex-col justify-between bg-foreground p-8 text-background transition-transform duration-500 hover:-translate-y-1">
              <Globe2 className="size-7 text-brand-green" />
              <div>
                <p className="font-display text-5xl font-700 leading-none text-brand-green">03</p>
                <p className="mt-3 text-base font-bold uppercase tracking-wide">
                  Countries, one team
                </p>
              </div>
            </div>
          </div>
          </Reveal>
        </div>
      </section>

      {/* ================= Story ================= */}
      <section className="container py-20 md:py-28">
        <div className="grid gap-12 lg:grid-cols-2 lg:gap-20">
          <Reveal>
          <div>
            <h2 className="text-balance font-display text-3xl font-700 uppercase leading-[1.05] text-foreground md:text-5xl">
              An engineering office<br />built for contractors
            </h2>
            <Separator className="mt-8 w-16 bg-brand-green" />
          </div>
          </Reveal>
          <Reveal delay={140}>
          <div className="space-y-5 text-lg leading-[1.7] text-foreground/85">
            <p>
              Mikan began in 2020 in Kanyakumari, Tamil Nadu, detailing
              structural steel for contractors who needed drawings that were
              right the first time. That discipline still defines how we work.
            </p>
            <p>
              Today we deliver engineering consultation, BIM coordination,
              structural design, fabrication support, offshore services and
              process plant engineering. Clients contract with our Singapore or
              Irish entity and work directly with engineers in India.
            </p>
            <p>
              Every drawing that leaves us has been checked by a second
              engineer against the source model and the governing standard.
              That is not an optional extra — it is the process.
            </p>
          </div>
          </Reveal>
        </div>
      </section>

      {/* ================= Stats row ================= */}
      <section className="border-y border-border bg-secondary/30">
        <div className="container grid gap-px bg-border py-px sm:grid-cols-2 lg:grid-cols-4">
          {[
            { n: 30, sfx: "+", l: "Engineers and detailers" },
            { n: 200, sfx: "+", l: "Projects delivered" },
            { n: 50, sfx: "+", l: "Clients worldwide" },
            { n: 3, sfx: "", l: "Offices across two continents" },
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

      {/* ================= Mission & Vision ================= */}
      <section className="container py-20 md:py-28">
        <div className="grid gap-px bg-border md:grid-cols-2">
          {[
            { Icon: Target, label: "Our mission", body: about.mission },
            { Icon: Compass, label: "Our vision", body: about.vision },
          ].map(({ Icon, label, body }, i) => (
            <Reveal key={label} delay={i * 140} className="h-full">
            <div className="group relative h-full overflow-hidden bg-background p-9 transition-colors duration-500 hover:bg-secondary/50 md:p-12">
              <span className="flex size-14 items-center justify-center bg-brand-green transition-transform duration-500 group-hover:scale-110">
                <Icon className="size-6 text-white" />
              </span>
              <h3 className="mt-7 font-display text-2xl font-700 uppercase tracking-wide text-foreground">
                {label}
              </h3>
              <p className="mt-5 text-lg leading-[1.7] text-foreground/85">{body}</p>
              <span className="absolute inset-x-0 bottom-0 h-1 origin-left scale-x-0 bg-brand-green transition-transform duration-500 group-hover:scale-x-100" />
            </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ================= Differentiators ================= */}
      <section className="border-y border-border bg-secondary/30 py-20 md:py-28">
        <div className="container">
          <Reveal>
          <div className="mx-auto max-w-2xl text-center">
            <div className="flex items-center justify-center gap-3">
              <span className="h-px w-10 bg-brand-green" />
              <span className="text-sm font-bold uppercase tracking-[0.14em] text-brand-green">
                Why Mikan
              </span>
              <span className="h-px w-10 bg-brand-green" />
            </div>
            <h2 className="mt-7 text-balance font-display text-3xl font-700 uppercase leading-[1.05] text-foreground md:text-4xl">
              What makes the difference
            </h2>
          </div>
          </Reveal>

          <div className="mt-14 grid gap-px bg-border sm:grid-cols-2 lg:grid-cols-4">
            {differentiators.map((d, i) => {
              const Icon = ICONS[d.icon as keyof typeof ICONS] ?? ShieldCheck;
              return (
                <Reveal key={d.title} delay={i * 110}>
                <div className="group relative h-full overflow-hidden bg-background p-8 transition-colors duration-300 hover:bg-secondary/60">
                  <Icon className="size-7 text-brand-green transition-transform duration-500 group-hover:scale-110" />
                  <h3 className="mt-6 font-display text-xl font-700 uppercase leading-tight text-foreground">
                    {d.title}
                  </h3>
                  <p className="mt-4 leading-relaxed text-foreground/80">{d.body}</p>
                  <span className="absolute inset-x-0 top-0 h-0.5 origin-left scale-x-0 bg-brand-green transition-transform duration-500 group-hover:scale-x-100" />
                </div>
                </Reveal>
              );
            })}
          </div>
        </div>
      </section>

      {/* ================= Timeline ================= */}
      <section className="container py-20 md:py-28">
        <JourneyTimeline />
      </section>

      {/* ================= Certifications ================= */}
      <section className="relative isolate overflow-hidden border-y border-border bg-foreground py-20 text-background md:py-24">
        <div className="absolute inset-0 bg-grid opacity-[0.06]" aria-hidden="true" />
        <div className="container relative">
          <div className="grid items-center gap-12 lg:grid-cols-[1fr_1.2fr] lg:gap-20">
            <div>
              <div className="flex items-center gap-3">
                <span className="h-px w-10 bg-brand-green" />
                <span className="text-sm font-bold uppercase tracking-[0.14em] text-brand-green">
                  Certified
                </span>
              </div>
              <h2 className="mt-6 text-balance font-display text-3xl font-700 uppercase leading-[1.05] md:text-4xl">
                Audited to international standard
              </h2>
              <p className="mt-6 text-lg leading-[1.7] text-background/80">
                Our management systems are independently certified for quality,
                environmental performance and occupational health and safety.
              </p>
            </div>

            <div className="grid gap-5 sm:grid-cols-3">
              {certifications.map((c) => (
                <div key={c.code} className="group border border-background/20 bg-background/[0.04] p-7 text-center transition-all duration-500 hover:-translate-y-1 hover:border-brand-green/50 hover:bg-background/[0.08]">
                  <div className="relative mx-auto size-20">
                    <Image src={c.image} alt="" fill sizes="80px" className="object-contain" />
                  </div>
                  <p className="mt-5 font-display text-xl font-700 uppercase">{c.code}</p>
                  <p className="mt-2 text-sm font-medium text-background/75">{c.name}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ================= Offices + CTA ================= */}
      <section className="container py-20 md:py-28">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-balance font-display text-3xl font-700 uppercase leading-[1.05] text-foreground md:text-4xl">
            One team, three locations
          </h2>
        </div>

        <div className="mt-14 grid gap-px bg-border sm:grid-cols-3">
          {site.offices.map((o) => (
            <div key={o.country} className="group bg-background p-8 transition-colors duration-300 hover:bg-secondary/60">
              <h3 className="font-display text-2xl font-700 uppercase tracking-wide text-foreground">
                {o.country}
              </h3>
              <p className="mt-1.5 text-sm font-bold uppercase tracking-wide text-brand-green">
                {o.role}
              </p>
              <address className="mt-5 text-base font-medium not-italic leading-relaxed text-foreground/85">
                {o.lines.map((l) => <span key={l} className="block">{l}</span>)}
              </address>
              <a
                href={`tel:${o.phone.replace(/[\s()]/g, "")}`}
                className="mt-5 block border-t border-border pt-5 text-lg font-semibold tabular-nums text-foreground transition-colors hover:text-brand-green"
              >
                {o.phone}
              </a>
            </div>
          ))}
        </div>

        <div className="mt-16 text-center">
          <h3 className="text-balance font-display text-3xl font-700 uppercase leading-[1.05] text-foreground md:text-5xl">
            Ready to start a project?
          </h3>
          <div className="mt-9 flex flex-wrap justify-center gap-3">
            <Button asChild className="group h-14 rounded-none bg-brand-green px-8 text-base font-semibold text-white hover:bg-brand-green/90">
              <Link href="/contact">
                Contact us
                <ArrowRight className="ml-3 size-4 transition-transform duration-300 group-hover:translate-x-1" />
              </Link>
            </Button>
            <Button asChild variant="outline" className="h-14 rounded-none px-8 text-base font-medium">
              <Link href="/services">Our services</Link>
            </Button>
          </div>
        </div>
      </section>
    </>
  );
}
