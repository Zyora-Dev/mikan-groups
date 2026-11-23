"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Building2, FileText, LayoutDashboard, LogOut, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { type Session, api } from "@/lib/api";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/internal/erp/team", label: "Dashboard", Icon: LayoutDashboard },
  { href: "/internal/erp/team/members", label: "Team", Icon: Users },
  { href: "/internal/erp/team/clients", label: "Clients", Icon: Building2 },
  { href: "/internal/erp/team/projects", label: "Projects", Icon: FileText },
];

export function TeamShell({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [session, setSession] = useState<Session | null>(null);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    api
      .me()
      .then(setSession)
      .catch(() => router.replace("/internal/erp/team/login"))
      .finally(() => setChecking(false));
  }, [router]);

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

  return (
    <main className="min-h-screen bg-neutral-950 text-white">
      <header className="border-b border-white/10 bg-neutral-900">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-6 px-6">
          <div className="flex items-center gap-5">
            <Link href="/internal/erp/team" className="flex items-center gap-4">
              <span className="bg-white p-1.5">
                <Image src="/mikan-logo.png" alt="Mikan" width={679} height={368}
                  priority className="h-6 w-auto" />
              </span>
              <span className="border-l border-white/15 pl-4 font-display text-base font-700 uppercase">
                ERP
              </span>
            </Link>

            <nav className="hidden items-center gap-1 md:flex" aria-label="Internal">
              {NAV.filter((n) => isAdmin || n.href !== "/internal/erp/team/members").map(
                ({ href, label, Icon }) => {
                  const active = pathname === href;
                  return (
                    <Link key={href} href={href}
                      aria-current={active ? "page" : undefined}
                      className={cn(
                        "flex items-center gap-2 px-3.5 py-2 text-sm font-semibold transition-colors",
                        active
                          ? "bg-white/10 text-white"
                          : "text-white/60 hover:bg-white/5 hover:text-white"
                      )}>
                      <Icon className={cn("size-4", active && "text-brand-green")} />
                      {label}
                    </Link>
                  );
                }
              )}
            </nav>
          </div>

          <div className="flex items-center gap-5">
            <div className="text-right">
              <p className="text-sm font-bold leading-tight">{session.user.full_name}</p>
              <p className="text-xs font-semibold uppercase tracking-wide text-brand-green">
                {session.user.role}
              </p>
            </div>
            <Button onClick={signOut} variant="ghost"
              className="h-10 rounded-none px-4 text-sm font-semibold text-white/70 hover:bg-white/10 hover:text-white">
              <LogOut className="mr-2 size-4" /> Sign out
            </Button>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-6 py-12">{children}</div>
    </main>
  );
}
