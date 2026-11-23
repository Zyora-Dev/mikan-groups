import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageHero } from "@/components/page-hero";

export const metadata: Metadata = {
  title: "Sectors",
  description: "Sectors — Mikan Engineering & Construction.",
};

export default function SectorsPage() {
  return (
    <>
      <PageHero
        breadcrumb="Sectors"
        eyebrow="Where we work"
        title={<>Where our<br />drawings end up</>}
        image="/media/industrial-plant.jpg"
      />

      <section className="container py-24 text-center md:py-32">
        <p className="mx-auto max-w-xl leading-relaxed text-foreground/75">
          This page is in preparation. In the meantime you can see this content
          on the homepage, or get in touch and we&apos;ll answer directly.
        </p>
        <div className="mt-9 flex flex-wrap justify-center gap-3">
          <Button asChild className="group h-12 rounded-none bg-brand-green px-7 font-semibold text-white hover:bg-brand-green/90">
            <Link href="/contact">
              Contact us
              <ArrowRight className="ml-2.5 size-4 transition-transform group-hover:translate-x-1" />
            </Link>
          </Button>
          <Button asChild variant="outline" className="h-12 rounded-none px-7">
            <Link href="/">Back to homepage</Link>
          </Button>
        </div>
      </section>
    </>
  );
}
