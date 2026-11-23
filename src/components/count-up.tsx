"use client";

import { useEffect, useRef, useState } from "react";

export function CountUp({
  to, suffix = "", duration = 1600, className,
}: { to: number; suffix?: string; duration?: number; className?: string }) {
  const ref = useRef<HTMLParagraphElement>(null);
  const [n, setN] = useState(0);
  const [start, setStart] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { setStart(true); io.disconnect(); } },
      { threshold: 0.4 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    if (!start) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) { setN(to); return; }
    let raf = 0;
    const t0 = performance.now();
    const tick = (now: number) => {
      const p = Math.min((now - t0) / duration, 1);
      setN(Math.round(to * (1 - Math.pow(1 - p, 3))));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [start, to, duration]);

  return (
    <p ref={ref} className={className}>
      {n}
      <span className="text-brand-green">{suffix}</span>
    </p>
  );
}
