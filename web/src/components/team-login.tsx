"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ArrowRight, Eye, EyeOff, Loader2, Lock, Mail, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ApiError, api } from "@/lib/api";

export function TeamLogin() {
  const router = useRouter();
  const [reveal, setReveal] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const email = String(fd.get("email") ?? "").trim();
    const password = String(fd.get("password") ?? "");

    if (!email || !password) {
      setError("Enter your email and password.");
      return;
    }

    setError(null);
    setBusy(true);
    try {
      const session = await api.login(email, password, true);
      // An admin set this password, so make them replace it before anything else.
      router.push(
        session.user.must_change_password
          ? "/internal/erp/team/password"
          : "/internal/erp/team"
      );
      router.refresh();
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : "Cannot reach the server. Check your connection."
      );
      setBusy(false);
    }
  }

  return (
    <main className="relative flex min-h-screen items-center justify-center bg-neutral-950 px-4 py-10">
      <div className="pointer-events-none absolute inset-0 bg-grid opacity-[0.05]" aria-hidden="true" />

      <div className="relative w-full max-w-md">
        {/* internal marker */}
        <div className="mb-5 flex items-center justify-center gap-2.5 border border-brand-orange/30 bg-brand-orange/10 px-4 py-2.5">
          <ShieldAlert className="size-4 shrink-0 text-brand-orange" />
          <p className="text-xs font-bold uppercase tracking-wide text-brand-orange">
            Internal system · Authorised staff only
          </p>
        </div>

        <div className="border border-white/10 bg-neutral-900 p-8 md:p-10">
          <div className="flex items-center gap-4">
            <div className="bg-white p-2.5">
              <Image src="/mikan-logo.png" alt="Mikan" width={679} height={368}
                priority className="h-8 w-auto" />
            </div>
            <div className="border-l border-white/15 pl-4">
              <p className="font-display text-lg font-700 uppercase leading-none text-white">
                ERP
              </p>
              <p className="mt-1 text-xs font-bold uppercase tracking-wide text-brand-green">
                Team access
              </p>
            </div>
          </div>

          <h1 className="mt-8 font-display text-3xl font-700 uppercase leading-none text-white">
            Sign in
          </h1>
          <p className="mt-2.5 text-sm font-medium text-white/65">
            Use your Mikan account. Client credentials will not work here.
          </p>

          <form onSubmit={onSubmit} noValidate className="mt-7 space-y-5">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-xs font-bold uppercase tracking-wide text-white/80">
                Email
              </Label>
              <div className="relative">
                <Mail className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-white/40" />
                <Input id="email" name="email" type="email" autoComplete="username"
                  placeholder="you@mikan-groups.com" disabled={busy}
                  className="h-13 rounded-lg border-white/15 bg-neutral-950 pl-11 text-base font-medium text-white placeholder:text-white/35 focus-visible:border-brand-green" />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password" className="text-xs font-bold uppercase tracking-wide text-white/80">
                  Password
                </Label>
                <Link href="/internal/erp/team/forgot-password"
                  className="text-xs font-bold text-brand-green underline-offset-4 hover:underline">
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <Lock className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-white/40" />
                <Input id="password" name="password" autoComplete="current-password"
                  type={reveal ? "text" : "password"} placeholder="Enter password" disabled={busy}
                  className="h-13 rounded-lg border-white/15 bg-neutral-950 px-11 text-base font-medium text-white placeholder:text-white/35 focus-visible:border-brand-green" />
                <button type="button" onClick={() => setReveal((r) => !r)}
                  aria-label={reveal ? "Hide password" : "Show password"}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 text-white/45 transition-colors hover:text-white">
                  {reveal ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>
            </div>

            {error && (
              <p role="alert" className="animate-fade-up border-l-2 border-brand-ember bg-brand-ember/10 px-4 py-3 text-sm font-semibold text-brand-ember">
                {error}
              </p>
            )}

            <Button type="submit" disabled={busy}
              className="group h-13 w-full rounded-lg bg-brand-green text-base font-semibold text-white hover:bg-brand-green/90 disabled:opacity-60">
              {busy ? (
                <>Signing in <Loader2 className="ml-3 size-4 animate-spin" /></>
              ) : (
                <>Sign in <ArrowRight className="ml-3 size-4 transition-transform duration-300 group-hover:translate-x-1" /></>
              )}
            </Button>
          </form>

          <p className="mt-7 border-t border-white/10 pt-6 text-xs font-medium leading-relaxed text-white/50">
            Accounts are issued by an administrator. Five failed attempts lock
            the account for fifteen minutes.
          </p>
        </div>
      </div>
    </main>
  );
}
