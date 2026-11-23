"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Building2, Factory, HardHat, Layers, Mail, Users, type LucideIcon,
} from "lucide-react";
import { nav } from "@/lib/site";
import { cn } from "@/lib/utils";

const ICONS: Record<string, LucideIcon> = {
  Users, Layers, Building2, Factory, HardHat, Mail,
};

export function MainNav() {
  const pathname = usePathname();

  return (
    <nav className="hidden items-center gap-1 lg:flex" aria-label="Main">
      {nav.map((item) => {
        const Icon = ICONS[item.icon] ?? Layers;
        const active = pathname === item.href;

        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "group relative flex items-center overflow-hidden px-3.5 py-2.5 text-sm font-semibold transition-colors duration-300",
              active ? "text-foreground" : "text-foreground/70 hover:text-foreground"
            )}
          >
            {/* icon slides in from the left */}
            <span
              className={cn(
                "flex items-center overflow-hidden transition-all duration-[400ms] ease-[cubic-bezier(0.16,1,0.3,1)]",
                active
                  ? "w-[1.15rem] opacity-100"
                  : "w-0 opacity-0 group-hover:w-[1.15rem] group-hover:opacity-100"
              )}
            >
              <Icon
                className={cn(
                  "size-4 shrink-0 text-brand-green transition-transform duration-[400ms] ease-[cubic-bezier(0.16,1,0.3,1)]",
                  active ? "translate-x-0" : "-translate-x-2 group-hover:translate-x-0"
                )}
              />
            </span>

            {/* label nudges right to make room */}
            <span
              className={cn(
                "transition-transform duration-[400ms] ease-[cubic-bezier(0.16,1,0.3,1)]",
                active ? "translate-x-1.5" : "group-hover:translate-x-1.5"
              )}
            >
              {item.label}
            </span>

            {/* underline wipes left-to-right */}
            <span
              className={cn(
                "absolute inset-x-3.5 bottom-1 h-0.5 origin-left bg-brand-green transition-transform duration-[400ms] ease-[cubic-bezier(0.16,1,0.3,1)]",
                active ? "scale-x-100" : "scale-x-0 group-hover:scale-x-100"
              )}
            />
          </Link>
        );
      })}
    </nav>
  );
}
