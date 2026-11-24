"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  FolderKanban, LayoutDashboard, LifeBuoy, Menu, Paperclip, X,
} from "lucide-react";
import { AccountMenu } from "@/components/account-menu";
import { NotificationBell } from "@/components/notification-bell";
import { type Session, api } from "@/lib/api";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/portal/overview", label: "Overview", Icon: LayoutDashboard },
  { href: "/portal/projects", label: "Projects", Icon: FolderKanban },
  { href: "/portal/files", label: "Files", Icon: Paperclip },
  { href: "/portal/support", label: "Support", Icon: LifeBuoy },
];

function titleFor(pathname: string | null): string {
  if (!pathname) return "";
  const exact = NAV.find((n) => n.href === pathname);
  if (exact) return exact.label;
  if (pathname.startsWith("/portal/projects/")) return "Project";
  if (pathname.startsWith("/portal/account")) return "Account";
  if (pathname.startsWith("/portal/password")) return "Password";
  const section = NAV.find((n) => pathname.startsWith(`${n.href}/`));
  return section?.label ?? "";
}

export function PortalShell({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [session, setSession] = useState<Session | null>(null);
  const [checking, setChecking] = useState(true);
  const [navOpen, setNavOpen] = useState(false);

  useEffect(() => {
    api.me()
      .then((s) => {
        // Staff have their own application; don't let them land here.
        if (s.user.role !== "client" && s.user.role !== "client_admin") {
          router.replace("/internal/erp/team");
          return;
        }
        if (s.user.must_change_password) {
          router.replace("/portal/password");
          return;
        }
        setSession(s);
      })
      .catch(() => router.replace("/portal"))
      .finally(() => setChecking(false));
  }, [router]);

  useEffect(() => setNavOpen(false), [pathname]);

  if (checking) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-neutral-950">
        <p className="text-sm font-bold uppercase tracking-wide text-white/45">Loading…</p>
      </main>
    );
  }
  if (!session) return null;

  const nav = (
    <nav className="flex h-full flex-col" aria-label="Client portal">
      <Link href="/portal/overview" className="flex items-center gap-3.5 px-6 py-6">
        <span className="bg-white p-1.5">
          <Image src="/mikan-logo.png" alt="Mikan" width={679} height={368}
            priority className="h-6 w-auto" />
        </span>
        <span className="border-l border-white/15 pl-3.5 font-display text-base font-700 uppercase text-white">
          Portal
        </span>
      </Link>

      <div className="mx-6 border-y border-white/[0.07] py-4">
        <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-white/35">
          Signed in for
        </p>
        <p className="mt-1.5 truncate text-sm font-bold leading-snug text-white">
          {session.organisation.name}
        </p>
      </div>

      <div className="px-3 py-3">
        <p className="px-3 py-2 text-[10px] font-bold uppercase tracking-[0.18em] text-white/35">
          Menu
        </p>
        <ul className="space-y-0.5">
          {NAV.map(({ href, label, Icon }) => {
            const active = pathname === href || pathname?.startsWith(`${href}/`);
            return (
              <li key={href}>
                <Link href={href} aria-current={active ? "page" : undefined}
                  className={cn(
                    "relative flex items-center gap-3 px-3 py-2.5 text-sm font-semibold transition-colors",
                    active
                      ? "bg-white/[0.07] text-white"
                      : "text-white/55 hover:bg-white/[0.04] hover:text-white"
                  )}>
                  {active && <span className="absolute inset-y-1 left-0 w-0.5 bg-brand-green" />}
                  <Icon className={cn("size-4", active ? "text-brand-green" : "text-white/40")} />
                  {label}
                </Link>
              </li>
            );
          })}
        </ul>
      </div>


    </nav>
  );

  return (
    <div className="min-h-screen bg-neutral-950 text-white">
      <aside className="fixed inset-y-0 left-0 hidden w-60 border-r border-white/10 bg-neutral-900 lg:block">
        {nav}
      </aside>

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
        <header className="sticky top-0 z-30 border-b border-white/10 bg-neutral-950/90 backdrop-blur-md">
          <div className="mx-auto flex h-16 max-w-[88rem] items-center gap-4 px-5 lg:px-10">
            <button onClick={() => setNavOpen(true)} aria-label="Open menu"
              className="text-white/60 transition-colors hover:text-white lg:hidden">
              <Menu className="size-5" />
            </button>

            <p className="truncate font-display text-base font-700 uppercase tracking-wide text-white/80">
              {titleFor(pathname)}
            </p>

            <div className="ml-auto flex items-center gap-2.5">
              <NotificationBell />
              <AccountMenu session={session} variant="portal" />
            </div>
          </div>
        </header>

        <div className="mx-auto max-w-[88rem] px-5 py-8 lg:px-10 lg:py-10">
          {children}
        </div>
      </div>
    </div>
  );
}
