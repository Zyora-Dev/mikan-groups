import type { Metadata } from "next";
import { Building2, Clock, Mail, MapPin, Phone } from "lucide-react";
import { ContactForm } from "@/components/contact-form";
import { PageHero } from "@/components/page-hero";
import { certifications, site } from "@/lib/site";

export const metadata: Metadata = {
  title: "Contact",
  description:
    "Talk to Mikan Engineering & Construction about structural steel detailing, BIM coordination, E&I design and offshore services. Offices in India, Singapore and Ireland.",
};

export default function ContactPage() {
  return (
    <>
      <PageHero
        breadcrumb="Contact"
        eyebrow="Get in touch"
        title={<>Let&apos;s talk about<br />your project</>}
        intro="Send us a scope, a model or a short note on what you need detailed. We respond with a fixed price, a programme and a named lead engineer."
        image="/media/steel-frame.jpg"
      />

      {/* ================= Contact cards ================= */}
      <section className="border-b border-border bg-secondary/30 py-16 md:py-20">
        <div className="container">
          <div className="grid gap-6 lg:grid-cols-3">
            {/* Email */}
            <div className="flex flex-col border border-border bg-background p-8">
              <span className="flex size-14 items-center justify-center bg-brand-green">
                <Mail className="size-6 text-white" />
              </span>
              <h2 className="mt-6 font-display text-2xl font-700 uppercase tracking-wide text-foreground">
                Email us
              </h2>
              <div className="mt-5 space-y-3">
                <a href={`mailto:${site.email}`}
                  className="block text-lg font-semibold text-foreground transition-colors hover:text-brand-green">
                  {site.email}
                </a>
                <a href={`mailto:${site.salesEmail}`}
                  className="block text-lg font-semibold text-foreground transition-colors hover:text-brand-green">
                  {site.salesEmail}
                </a>
              </div>
              <p className="mt-auto pt-6 text-base text-foreground/70">
                General enquiries and quotations.
              </p>
            </div>

            {/* Phone — every office, no exceptions */}
            <div className="flex flex-col border border-border bg-background p-8">
              <span className="flex size-14 items-center justify-center bg-brand-green">
                <Phone className="size-6 text-white" />
              </span>
              <h2 className="mt-6 font-display text-2xl font-700 uppercase tracking-wide text-foreground">
                Call us
              </h2>
              <div className="mt-5 space-y-3">
                {site.phones.map((p) => (
                  <a
                    key={p.number}
                    href={`tel:${p.number.replace(/[\s()]/g, "")}`}
                    className="flex items-baseline gap-3 transition-colors hover:text-brand-green"
                  >
                    <span className="w-24 shrink-0 text-sm font-bold uppercase tracking-wide text-brand-green">
                      {p.country}
                    </span>
                    <span className="text-lg font-semibold tabular-nums text-foreground">
                      {p.number}
                    </span>
                  </a>
                ))}
              </div>
              <p className="mt-auto pt-6 text-base text-foreground/70">
                Direct lines to all three offices.
              </p>
            </div>

            {/* Hours */}
            <div className="flex flex-col border border-border bg-background p-8">
              <span className="flex size-14 items-center justify-center bg-brand-green">
                <Clock className="size-6 text-white" />
              </span>
              <h2 className="mt-6 font-display text-2xl font-700 uppercase tracking-wide text-foreground">
                Working hours
              </h2>
              <div className="mt-5 space-y-3">
                <p className="text-lg font-semibold text-foreground">
                  Monday – Saturday
                </p>
                <p className="text-lg font-semibold tabular-nums text-foreground">
                  09:00 – 18:00 IST
                </p>
                <p className="text-base font-medium text-foreground/80">
                  Overlapping SGT and CET business hours
                </p>
              </div>
              <p className="mt-auto pt-6 text-base text-foreground/70">
                We reply within one business day.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ================= Form + offices ================= */}
      <section className="container py-20 md:py-28">
        <div className="grid gap-16 lg:grid-cols-[1.1fr_0.9fr] lg:gap-20">
          {/* ---- Form ---- */}
          <div>
            <div className="flex items-center gap-3">
              <span className="h-px w-10 bg-brand-green" />
              <span className="text-sm font-bold uppercase tracking-[0.14em] text-brand-green">
                Enquiry form
              </span>
            </div>
            <h2 className="mt-5 text-balance font-display text-3xl font-700 uppercase leading-[1.05] text-foreground md:text-4xl">
              Tell us what you need detailed
            </h2>
            <p className="mt-5 max-w-lg text-lg leading-[1.7] text-foreground/80">
              The more you share about scope, standards and programme, the more
              precise our response will be.
            </p>

            <div className="mt-10">
              <ContactForm />
            </div>
          </div>

          {/* ---- Offices ---- */}
          <aside>
            <div className="flex items-center gap-3">
              <span className="h-px w-10 bg-brand-green" />
              <span className="text-sm font-bold uppercase tracking-[0.14em] text-brand-green">
                Our offices
              </span>
            </div>
            <h2 className="mt-5 font-display text-3xl font-700 uppercase leading-[1.05] text-foreground">
              Three locations
            </h2>

            <div className="mt-8 space-y-5">
              {site.offices.map((o) => (
                <div key={o.country} className="border border-border bg-background p-7">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h3 className="font-display text-2xl font-700 uppercase tracking-wide text-foreground">
                        {o.country}
                      </h3>
                      <p className="mt-1 text-sm font-bold uppercase tracking-wide text-brand-green">
                        {o.role}
                      </p>
                    </div>
                    <MapPin className="size-5 shrink-0 text-brand-green" />
                  </div>

                  <address className="mt-5 text-base not-italic font-medium leading-relaxed text-foreground/85">
                    {o.lines.map((l) => <span key={l} className="block">{l}</span>)}
                  </address>

                  <a
                    href={`tel:${o.phone.replace(/[\s()]/g, "")}`}
                    className="mt-5 flex items-center gap-3 border-t border-border pt-5 text-lg font-semibold text-foreground transition-colors hover:text-brand-green"
                  >
                    <Phone className="size-4 shrink-0 text-brand-green" />
                    <span className="tabular-nums">{o.phone}</span>
                  </a>

                  <p className="mt-3 flex items-center gap-2 text-sm font-medium text-foreground/60">
                    <Building2 className="size-3.5" />
                    {o.uen}
                  </p>
                </div>
              ))}
            </div>

            {/* Certifications */}
            <div className="mt-8 border border-border bg-foreground p-7 text-background">
              <h3 className="font-display text-xl font-700 uppercase tracking-wide">
                Certified to
              </h3>
              <div className="mt-5 flex flex-wrap gap-2.5">
                {certifications.map((c) => (
                  <span
                    key={c.code}
                    className="border border-background/25 px-4 py-2 text-sm font-bold tracking-wide text-background"
                  >
                    {c.code}
                  </span>
                ))}
              </div>
            </div>
          </aside>
        </div>
      </section>
    </>
  );
}
