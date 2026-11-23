"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import { Building2, Factory, HardHat, Layers, Mail, Menu, Phone, Users, type LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { MainNav } from "@/components/main-nav";
import { QuoteDialog } from "@/components/quote-dialog";
import { nav, site } from "@/lib/site";

const NAV_ICONS: Record<string, LucideIcon> = {
  Users, Layers, Building2, Factory, HardHat, Mail,
};

export function SiteHeader() {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 w-full">
      {/* ---------- Utility bar ---------- */}
      <div className="hidden border-b border-border bg-foreground lg:block">
        <div className="container flex h-12 items-center justify-between gap-6">
          <div className="flex items-center gap-6">
            <Phone className="size-4 shrink-0 text-brand-green" />
            {site.phones.map((p) => (
              <a
                key={p.number}
                href={`tel:${p.number.replace(/[\s()]/g, "")}`}
                className="flex items-baseline gap-2 text-sm font-bold text-background transition-colors hover:text-brand-green"
              >
                <span className="text-[11px] font-bold uppercase tracking-wider text-background/75">{p.country}</span>
                <span className="tabular-nums">{p.number}</span>
              </a>
            ))}
          </div>

          <a
            href={`mailto:${site.email}`}
            className="flex items-center gap-2 text-sm font-bold text-background transition-colors hover:text-brand-green"
          >
            <Mail className="size-4 text-brand-green" />
            {site.email}
          </a>
        </div>
      </div>

      {/* ---------- Main bar ---------- */}
      <div
        className="border-b border-border bg-background"
      >
        <div className="container flex h-24 items-center justify-between gap-6">
          <Link href="/" className="flex items-center" aria-label={`${site.name} home`}>
            <Image
              src="/mikan-logo.png"
              alt=""
              width={679}
              height={368}
              priority
              className="h-16 w-auto"
            />
            <span className="sr-only">{site.name}</span>
          </Link>

          <MainNav />

          <div className="flex items-center gap-3">
            <Button
              asChild
              variant="ghost"
              className="hidden h-11 rounded-none px-5 text-sm font-semibold text-foreground hover:bg-secondary sm:inline-flex"
            >
              <Link href="/portal" target="_blank" rel="noopener noreferrer">Client Portal</Link>
            </Button>

            <QuoteDialog>
              <Button className="group hidden h-11 rounded-none bg-brand-green px-6 text-sm font-semibold text-white shadow-none transition-all hover:bg-brand-green/90 hover:shadow-lg hover:shadow-brand-green/25 sm:inline-flex">
                Request a quote
                <span className="ml-2.5 inline-block transition-transform duration-300 group-hover:translate-x-1">→</span>
              </Button>
            </QuoteDialog>

            <Sheet open={open} onOpenChange={setOpen}>
              <SheetTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label="Open menu"
                  className="size-11 rounded-none lg:hidden"
                >
                  <Menu className="size-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-full max-w-sm">
                <SheetTitle className="text-left font-display text-lg uppercase tracking-wide">Menu</SheetTitle>

                <nav className="mt-8 flex flex-col" aria-label="Mobile">
                  {nav.map((item) => {
                    const Icon = NAV_ICONS[item.icon] ?? Layers;
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={() => setOpen(false)}
                        className="group flex items-center gap-4 border-b border-border py-4 font-display text-xl uppercase transition-colors hover:text-brand-green"
                      >
                        <Icon className="size-5 text-brand-green transition-transform duration-300 group-hover:scale-110" />
                        {item.label}
                      </Link>
                    );
                  })}
                </nav>

                <div className="mt-8 flex flex-col gap-3">
                  <QuoteDialog>
                    <Button className="h-12 rounded-none bg-brand-green font-semibold text-white hover:bg-brand-green/90">
                      Request a quote
                    </Button>
                  </QuoteDialog>
                  <Button asChild variant="outline" className="h-12 rounded-none">
                    <Link href="/portal" target="_blank" rel="noopener noreferrer" onClick={() => setOpen(false)}>Client Portal</Link>
                  </Button>
                </div>

                <div className="mt-10 space-y-3 border-t border-border pt-6">
                  <a href={`tel:${site.phone.replace(/\s/g, "")}`} className="flex items-center gap-3 text-sm text-muted-foreground">
                    <Phone className="size-4 text-brand-green" />
                    <span className="font-mono">{site.phone}</span>
                  </a>
                  <a href={`mailto:${site.email}`} className="flex items-center gap-3 text-sm text-muted-foreground">
                    <Mail className="size-4 text-brand-green" />
                    <span className="font-mono">{site.email}</span>
                  </a>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </header>
  );
}
