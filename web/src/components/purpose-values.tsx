"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ArrowRight, Compass, Handshake, Leaf, Lightbulb, Target, TrendingUp, Users,
  type LucideIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { about } from "@/lib/site";
import { cn } from "@/lib/utils";

const ICONS: Record<string, LucideIcon> = {
  Handshake, Leaf, Lightbulb, TrendingUp, Users,
};

export function PurposeValues() {
  const [active, setActive] = useState(0);
  const current = about.values[active];
  const CurrentIcon = ICONS[current.icon] ?? Handshake;

  return (
    <div className="mt-20 border-t border-border pt-16">
      {/* ---------- Mission & Vision, side by side ---------- */}
      <div className="grid gap-px bg-border md:grid-cols-2">
        {[
          { Icon: Target, label: "Mission", body: about.mission },
          { Icon: Compass, label: "Vision", body: about.vision },
        ].map(({ Icon, label, body }) => (
          <div key={label} className="bg-background p-9 md:p-11">
            <div className="flex items-center gap-4">
              <span className="flex size-12 shrink-0 items-center justify-center bg-brand-green/10">
                <Icon className="size-6 text-brand-green" aria-hidden="true" />
              </span>
              <h3 className="font-display text-2xl font-700 uppercase tracking-wide text-foreground">
                {label}
              </h3>
            </div>
            <p className="mt-6 text-[17px] leading-[1.7] text-foreground/85">{body}</p>
          </div>
        ))}
      </div>

      {/* ---------- Core values ---------- */}
      <div className="mt-16">
        <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
          <div>
            <div className="flex items-center gap-3">
              <span className="h-px w-10 bg-brand-green" />
              <span className="text-sm font-bold uppercase tracking-[0.14em] text-primary">
                Core values
              </span>
            </div>
            <h3 className="mt-5 font-display text-3xl font-700 uppercase leading-tight md:text-4xl">
              What we hold ourselves to
            </h3>
          </div>

          <Button
            asChild
            className="group h-12 self-start rounded-none bg-brand-green px-7 font-semibold text-white hover:bg-brand-green/90 md:self-auto"
          >
            <Link href="/services">
              What we do
              <ArrowRight className="ml-2.5 size-4 transition-transform group-hover:translate-x-1" />
            </Link>
          </Button>
        </div>

        {/* Tab row */}
        <div className="mt-10 grid gap-px border-y border-border bg-border sm:grid-cols-3 lg:grid-cols-5">
          {about.values.map((v, i) => {
            const Icon = ICONS[v.icon] ?? Handshake;
            const isActive = i === active;
            return (
              <button
                key={v.title}
                type="button"
                onClick={() => setActive(i)}
                onMouseEnter={() => setActive(i)}
                aria-current={isActive}
                className={cn(
                  "group relative flex flex-col gap-3 p-6 text-left transition-colors",
                  isActive ? "bg-foreground text-background" : "bg-background hover:bg-secondary"
                )}
              >
                <span className="flex items-center justify-between">
                  <Icon
                    className={cn(
                      "size-5 transition-colors",
                      isActive ? "text-brand-green" : "text-foreground/65"
                    )}
                  />
                  <span
                    className={cn(
                      "font-mono text-xs font-semibold tabular-nums",
                      isActive ? "text-background/75" : "text-foreground/60"
                    )}
                  >
                    {String(i + 1).padStart(2, "0")}
                  </span>
                </span>
                <span className="font-display text-base font-600 uppercase leading-tight tracking-wide">
                  {v.title}
                </span>
              </button>
            );
          })}
        </div>

        {/* Detail panel */}
        <div className="grid items-center gap-8 bg-secondary/50 p-9 md:grid-cols-[auto_1fr] md:p-12">
          <span className="flex size-16 shrink-0 items-center justify-center bg-brand-green">
            <CurrentIcon className="size-8 text-white" aria-hidden="true" />
          </span>
          <div>
            <h4 className="font-display text-2xl font-700 uppercase leading-tight md:text-3xl">
              {current.title}
            </h4>
            <p className="mt-4 max-w-3xl text-[17px] leading-[1.7] text-foreground/85">
              {current.body}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
