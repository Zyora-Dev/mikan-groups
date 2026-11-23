import Link from "next/link";
import Image from "next/image";
import { ArrowRight, ArrowUpRight, Mail, MapPin, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { QuoteDialog } from "@/components/quote-dialog";
import { certifications, nav, services, site } from "@/lib/site";

export function SiteFooter() {
  return (
    <footer className="relative isolate overflow-hidden bg-foreground text-background">
      {/* drawing-grid texture */}
      <div className="absolute inset-0 bg-grid opacity-[0.06]" aria-hidden="true" />
      <div
        className="absolute -right-32 -top-32 size-[28rem] rounded-full bg-brand-green/10 blur-3xl"
        aria-hidden="true"
      />

      {/* ============ CTA band ============ */}
      <div className="relative border-b border-background/10">
        <div className="container py-16 md:py-20">
          <div className="grid items-center gap-10 lg:grid-cols-[1.4fr_auto]">
            <div>
              <div className="flex items-center gap-3">
                <span className="h-px w-10 bg-brand-green" />
                <span className="text-sm font-bold uppercase tracking-[0.14em] text-brand-green">
                  Start a project
                </span>
              </div>
              <h2 className="mt-5 text-balance font-display text-3xl font-700 uppercase leading-[1.05] md:text-5xl">
                Send us a scope.<br />
                We&apos;ll send back a programme.
              </h2>
            </div>

            <div className="flex flex-wrap gap-3">
              <QuoteDialog>
                <Button
                  size="lg"
                  className="group h-14 rounded-none bg-brand-green px-8 text-base font-semibold text-white hover:bg-brand-green/90"
                >
                  Request a quote
                  <ArrowRight className="ml-3 size-4 transition-transform duration-300 group-hover:translate-x-1" />
                </Button>
              </QuoteDialog>
              <Button
                asChild
                size="lg"
                variant="outline"
                className="h-14 rounded-none border-background/25 bg-transparent px-8 text-base font-medium text-background transition-colors hover:border-background hover:bg-background hover:text-foreground"
              >
                <Link href="/services">Our services</Link>
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* ============ Main ============ */}
      <div className="relative container py-16 md:py-20">
        <div className="grid gap-12 lg:grid-cols-12 lg:gap-10">
          {/* Brand */}
          <div className="lg:col-span-4">
            <div className="inline-flex bg-background p-4">
              <Image src="/mikan-logo.png" alt={site.name} width={679} height={368} className="h-12 w-auto" />
            </div>
            <p className="mt-6 max-w-sm leading-relaxed text-background/75">
              Engineering consultation, BIM, structural design, fabrication and
              offshore services — delivered from India, Singapore and Ireland.
            </p>

            {/* ISO strip */}
            <div className="mt-8">
              <p className="text-sm font-bold uppercase tracking-wide text-background/45">
                Certified
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                {certifications.map((c) => (
                  <span
                    key={c.code}
                    className="border border-background/20 px-3 py-1.5 font-mono text-xs font-semibold text-background/80"
                  >
                    {c.code}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Links */}
          <div className="lg:col-span-2">
            <h3 className="text-sm font-bold uppercase tracking-wide text-brand-green">
              Company
            </h3>
            <ul className="mt-5 space-y-3">
              {nav.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className="group inline-flex items-center gap-1.5 text-sm text-background/80 transition-colors hover:text-background"
                  >
                    {item.label}
                    <ArrowUpRight className="size-3 opacity-0 transition-opacity group-hover:opacity-100" />
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div className="lg:col-span-3">
            <h3 className="text-sm font-bold uppercase tracking-wide text-brand-green">
              Services
            </h3>
            <ul className="mt-5 space-y-3">
              {services.map((s) => (
                <li key={s.id}>
                  <Link
                    href={`/#${s.id}`}
                    className="group inline-flex items-center gap-1.5 text-sm text-background/80 transition-colors hover:text-background"
                  >
                    {s.title}
                    <ArrowUpRight className="size-3 opacity-0 transition-opacity group-hover:opacity-100" />
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div className="lg:col-span-3">
            <h3 className="text-sm font-bold uppercase tracking-wide text-brand-green">
              Get in touch
            </h3>
            <div className="mt-5 space-y-3">
              <a
                href={`mailto:${site.email}`}
                className="flex items-center gap-3 text-sm text-background/85 transition-colors hover:text-brand-green"
              >
                <Mail className="size-4 shrink-0 text-brand-green" />
                {site.email}
              </a>
              <a
                href={`mailto:${site.salesEmail}`}
                className="flex items-center gap-3 text-sm text-background/85 transition-colors hover:text-brand-green"
              >
                <Mail className="size-4 shrink-0 text-brand-green" />
                {site.salesEmail}
              </a>
              {site.phones.map((p) => (
                <a
                  key={p.number}
                  href={`tel:${p.number.replace(/[\s()]/g, "")}`}
                  className="flex items-center gap-3 text-sm text-background/85 transition-colors hover:text-brand-green"
                >
                  <Phone className="size-4 shrink-0 text-brand-green" />
                  <span className="tabular-nums">{p.number}</span>
                  <span className="font-mono text-xs font-semibold uppercase tracking-wider text-background/45">
                    {p.country}
                  </span>
                </a>
              ))}
            </div>
          </div>
        </div>

        {/* ============ Offices ============ */}
        <div className="mt-16 grid gap-px border-t border-background/10 bg-background/10 pt-px sm:grid-cols-3">
          {site.offices.map((o) => (
            <div key={o.country} className="group bg-foreground p-7 transition-colors hover:bg-background/[0.04]">
              <div className="flex items-center gap-2.5">
                <MapPin className="size-4 text-brand-green" />
                <h3 className="font-display text-xl font-600 uppercase tracking-wide">{o.country}</h3>
              </div>
              <p className="mt-1 text-xs font-bold uppercase tracking-wide text-brand-green/80">
                {o.role}
              </p>
              <address className="mt-4 text-sm not-italic leading-relaxed text-background/75">
                {o.lines.map((l) => (
                  <span key={l} className="block">{l}</span>
                ))}
              </address>
              <p className="mt-4 border-t border-background/10 pt-3 font-mono text-xs font-semibold text-background/50">
                {o.uen}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* ============ Bottom bar ============ */}
      <div className="relative border-t border-background/10">
        <div className="container flex flex-col gap-3 py-6 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-background/60">
            © {new Date().getFullYear()} {site.name}. All rights reserved.
          </p>
          <p className="text-sm font-bold uppercase tracking-[0.14em] text-brand-green">
            {site.tagline}
          </p>
        </div>
      </div>
    </footer>
  );
}
