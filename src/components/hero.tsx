"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { QuoteDialog } from "@/components/quote-dialog";
import { heroSlides } from "@/lib/site";

const SLIDE_MS = 7000;

export function Hero() {
  const [index, setIndex] = useState(0);
  const videoRef = useRef<HTMLVideoElement>(null);
  const slide = heroSlides[index];

  const next = useCallback(
    () => setIndex((i) => (i + 1) % heroSlides.length),
    []
  );

  // Advance on a timer so text and video stay in step even if a clip stalls.
  useEffect(() => {
    videoRef.current?.load();
    const t = window.setTimeout(next, SLIDE_MS);
    return () => window.clearTimeout(t);
  }, [index, next]);

  return (
    <section className="relative isolate flex min-h-[82vh] items-end overflow-hidden bg-neutral-950">
      <video
        ref={videoRef}
        autoPlay
        muted
        playsInline
        preload="auto"
        onError={next}
        poster="/media/hero-poster.jpg"
        aria-hidden="true"
        className="absolute inset-0 h-full w-full object-cover opacity-[0.88]"
      >
        <source src={slide.video} type="video/mp4" />
      </video>

      <div className="absolute inset-0 bg-gradient-to-t from-neutral-950/90 via-neutral-950/35 to-neutral-950/5" />
      <div className="absolute inset-0 bg-gradient-to-r from-neutral-950/70 via-neutral-950/15 to-transparent" />

      <div className="container relative z-10 pb-28 pt-24 md:pb-36 md:pt-32">
        {/* key on index restarts the entrance animation for each slide */}
        <div key={index} className="max-w-4xl">
          <div className="mb-7 flex animate-hero-rise flex-wrap items-center gap-x-4 gap-y-3">
            <span className="h-px w-12 origin-left animate-rule-grow bg-brand-green" />
            <span className="text-sm font-bold uppercase tracking-[0.14em] text-brand-green">
              {slide.kicker}
            </span>
            <span className="hidden h-3 w-px bg-white/25 sm:block" />
            <span className="flex items-center gap-2.5 text-sm font-bold uppercase tracking-[0.14em] text-white/80">
              {["India", "Singapore", "Ireland"].map((c, i) => (
                <span key={c} className="flex items-center gap-2.5">
                  {i > 0 && <span className="size-1 rounded-full bg-brand-green/70" />}
                  {c}
                </span>
              ))}
            </span>
          </div>

          <h1 className="text-balance font-display text-[clamp(2.5rem,7.5vw,6.5rem)] font-700 uppercase leading-[0.92] tracking-tight text-white [text-shadow:0_2px_28px_rgb(0_0_0/0.55)]">
            <span className="block animate-hero-rise [animation-delay:120ms]">{slide.headline[0]}</span>
            <span className="block animate-hero-rise [animation-delay:240ms]">
              {slide.headline[1]}{" "}
              <span className="text-brand-green">{slide.accent}</span>
            </span>
          </h1>

          <p className="mt-8 max-w-xl animate-hero-rise text-lg leading-relaxed text-white/85 [animation-delay:400ms] [text-shadow:0_1px_14px_rgb(0_0_0/0.6)]">
            {slide.body}
          </p>

          <div className="mt-11 flex animate-hero-rise flex-wrap items-center gap-4 [animation-delay:560ms]">
            <QuoteDialog>
              <Button
                size="lg"
                className="group h-14 rounded-none bg-brand-green px-8 text-base font-semibold text-white shadow-none transition-all hover:bg-brand-green/90 hover:shadow-xl hover:shadow-brand-green/30"
              >
                Request a quote
                <ArrowRight className="ml-3 size-4 transition-transform duration-300 group-hover:translate-x-1" />
              </Button>
            </QuoteDialog>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="group h-14 rounded-none border-white/30 bg-transparent px-8 text-base font-medium text-white backdrop-blur-sm transition-all hover:border-white hover:bg-white hover:text-neutral-950"
            >
              <Link href="/services">
                Our services
                <ArrowRight className="ml-3 size-4 transition-transform duration-300 group-hover:translate-x-1" />
              </Link>
            </Button>
          </div>
        </div>
      </div>

      <div className="absolute inset-x-0 bottom-0 z-10 border-t border-white/10 bg-neutral-950/45 backdrop-blur-sm">
        <div className="container flex flex-wrap items-center justify-between gap-x-10 gap-y-3 py-4">
          <div className="flex flex-wrap items-center gap-x-8 gap-y-2">
            {["ISO 9001", "ISO 14001", "ISO 45001"].map((t) => (
              <span key={t} className="text-sm font-bold uppercase tracking-wide text-white/75">{t}</span>
            ))}
          </div>

          <div className="flex items-center gap-2">
            {heroSlides.map((s, i) => (
              <button
                key={s.video}
                type="button"
                onClick={() => setIndex(i)}
                aria-label={`Show ${s.kicker}`}
                aria-current={i === index}
                className="group py-2"
              >
                <span className="relative block h-0.5 w-8 overflow-hidden bg-white/25 transition-colors group-hover:bg-white/50">
                  {i === index && (
                    <span
                      className="absolute inset-y-0 left-0 block w-full origin-left bg-brand-green"
                      style={{ animation: `rule-grow ${SLIDE_MS}ms linear both` }}
                    />
                  )}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
