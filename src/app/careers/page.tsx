import type { Metadata } from "next";
import Image from "next/image";
import { Globe2, GraduationCap, TrendingUp, Users } from "lucide-react";
import { CareersClient } from "@/components/careers-client";
import { CountUp } from "@/components/count-up";
import { PageHero } from "@/components/page-hero";
import { Reveal } from "@/components/reveal";
import { benefits, jobs } from "@/lib/site";

export const metadata: Metadata = {
  title: "Careers",
  description:
    "Engineering careers at Mikan — structural steel detailing, Revit MEP, E&I design and project support roles in Thuckalay, Tamil Nadu.",
};

const ICONS = { GraduationCap, Globe2, Users, TrendingUp } as const;

export default function CareersPage() {
  return (
    <>
      <PageHero
        breadcrumb="Careers"
        eyebrow="Join us"
        title={<>Build your career<br />in engineering</>}
        intro="We're hiring detailers, modellers and engineers at our delivery centre in Tamil Nadu — working on international projects from day one."
        image="/media/about-main.jpg"
      />

      {/* ---------- Stats ---------- */}
      <section className="border-b border-border bg-secondary/30">
        <div className="container grid gap-px bg-border py-px sm:grid-cols-2 lg:grid-cols-4">
          {[
            { n: jobs.length, sfx: "", l: "Open roles" },
            { n: 30, sfx: "+", l: "Engineers on the team" },
            { n: 6, sfx: "", l: "Disciplines to grow into" },
            { n: 3, sfx: "", l: "Countries we deliver to" },
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

      {/* ---------- Why work here ---------- */}
      <section className="container py-20 md:py-28">
        <div className="grid gap-14 lg:grid-cols-[1fr_1fr] lg:gap-20">
          <Reveal>
            <div>
              <div className="flex items-center gap-3">
                <span className="h-px w-10 bg-brand-green" />
                <span className="text-sm font-bold uppercase tracking-[0.14em] text-brand-green">
                  Why Mikan
                </span>
              </div>
              <h2 className="mt-5 text-balance font-display text-3xl font-700 uppercase leading-[1.05] text-foreground md:text-5xl">
                Learn the work,<br />not just the software
              </h2>
              <p className="mt-6 text-lg leading-[1.7] text-foreground/85">
                Every drawing you produce is checked by a senior engineer before
                it goes to a client — and they explain what they changed. That
                feedback loop is how our detailers become checkers, and checkers
                become leads.
              </p>

              <div className="relative mt-10 aspect-[16/10] overflow-hidden">
                <Image src="/media/team-review.jpg" alt="Mikan engineers at work"
                  fill sizes="(max-width:1024px) 100vw, 50vw" className="object-cover" />
              </div>
            </div>
          </Reveal>

          <div className="grid gap-px self-start bg-border sm:grid-cols-2">
            {benefits.map((b, i) => {
              const Icon = ICONS[b.icon as keyof typeof ICONS] ?? GraduationCap;
              return (
                <Reveal key={b.title} delay={i * 110} className="h-full">
                  <div className="group relative h-full overflow-hidden bg-background p-8 transition-colors duration-300 hover:bg-secondary/60">
                    <Icon className="size-7 text-brand-green transition-transform duration-500 group-hover:scale-110" />
                    <h3 className="mt-6 font-display text-xl font-700 uppercase leading-tight text-foreground">
                      {b.title}
                    </h3>
                    <p className="mt-4 leading-relaxed text-foreground/80">{b.body}</p>
                    <span className="absolute inset-x-0 top-0 h-0.5 origin-left scale-x-0 bg-brand-green transition-transform duration-500 group-hover:scale-x-100" />
                  </div>
                </Reveal>
              );
            })}
          </div>
        </div>
      </section>

      {/* ---------- Roles + application form ---------- */}
      <CareersClient />
    </>
  );
}
