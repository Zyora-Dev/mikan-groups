"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Building2, FileText, LogOut, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { type Session, api } from "@/lib/api";

export function TeamDashboard() {
  const router = useRouter();
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
        <p className="text-sm font-bold uppercase tracking-wide text-white/50">
          Loading…
        </p>
      </main>
    );
  }

  if (!session) return null;

  return (
    <main className="min-h-screen bg-neutral-950 text-white">
      {/* ---- top bar ---- */}
      <header className="border-b border-white/10 bg-neutral-900">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-6 px-6">
          <div className="flex items-center gap-4">
            <div className="bg-white p-1.5">
              <Image src="/mikan-logo.png" alt="Mikan" width={679} height={368}
                priority className="h-6 w-auto" />
            </div>
            <span className="border-l border-white/15 pl-4 font-display text-base font-700 uppercase">
              ERP
            </span>
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

      <div className="mx-auto max-w-7xl px-6 py-12">
        <h1 className="font-display text-3xl font-700 uppercase leading-none">
          Welcome back
        </h1>
        <p className="mt-3 text-base font-medium text-white/65">
          {session.organisation.name}
        </p>

        {/* ---- what comes next ---- */}
        <div className="mt-10 grid gap-px bg-white/10 sm:grid-cols-3">
          {[
            { Icon: Building2, title: "Client organisations", body: "Create client companies and invite their people." },
            { Icon: Users, title: "Team members", body: "Add engineers and checkers to the Mikan organisation." },
            { Icon: FileText, title: "Drawing register", body: "Projects, drawings, revisions and issue status." },
          ].map(({ Icon, title, body }) => (
            <div key={title} className="bg-neutral-900 p-8">
              <Icon className="size-6 text-brand-green" />
              <h2 className="mt-5 font-display text-lg font-700 uppercase leading-tight">
                {title}
              </h2>
              <p className="mt-3 text-sm leading-relaxed text-white/65">{body}</p>
              <p className="mt-5 inline-block border border-white/15 px-2.5 py-1 text-xs font-bold uppercase tracking-wide text-white/45">
                Next to build
              </p>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
