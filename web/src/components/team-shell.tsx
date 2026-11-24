"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  Building2, FolderKanban, LayoutDashboard, LogOut, Menu, Users, X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { type Session, api } from "@/lib/api";
import { initials } from "@/lib/project-ui";
import { cn } from "@/lib/utils";

const MAIN = [
  { href: "/internal/erp/team", label: "Dashboard", Icon: LayoutDashboard },
  { href: "/internal/erp/team/clients", label: "Clients", Icon: Building2 },
  { href: "/internal/erp/team/projects", label: "Projects", Icon: FolderKanban },
];

const MANAGE = [
  { href: "/internal/erp/team/members", label: "Team", Icon: Users, adminOnly: true },
];

export function TeamShell({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [session, setSession] = useState<Session | null>(null);
  const [checking, setChecking] = useState(true);
  const [navOpen, setNavOpen] = useState(false);

  useEffect(() => {
    api.me().then(setSession)
      .catch(() => router.replace("/internal/erp/team/login"))
      .finally(() => setChecking(false));
  }, [router]);

  useEffect(() => setNavOpen(false), [pathname]);

  async function signOut() {
    await api.logout().catch(() => {});
    router.replace("/internal/erp/team/login");
  }

  if (checking) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-neutral-950">
        <p className="text-sm font-bold uppercase tracking-wide text-white/45">Loading…</p>
      </main>
    );
  }
  if (!session) return null;

  const isAdmin = session.user.role === "admin";
  const visible = MANAGE.filter((n) => !n.adminOnly || isAdmin);

  const nav = (
    <nav className="flex h-full flex-col" aria-label="Internal">
      <Link href="/internal/erp/team" className="flex items-center gap-3.5 px-6 py-6">
        <span className="bg-white p-1.5">
          <Image src="/mikan-logo.png" alt="Mikan" width={679} height={368}
            priority className="h-6 w-auto" />
        </span>
        <span className="border-l border-white/15 pl-3.5 font-display text-base font-700 uppercase text-white">
          ERP
        </span>
      </Link>

      <Section label="Main" items={MAIN} pathname={pathname} />
      {visible.length > 0 && (
        <Section label="Management" items={visible} pathname={pathname} />
      )}

      <div className="mt-auto border-t border-white/10 p-4">
        <div className="flex items-center gap-3 px-2 py-2">
          <span className="flex size-9 shrink-0 items-center justify-center border border-brand-green/30 bg-brand-green/10 text-[11px] font-bold text-brand-green">
            {initials(session.user.full_name)}
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-bold text-white">
              {session.user.full_name}
            </p>
            <p className="truncate text-[11px] font-bold uppercase tracking-wide text-brand-green">
              {session.user.role}
            </p>
          </div>
        </div>
        <Button onClick={signOut} variant="ghost"
          className="mt-2 h-10 w-full justify-start rounded-none px-2 text-sm font-semibold text-white/60 hover:bg-white/5 hover:text-white">
          <LogOut className="mr-2.5 size-4" /> Sign out
        </Button>
      </div>
    </nav>
  );

  return (
    <div className="min-h-screen bg-neutral-950 text-white">
      {/* desktop rail */}
      <aside className="fixed inset-y-0 left-0 hidden w-60 border-r border-white/10 bg-neutral-900 lg:block">
        {nav}
      </aside>

      {/* mobile */}
      {navOpen && (
        <>
          <button aria-label="Close menu" onClick={() => setNavOpen(false)}
            className="fixed inset-0 z-40 bg-black/70 lg:hidden" />
          <aside className="fixed inset-y-0 left-0 z-50 w-64 border-r border-white/10 bg-neutral-900 lg:hidden">
            <button onClick={() => setNavOpen(false)} aria-label="Close"
              className="absolute right-4 top-6 text-white/50 hover:text-white">
              <X className="size-5" />
            </button>
            {nav}
          </aside>
        </>
      )}

      <div className="lg:pl-60">
        <header className="flex h-16 items-center gap-4 border-b border-white/10 bg-neutral-900 px-5 lg:hidden">
          <button onClick={() => setNavOpen(true)} aria-label="Open menu"
            className="text-white/70 hover:text-white">
            <Menu className="size-5" />
          </button>
          <span className="font-display text-base font-700 uppercase">ERP</span>
        </header>

        <div className="mx-auto max-w-[88rem] px-5 py-8 lg:px-10 lg:py-10">
          {children}
        </div>
      </div>
    </div>
  );
}

function Section({
  label, items, pathname,
}: {
  label: string;
  items: { href: string; label: string; Icon: React.ComponentType<{ className?: string }> }[];
  pathname: string | null;
}) {
  return (
    <div className="px-3 py-2">
      <p className="px-3 py-2 text-[10px] font-bold uppercase tracking-[0.18em] text-white/35">
        {label}
      </p>
      <ul className="space-y-0.5">
        {items.map(({ href, label: text, Icon }) => {
          // Dashboard is the index, so it must match exactly — otherwise its
          // prefix matches every other route under /internal/erp/team.
          const isIndex = href === "/internal/erp/team";
          const active = isIndex
            ? pathname === href
            : pathname === href || pathname?.startsWith(`${href}/`);
          return (
            <li key={href}>
              <Link href={href} aria-current={active ? "page" : undefined}
                className={cn(
                  "relative flex items-center gap-3 px-3 py-2.5 text-sm font-semibold transition-colors",
                  active ? "bg-white/[0.07] text-white" : "text-white/55 hover:bg-white/[0.04] hover:text-white"
                )}>
                {active && <span className="absolute inset-y-1 left-0 w-0.5 bg-brand-green" />}
                <Icon className={cn("size-4", active ? "text-brand-green" : "text-white/40")} />
                {text}
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
