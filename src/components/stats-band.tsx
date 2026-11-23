"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { Building2, Globe2, Layers, Users } from "lucide-react";
import { stats } from "@/lib/site";

const ICONS = [Users, Layers, Building2, Globe2];
const DURATION = 1600;

function useCountUp(target: number, start: boolean) {
  const [n, setN] = useState(0);

  useEffect(() => {
    if (!start) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setN(target);
      return;
    }
    let raf = 0;
    const t0 = performance.now();
    const tick = (now: number) => {
      const p = Math.min((now - t0) / DURATION, 1);
      // ease-out cubic
      setN(Math.round(target * (1 - Math.pow(1 - p, 3))));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, start]);

  return n;
}

function Stat({
  value, suffix, label, note, Icon, index, start,
}: {
  value: number; suffix: string; label: string; note: string;
  Icon: (typeof ICONS)[number]; index: number; start: boolean;
}) {
  const n = useCountUp(value, start);

  return (
    <div
      className="group relative bg-neutral-950/55 p-8 backdrop-blur-sm transition-colors duration-300 hover:bg-neutral-950/35 lg:p-10"
      style={{ animation: start ? `fade-up 0.7s cubic-bezier(0.22,1,0.36,1) ${index * 110}ms both` : undefined }}
    >
      {/* top rule wipes in on hover */}
      <span className="absolute inset-x-0 top-0 h-px origin-left scale-x-0 bg-brand-green transition-transform duration-500 group-hover:scale-x-100" />

      <Icon className="size-5 text-white/70 transition-colors duration-300 group-hover:text-brand-green" aria-hidden="true" />

      <p className="mt-7 font-display text-6xl font-600 leading-none tracking-tight tabular-nums text-white lg:text-[4.5rem]">
        {n}
        <span className="ml-0.5 text-brand-green/80">{suffix}</span>
      </p>

      <p className="mt-5 font-mono text-xs font-semibold uppercase tracking-[0.22em] text-brand-green">
        {label}
      </p>
      <p className="mt-3 text-sm leading-relaxed text-white/75">{note}</p>
    </div>
  );
}

export function StatsBand() {
  const ref = useRef<HTMLElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          io.disconnect();
        }
      },
      { threshold: 0.25 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <section ref={ref} className="relative isolate overflow-hidden border-y border-border">
      <Image
        src="/media/bim-model.jpg"
        alt=""
        fill
        sizes="100vw"
        aria-hidden="true"
        className="object-cover"
      />

      {/* Deep neutral scrim; green only as a trace */}
      <div className="absolute inset-0 bg-neutral-950/75" />
      <div className="absolute inset-0 bg-brand-green/10" />
      <div className="absolute inset-0 bg-gradient-to-br from-neutral-950/55 via-neutral-950/30 to-neutral-950/65" />
      <div className="absolute inset-0 bg-grid opacity-[0.07]" />

      <div className="container relative py-24 md:py-28">
        <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:gap-16">
          <div>
            <div className="flex items-center gap-3">
              <span className="h-px w-10 bg-brand-green" />
              <span className="text-sm font-bold uppercase tracking-[0.14em] text-brand-green">
                By the numbers
              </span>
            </div>
            <h2 className="mt-5 text-balance font-display text-3xl font-700 uppercase leading-tight text-white md:text-4xl">
              Built on delivery, not promises
            </h2>
          </div>

          <p className="border-l-2 border-brand-green pl-6 text-base leading-[1.7] text-white lg:self-center lg:text-lg">
            One team across three countries, working to the standards your
            project is governed by.
          </p>
        </div>

        <div className="mt-12 grid gap-px bg-white/10 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((s, i) => (
            <Stat
              key={s.label}
              value={s.value}
              suffix={s.suffix}
              label={s.label}
              note={s.note}
              Icon={ICONS[i]}
              index={i}
              start={visible}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
