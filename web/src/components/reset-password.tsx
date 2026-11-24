"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import {
  AlertCircle, ArrowLeft, Check, CheckCircle2, Eye, EyeOff, Loader2,
  Lock, ShieldCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ApiError, type ResetTokenCheck, api } from "@/lib/api";
import { site } from "@/lib/site";
import { cn } from "@/lib/utils";

/** Shown live, so nobody submits into a rejection. */
function checks(pw: string) {
  return [
    { ok: pw.length >= 10, label: "At least 10 characters" },
    {
      ok: /[a-zA-Z]/.test(pw) && /[0-9!-/:-@[-`{-~]/.test(pw),
      label: "Mix of letters and numbers or symbols",
    },
  ];
}

export function ResetPassword({
  scope = "portal",
}: {
  scope?: "portal" | "team";
}) {
  const router = useRouter();
  const params = useSearchParams();
  const token = params.get("token") ?? "";

  const isTeam = scope === "team";
  const loginHref = isTeam ? "/internal/erp/team/login" : "/portal";
  const forgotHref = isTeam
    ? "/internal/erp/team/forgot-password"
    : "/portal/forgot-password";

  const [check, setCheck] = useState<ResetTokenCheck | null>(null);
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [reveal, setReveal] = useState(false);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) {
      setCheck({ valid: false, email: null, full_name: null, scope });
      return;
    }
    api.checkResetToken(token)
      .then(setCheck)
      .catch(() => setCheck({ valid: false, email: null, full_name: null, scope }));
  }, [token, scope]);

  const rules = checks(next);
  const ready = rules.every((r) => r.ok) && next === confirm && next.length > 0;

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (next !== confirm) {
      setError("The two passwords don't match.");
      return;
    }
    setError(null);
    setBusy(true);
    try {
      await api.resetPassword(token, next);
      setDone(true);
      window.setTimeout(() => router.replace(loginHref), 2500);
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : "Could not reset the password.",
      );
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
                {check?.valid && check.full_name ? check.full_name : "New password"}
              </p>
            </div>
          </div>

          {/* ---------- checking the link ---------- */}
          {!check && (
            <div className="flex items-center gap-3 py-14">
              <Loader2 className="size-5 animate-spin text-brand-green" />
              <p className="text-sm font-medium text-white/60">Checking your link…</p>
            </div>
          )}

          {/* ---------- link no good ---------- */}
          {check && !check.valid && (
            <div className="mt-8">
              <div className="flex items-start gap-3.5">
                <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-brand-ember/15">
                  <AlertCircle className="size-5 text-brand-ember" />
                </span>
                <div>
                  <h1 className="font-display text-xl font-700 uppercase leading-tight text-white">
                    This link has expired
                  </h1>
                  <p className="mt-2.5 text-sm font-medium leading-relaxed text-white/65">
                    Reset links work once and last an hour. Request a fresh one
                    and we&apos;ll email it straight away.
                  </p>
                </div>
              </div>

              <Link href={forgotHref}
                className="mt-7 flex h-12 w-full items-center justify-center rounded-lg bg-brand-green text-sm font-bold text-white transition-colors hover:bg-brand-green/90">
                Request a new link
              </Link>
              <Link href={loginHref}
                className="mt-5 inline-flex items-center gap-2 text-sm font-bold text-white/60 transition-colors hover:text-white">
                <ArrowLeft className="size-4" /> Back to sign in
              </Link>
            </div>
          )}

          {/* ---------- done ---------- */}
          {done && (
            <div className="mt-8 flex items-start gap-3.5">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-brand-green/15">
                <CheckCircle2 className="size-5 text-brand-green" />
              </span>
              <div>
                <h1 className="font-display text-xl font-700 uppercase leading-tight text-white">
                  Password changed
                </h1>
                <p className="mt-2.5 text-sm font-medium leading-relaxed text-white/65">
                  Taking you to sign in…
                </p>
              </div>
            </div>
          )}

          {/* ---------- the form ---------- */}
          {check?.valid && !done && (
            <>
              <h1 className="mt-7 font-display text-2xl font-700 uppercase leading-tight text-white">
                Choose a new password
              </h1>
              <p className="mt-2.5 text-sm font-medium text-white/60">
                For <span className="font-bold text-white">{check.email}</span>
              </p>

              <form onSubmit={onSubmit} noValidate className="mt-7 space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="next" className="text-xs font-bold uppercase tracking-wide text-white/80">
                    New password
                  </Label>
                  <div className="relative">
                    <Lock className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-white/40" />
                    <Input id="next" type={reveal ? "text" : "password"}
                      value={next} onChange={(e) => setNext(e.target.value)}
                      autoComplete="new-password" autoFocus
                      className="h-12 rounded-lg border-white/15 bg-neutral-950 px-11 text-sm font-medium text-white" />
                    <button type="button" onClick={() => setReveal((r) => !r)}
                      aria-label={reveal ? "Hide password" : "Show password"}
                      className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 text-white/45 transition-colors hover:text-white">
                      {reveal ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                    </button>
                  </div>
                </div>

                <ul className="space-y-1.5">
                  {rules.map((r) => (
                    <li key={r.label}
                      className={cn(
                        "flex items-center gap-2 text-xs font-medium transition-colors",
                        r.ok ? "text-brand-green" : "text-white/40"
                      )}>
                      <Check className={cn("size-3.5", !r.ok && "opacity-30")} />
                      {r.label}
                    </li>
                  ))}
                </ul>

                <div className="space-y-2">
                  <Label htmlFor="confirm" className="text-xs font-bold uppercase tracking-wide text-white/80">
                    Confirm it
                  </Label>
                  <div className="relative">
                    <Lock className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-white/40" />
                    <Input id="confirm" type={reveal ? "text" : "password"}
                      value={confirm} onChange={(e) => setConfirm(e.target.value)}
                      autoComplete="new-password"
                      className="h-12 rounded-lg border-white/15 bg-neutral-950 pl-11 text-sm font-medium text-white" />
                  </div>
                  {confirm.length > 0 && next !== confirm && (
                    <p className="text-xs font-semibold text-brand-orange">
                      These don&apos;t match yet.
                    </p>
                  )}
                </div>

                {error && (
                  <p className="border-l-2 border-brand-ember bg-brand-ember/5 px-4 py-3 text-sm font-semibold text-brand-ember">
                    {error}
                  </p>
                )}

                <Button type="submit" disabled={busy || !ready}
                  className="h-12 w-full rounded-lg bg-brand-green text-sm font-bold text-white hover:bg-brand-green/90 disabled:opacity-40">
                  {busy ? <Loader2 className="size-4 animate-spin" /> : "Set new password"}
                </Button>
              </form>
            </>
          )}
        </div>

        <p className="mt-5 flex items-center justify-center gap-2 text-xs font-semibold text-white/40">
          <ShieldCheck className="size-3.5 text-brand-green" />
          Project data is confidential and access-controlled
        </p>
      </div>
    </main>
  );
}
