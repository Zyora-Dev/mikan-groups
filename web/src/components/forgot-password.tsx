"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import {
  ArrowLeft, CheckCircle2, Loader2, Mail, ShieldCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ApiError, api } from "@/lib/api";
import { site } from "@/lib/site";

/** `scope` keeps the two doors apart: a client cannot request a link
 *  into the internal app, and the server enforces the same rule. */
export function ForgotPassword({
  scope = "portal",
}: {
  scope?: "portal" | "team";
}) {
  const isTeam = scope === "team";
  const back = isTeam ? "/internal/erp/team/login" : "/portal";

  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const email = String(new FormData(e.currentTarget).get("email") ?? "").trim();

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError("Enter a valid email address.");
      return;
    }

    setError(null);
    setBusy(true);
    try {
      await api.forgotPassword(email, scope);
      setSent(true);
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : "Could not reach the server. Try again.",
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="relative flex min-h-screen items-center justify-center bg-neutral-950 px-4 py-10">
      <div className="pointer-events-none absolute inset-0 bg-grid opacity-[0.05]" aria-hidden="true" />

      <div className="relative w-full max-w-md">
        <div className="rounded-xl border border-white/10 bg-neutral-900 p-8">
          <div className="flex items-center gap-4">
            <div className="bg-white p-2.5">
              <Image src="/mikan-logo.png" alt={site.name} width={679} height={368}
                priority className="h-7 w-auto" />
            </div>
            <div className="border-l border-white/15 pl-4">
              <p className="font-display text-base font-700 uppercase leading-none text-white">
                {isTeam ? "ERP" : "Portal"}
              </p>
              <p className="mt-1 text-xs font-bold uppercase tracking-wide text-brand-green">
                Password help
              </p>
            </div>
          </div>

          {sent ? (
            <div className="mt-8">
              <div className="flex items-start gap-3.5">
                <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-brand-green/15">
                  <CheckCircle2 className="size-5 text-brand-green" />
                </span>
                <div>
                  <h1 className="font-display text-xl font-700 uppercase leading-tight text-white">
                    Check your inbox
                  </h1>
                  <p className="mt-2.5 text-sm font-medium leading-relaxed text-white/65">
                    If that address has an account, a reset link is on its way.
                    It works once and expires in an hour.
                  </p>
                  <p className="mt-3 text-sm font-medium leading-relaxed text-white/45">
                    Nothing after a few minutes? Check your spam folder, or
                    contact us at{" "}
                    <a href={`mailto:${site.email}`}
                      className="font-bold text-brand-green hover:underline">
                      {site.email}
                    </a>.
                  </p>
                </div>
              </div>

              <Link href={back}
                className="mt-8 inline-flex items-center gap-2 text-sm font-bold text-white/70 transition-colors hover:text-white">
                <ArrowLeft className="size-4" /> Back to sign in
              </Link>
            </div>
          ) : (
            <>
              <h1 className="mt-7 font-display text-2xl font-700 uppercase leading-tight text-white">
                Forgot your password?
              </h1>
              <p className="mt-2.5 text-sm font-medium leading-relaxed text-white/60">
                Enter the address you sign in with and we&apos;ll email you a
                link to choose a new password.
              </p>

              <form onSubmit={onSubmit} noValidate className="mt-7 space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-xs font-bold uppercase tracking-wide text-white/80">
                    Email address
                  </Label>
                  <div className="relative">
                    <Mail className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-white/40" />
                    <Input id="email" name="email" type="email" autoComplete="email"
                      autoFocus placeholder="you@company.com"
                      className="h-12 rounded-lg border-white/15 bg-neutral-950 pl-11 text-sm font-medium text-white placeholder:text-white/30" />
                  </div>
                </div>

                {error && (
                  <p className="border-l-2 border-brand-ember bg-brand-ember/5 px-4 py-3 text-sm font-semibold text-brand-ember">
                    {error}
                  </p>
                )}

                <Button type="submit" disabled={busy}
                  className="h-12 w-full rounded-lg bg-brand-green text-sm font-bold text-white hover:bg-brand-green/90">
                  {busy ? <Loader2 className="size-4 animate-spin" /> : "Email me a link"}
                </Button>
              </form>

              <Link href={back}
                className="mt-6 inline-flex items-center gap-2 text-sm font-bold text-white/60 transition-colors hover:text-white">
                <ArrowLeft className="size-4" /> Back to sign in
              </Link>
            </>
          )}
        </div>

        <p className="mt-5 flex items-center justify-center gap-2 text-xs font-semibold text-white/40">
          <ShieldCheck className="size-3.5 text-brand-green" />
          We never ask for your password by email
        </p>
      </div>
    </main>
  );
}
