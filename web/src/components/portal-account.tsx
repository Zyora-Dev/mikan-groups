"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  Building2, KeyRound, Loader2, Mail, ShieldCheck, User,
} from "lucide-react";
import { type Session, api } from "@/lib/api";
import { formatDateTime, initials } from "@/lib/project-ui";

export function PortalAccount() {
  const [session, setSession] = useState<Session | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api.me()
      .then(setSession)
      .catch(() => setError("Could not load your account. Please refresh."));
  }, []);

  if (error) {
    return (
      <p className="border-l-2 border-brand-ember bg-brand-ember/5 px-5 py-4 text-sm font-semibold text-brand-ember">
        {error}
      </p>
    );
  }

  if (!session) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Loader2 className="size-6 animate-spin text-brand-green" />
      </div>
    );
  }

  const { user, organisation } = session;
  const isClientAdmin = user.role === "client_admin";

  return (
    <div className="max-w-3xl space-y-5">
      <header>
        <h1 className="font-display text-2xl font-700 uppercase leading-none text-white">
          Account
        </h1>
        <p className="mt-2 text-sm font-medium text-white/55">
          Your sign-in details and the organisation this access belongs to.
        </p>
      </header>

      {/* ---------- identity ---------- */}
      <section className="overflow-hidden rounded-xl border border-white/10 bg-neutral-900">
        <div className="flex flex-wrap items-center gap-4 border-b border-white/[0.07] px-5 py-5">
          <span className="flex size-14 shrink-0 items-center justify-center rounded-xl bg-brand-green/15 font-display text-lg font-700 text-brand-green">
            {initials(user.full_name)}
          </span>
          <div className="min-w-0">
            <p className="font-display text-xl font-700 uppercase leading-none text-white">
              {user.full_name}
            </p>
            <p className="mt-2 text-sm font-medium text-white/55">
              {user.job_title ?? (isClientAdmin ? "Account administrator" : "Project contact")}
            </p>
          </div>
          <span className="ml-auto rounded-full bg-white/10 px-3 py-1.5 text-xs font-bold text-white/80">
            {isClientAdmin ? "Account admin" : "Client"}
          </span>
        </div>

        <dl className="divide-y divide-white/[0.06]">
          <Row Icon={Mail} label="Email" value={user.email} />
          <Row Icon={Building2} label="Organisation" value={organisation.name} />
          <Row Icon={User} label="Last signed in"
            value={user.last_login_at ? formatDateTime(user.last_login_at) : "This is your first session"} />
        </dl>
      </section>

      {/* ---------- security ---------- */}
      <section className="overflow-hidden rounded-xl border border-white/10 bg-neutral-900">
        <header className="border-b border-white/[0.07] px-5 py-3.5">
          <h2 className="font-display text-base font-700 uppercase tracking-wide text-white">
            Security
          </h2>
        </header>

        <div className="flex flex-wrap items-center gap-4 px-5 py-4">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-white/[0.06]">
            <KeyRound className="size-4 text-brand-green" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-bold text-white">Password</p>
            <p className="mt-0.5 text-xs font-medium text-white/50">
              Choose something you haven&apos;t used elsewhere.
            </p>
          </div>
          <Link href="/portal/password"
            className="shrink-0 rounded-lg border border-white/15 px-4 py-2 text-xs font-bold text-white transition-colors hover:border-brand-green/50 hover:bg-brand-green/10">
            Change password
          </Link>
        </div>

        <div className="flex flex-wrap items-start gap-4 border-t border-white/[0.07] px-5 py-4">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-white/[0.06]">
            <ShieldCheck className="size-4 text-brand-green" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-bold text-white">What you can see</p>
            <p className="mt-0.5 text-xs font-medium leading-relaxed text-white/50">
              This account reaches only {organisation.name}&apos;s projects, files
              and comments. No other client&apos;s work is visible to you, and
              yours is not visible to them.
            </p>
          </div>
        </div>
      </section>

      {/* ---------- adding people ---------- */}
      <section className="rounded-xl border border-white/10 bg-neutral-900 px-5 py-4">
        <p className="text-sm font-bold text-white">
          Need access for a colleague?
        </p>
        <p className="mt-1.5 text-sm font-medium leading-relaxed text-white/55">
          Portal accounts are created by the Mikan team.{" "}
          <Link href="/portal/support" className="font-bold text-brand-green hover:underline">
            Contact us
          </Link>{" "}
          with their name, email and role and we&apos;ll set them up against{" "}
          {organisation.name}.
        </p>
      </section>
    </div>
  );
}

function Row({
  Icon, label, value,
}: {
  Icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
}) {
  return (
    <div className="flex flex-wrap items-center gap-4 px-5 py-3.5">
      <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-white/[0.06]">
        <Icon className="size-4 text-white/45" />
      </span>
      <dt className="w-32 shrink-0 text-xs font-bold uppercase tracking-wide text-white/40">
        {label}
      </dt>
      <dd className="min-w-0 flex-1 truncate text-sm font-bold text-white">{value}</dd>
    </div>
  );
}
