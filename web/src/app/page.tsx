import Image from "next/image";
import { ArrowUpRight } from "lucide-react";
import { AboutSection } from "@/components/about-section";
import { Hero } from "@/components/hero";
import { ClientMarquee } from "@/components/client-marquee";
import { ProjectsSection } from "@/components/projects-section";
import { ServicesGrid } from "@/components/services-grid";
import { StatsBand } from "@/components/stats-band";
import { certifications, process, sectors, site } from "@/lib/site";

export default function Home() {
  return (
    <>
      <Hero />

      <AboutSection />

      <StatsBand />

      <ServicesGrid />

      <ProjectsSection />

      <ClientMarquee />

      {/* ---------- Process, split with image ---------- */}
      <section id="process" className="scroll-mt-44 border-y border-border bg-secondary/40">
        <div className="grid lg:grid-cols-2">
          <div className="relative min-h-[380px] lg:min-h-full">
            <Image src="/media/steel-frame.jpg" alt="Site engineers checking drawings" fill
              sizes="(max-width: 1024px) 100vw, 50vw" className="object-cover" />
          </div>
          <div className="px-6 py-20 md:px-14 md:py-28">
            <p className="text-sm font-bold uppercase tracking-[0.14em] text-primary">How we work</p>
            <h2 className="mt-5 text-balance font-display text-4xl font-700 uppercase leading-[1.02] md:text-5xl">
              Nothing issues unchecked
            </h2>
            <p className="mt-6 max-w-lg text-muted-foreground">
              A second engineer checks every drawing against the source model and
              the governing standard before it leaves us. The register records who
              checked what, and when.
            </p>
            <ol className="mt-12 space-y-9">
              {process.map((p) => (
                <li key={p.step} className="flex gap-6">
                  <span className="font-mono text-sm text-primary">{p.step}</span>
                  <div className="border-l border-border pl-6">
                    <h3 className="font-display text-xl font-600 uppercase">{p.title}</h3>
                    <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{p.body}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </section>

      {/* ---------- Sectors, image tiles ---------- */}
      <section id="sectors" className="container scroll-mt-44 py-24 md:py-32">
        <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div className="max-w-2xl">
            <p className="text-sm font-bold uppercase tracking-[0.14em] text-primary">Sectors</p>
            <h2 className="mt-5 text-balance font-display text-4xl font-700 uppercase leading-[1.02] md:text-5xl">
              Where our drawings end up
            </h2>
          </div>
          <p className="max-w-sm text-sm text-muted-foreground">
            We work to the standard your project is governed by, and to your own
            detailing conventions where you have them.
          </p>
        </div>

        <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {sectors.map((s) => (
            <article key={s.name} className="group relative aspect-[4/3] overflow-hidden rounded-sm">
              <Image src={s.image} alt={s.name} fill
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                className="object-cover transition-transform duration-700 group-hover:scale-105" />
              <div className="absolute inset-0 bg-gradient-to-t from-neutral-950/90 via-neutral-950/35 to-transparent" />
              <div className="absolute inset-x-0 bottom-0 p-6">
                <h3 className="font-display text-xl font-600 uppercase leading-tight text-white">{s.name}</h3>
                <p className="mt-1.5 text-xs text-white/80">{s.note}</p>
              </div>
              <ArrowUpRight className="absolute right-5 top-5 size-5 text-white/0 transition-colors group-hover:text-white/80" />
            </article>
          ))}
        </div>
      </section>

      {/* ---------- Offices ---------- */}
      <section id="offices" className="relative isolate scroll-mt-44 overflow-hidden border-y border-border">
        <Image src="/media/datacentre.jpg" alt="" fill sizes="100vw" className="object-cover" aria-hidden="true" />
        <div className="absolute inset-0 bg-neutral-950/90" />
        <div className="container relative py-24 md:py-28">
          <div className="grid gap-14 lg:grid-cols-[0.9fr_1.1fr]">
            <div>
              <p className="text-sm font-bold uppercase tracking-[0.14em] text-brand-cyan">Two entities, one team</p>
              <h2 className="mt-5 text-balance font-display text-4xl font-700 uppercase leading-[1.02] text-white md:text-5xl">
                Contract in Singapore.<br />Delivered from India.
              </h2>
              <p className="mt-6 max-w-md text-white/85">
                You hold a contract with our Singapore entity and work with an
                engineering team in Tamil Nadu. Working hours overlap across the
                full Asia-Pacific day.
              </p>
            </div>
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {site.offices.map((o) => (
                <div key={o.country} className="border border-white/15 bg-white/[0.03] p-7 backdrop-blur-sm">
                  <h3 className="font-display text-2xl font-600 uppercase text-white">{o.country}</h3>
                  <p className="mt-1 font-mono text-xs font-semibold uppercase tracking-wider text-brand-cyan">{o.role}</p>
                  <address className="mt-5 text-sm not-italic leading-relaxed text-white/80">
                    {o.lines.map((l) => <span key={l} className="block">{l}</span>)}
                  </address>
                  <a href={`tel:${o.phone.replace(/\s/g, "")}`}
                    className="mt-4 flex items-center gap-2 font-mono text-sm font-semibold text-white/85 transition-colors hover:text-brand-cyan">
                    {o.phone}
                  </a>
                  <p className="mt-3 border-t border-white/10 pt-3 font-mono text-xs font-semibold text-white/65">{o.uen}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>


      {/* ---------- Certifications ---------- */}
      <section id="contact" className="scroll-mt-44 border-y border-border bg-secondary/40">
        <div className="container py-16">
          <div className="flex flex-col items-center gap-10 md:flex-row md:justify-between">
            <div className="max-w-sm text-center md:text-left">
              <p className="text-sm font-bold uppercase tracking-[0.14em] text-primary">Certified</p>
              <h2 className="mt-4 font-display text-3xl font-700 uppercase leading-tight">
                Audited to international standard
              </h2>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-5">
              {certifications.map((c) => (
                <div key={c.code} className="flex items-center gap-4 border border-border bg-background p-5">
                  <div className="relative size-16 shrink-0">
                    <Image src={c.image} alt="" fill sizes="64px" className="object-contain" />
                  </div>
                  <div>
                    <p className="font-display text-lg font-600 uppercase">{c.code}</p>
                    <p className="text-xs text-muted-foreground">{c.name}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

    </>
  );
}
