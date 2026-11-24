"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { ChevronDown, KeyRound, LogOut, Mail, User } from "lucide-react";
import { type Session, api } from "@/lib/api";
import { initials } from "@/lib/project-ui";
import { cn } from "@/lib/utils";

/** `variant` decides where sign-out lands and which links the menu offers. */
export function AccountMenu({
  session, variant = "team",
}: {
  session: Session;
  variant?: "team" | "portal";
}) {
  const router = useRouter();
  const isPortal = variant === "portal";
  const [open, setOpen] = useState(false);
  const wrap = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onClick(e: MouseEvent) {
      if (wrap.current && !wrap.current.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  async function signOut() {
    await api.logout().catch(() => {});
    router.replace(isPortal ? "/portal" : "/internal/erp/team/login");
  }

  const isAdmin = session.user.role === "admin";
  const isClientAdmin = session.user.role === "client_admin";

  return (
    <div className="relative" ref={wrap}>
      <button type="button" onClick={() => setOpen((o) => !o)}
        aria-expanded={open} aria-haspopup="menu"
        className={cn(
          "flex items-center gap-2.5 rounded-lg border py-1.5 pl-1.5 pr-3 transition-colors",
          open
            ? "border-white/20 bg-white/10"
            : "border-white/10 bg-white/[0.04] hover:border-white/20 hover:bg-white/[0.08]"
        )}>
        <span className="flex size-8 shrink-0 items-center justify-center rounded-md bg-brand-green/15 text-[11px] font-bold text-brand-green">
          {initials(session.user.full_name)}
        </span>
        <span className="hidden text-left sm:block">
          <span className="block max-w-[9rem] truncate text-xs font-bold leading-tight text-white">
            {session.user.full_name}
          </span>
          <span className="block text-[10px] font-bold uppercase tracking-wide text-brand-green">
            {isPortal ? (isClientAdmin ? "Account admin" : "Client") : session.user.role}
          </span>
        </span>
        <ChevronDown className={cn(
          "size-3.5 shrink-0 text-white/45 transition-transform",
          open && "rotate-180"
        )} />
      </button>

      {open && (
        <div role="menu"
          className="absolute right-0 top-12 z-50 w-64 overflow-hidden rounded-xl border border-white/10 bg-neutral-900 shadow-2xl">
          <div className="border-b border-white/[0.07] px-4 py-3.5">
            <p className="truncate text-sm font-bold text-white">
              {session.user.full_name}
            </p>
            <p className="mt-0.5 truncate text-xs font-medium text-white/50">
              {session.user.email}
            </p>
            <p className="mt-2 truncate text-[11px] font-medium text-white/40">
              {session.organisation.name}
            </p>
          </div>

          <nav className="p-1.5">
            <Item href={isPortal ? "/portal/password" : "/internal/erp/team/password"}
              Icon={KeyRound} label="Change password" onNavigate={() => setOpen(false)} />
            {isPortal ? (
              <Item href="/portal/account" Icon={User}
                label="Account" onNavigate={() => setOpen(false)} />
            ) : isAdmin && (
              <>
                <Item href="/internal/erp/team/members" Icon={User}
                  label="Team members" onNavigate={() => setOpen(false)} />
                <Item href="/internal/erp/team/settings" Icon={Mail}
                  label="Email settings" onNavigate={() => setOpen(false)} />
              </>
            )}
          </nav>

          <div className="border-t border-white/[0.07] p-1.5">
            <button type="button" role="menuitem" onClick={signOut}
              className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-semibold text-white/70 transition-colors hover:bg-brand-ember/10 hover:text-brand-ember">
              <LogOut className="size-4" /> Sign out
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function Item({
  href, Icon, label, onNavigate,
}: {
  href: string;
  Icon: React.ComponentType<{ className?: string }>;
  label: string;
  onNavigate: () => void;
}) {
  return (
    <Link href={href} role="menuitem" onClick={onNavigate}
      className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-semibold text-white/70 transition-colors hover:bg-white/[0.06] hover:text-white">
      <Icon className="size-4 text-white/45" /> {label}
    </Link>
  );
}
