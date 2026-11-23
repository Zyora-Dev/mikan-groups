import Image from "next/image";
import Link from "next/link";
import { ChevronRight } from "lucide-react";

export function PageHero({
  eyebrow, title, intro, image, breadcrumb,
}: {
  eyebrow: string;
  title: React.ReactNode;
  intro?: string;
  image: string;
  breadcrumb: string;
}) {
  return (
    <section className="relative isolate overflow-hidden bg-neutral-950">
      <Image
        src={image}
        alt=""
        fill
        priority
        sizes="100vw"
        aria-hidden="true"
        className="object-cover"
      />
      <div className="absolute inset-0 bg-neutral-950/70" />
      <div className="absolute inset-0 bg-gradient-to-r from-neutral-950/85 via-neutral-950/35 to-transparent" />
      <div className="absolute inset-0 bg-grid opacity-[0.07]" aria-hidden="true" />

      <div className="container relative py-20 md:py-28">
        <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-sm font-bold uppercase tracking-wide">
          <Link href="/" className="text-white/75 transition-colors hover:text-brand-green">
            Home
          </Link>
          <ChevronRight className="size-3 text-white/35" />
          <span className="text-brand-green">{breadcrumb}</span>
        </nav>

        <div className="mt-8 flex items-center gap-3">
          <span className="h-px w-10 bg-brand-green" />
          <span className="text-sm font-bold uppercase tracking-[0.14em] text-brand-green">
            {eyebrow}
          </span>
        </div>

        <h1 className="mt-5 max-w-3xl text-balance font-display text-4xl font-700 uppercase leading-[1.02] text-white md:text-6xl">
          {title}
        </h1>

        {intro && (
          <p className="mt-6 max-w-2xl text-lg font-medium leading-[1.7] text-white">{intro}</p>
        )}
      </div>
    </section>
  );
}
