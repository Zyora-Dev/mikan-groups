"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  AlertCircle, ArrowRight, Check, Eye, EyeOff, Loader2, Lock, ShieldCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ApiError, type Session, api } from "@/lib/api";
import { cn } from "@/lib/utils";

/** Rules shown live, so nobody submits into a rejection. */
function checks(pw: string, current: string) {
  return [
    { ok: pw.length >= 10, label: "At least 10 characters" },
    { ok: /[a-zA-Z]/.test(pw) && /[0-9!-/:-@[-`{-~]/.test(pw),
      label: "Mix of letters and numbers or symbols" },
    { ok: pw.length > 0 && pw !== current, label: "Different from the current one" },
  ];
}

/** Serves both applications — `variant` decides where it redirects. */
export function ChangePassword({
  variant = "team",
}: {
  variant?: "team" | "portal";
}) {
  const router = useRouter();
  const isPortal = variant === "portal";
  const loginHref = isPortal ? "/portal" : "/internal/erp/team/login";
  const homeHref = isPortal ? "/portal/overview" : "/internal/erp/team";
  const [session, setSession] = useState<Session | null>(null);
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [reveal, setReveal] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api.me().then(setSession)
      .catch(() => router.replace(loginHref));
  }, [router, loginHref]);

  const rules = checks(next, current);
  const ready = rules.every((r) => r.ok) && next === confirm && current.length > 0;

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (next !== confirm) { setError("The two new passwords don't match."); return; }
    setError(null);
    setBusy(true);
    try {
      await api.changePassword(current, next);
      router.replace(homeHref);
      router.refresh();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not change the password.");
      setBusy(false);
    }
  }

  const forced = session?.user.must_change_password ?? false;

  return (
    <main className="relative flex min-h-screen items-center justify-center bg-neutral-950 px-4 py-10">
      <div className="pointer-events-none absolute inset-0 bg-grid opacity-[0.05]" aria-hidden="true" />

      <div className="relative w-full max-w-md">
        <div className="rounded-xl border border-white/10 bg-neutral-900 p-8">
          <div className="flex items-center gap-4">
            <div className="bg-white p-2.5">
              <Image src="/mikan-logo.png" alt="Mikan" width={679} height={368}
                priority className="h-7 w-auto" />
            </div>
            <div className="border-l border-white/15 pl-4">
              <p className="font-display text-base font-700 uppercase leading-none text-white">
                {isPortal ? "Portal" : "ERP"}
              </p>
              <p className="mt-1 text-xs font-bold uppercase tracking-wide text-brand-green">
                {session?.user.full_name ?? "Account"}
              </p>
            </div>
          </div>

          <h1 className="mt-7 font-display text-2xl font-700 uppercase leading-tight text-white">
            {forced ? "Set your own password" : "Change password"}
          </h1>
          <p className="mt-2.5 text-sm font-medium text-white/60">
            {forced
              ? "An administrator set the one you signed in with. Choose your own before continuing."
              : "Pick something you haven't used elsewhere."}
          </p>

          <form onSubmit={onSubmit} noValidate className="mt-7 space-y-5">
            <Field id="current" label={forced ? "The password you were given" : "Current password"}>
              <div className="relative">
                <Lock className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-white/40" />
                <Input id="current" type={reveal ? "text" : "password"} autoComplete="current-password"
                  value={current} onChange={(e) => setCurrent(e.target.value)} disabled={busy}
                  className="h-12 rounded-lg border-white/15 bg-neutral-950 pl-11 text-base font-medium text-white" />
              </div>
            </Field>

            <Field id="next" label="New password">
              <div className="relative">
                <ShieldCheck className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-white/40" />
                <Input id="next" type={reveal ? "text" : "password"} autoComplete="new-password"
                  value={next} onChange={(e) => setNext(e.target.value)} disabled={busy}
                  className="h-12 rounded-lg border-white/15 bg-neutral-950 px-11 text-base font-medium text-white" />
                <button type="button" onClick={() => setReveal((r) => !r)}
                  aria-label={reveal ? "Hide passwords" : "Show passwords"}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 text-white/45 hover:text-white">
                  {reveal ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>
            </Field>

            <ul className="space-y-1.5">
              {rules.map((r) => (
                <li key={r.label} className={cn(
                  "flex items-center gap-2 text-xs font-semibold transition-colors",
                  r.ok ? "text-brand-green" : "text-white/40"
                )}>
                  <Check className={cn("size-3.5", !r.ok && "opacity-30")} />
                  {r.label}
                </li>
              ))}
            </ul>

            <Field id="confirm" label="Confirm new password">
              <Input id="confirm" type={reveal ? "text" : "password"} autoComplete="new-password"
                value={confirm} onChange={(e) => setConfirm(e.target.value)} disabled={busy}
                className={cn(
                  "h-12 rounded-lg border-white/15 bg-neutral-950 text-base font-medium text-white",
                  confirm.length > 0 && confirm !== next && "border-brand-ember/50"
                )} />
              {confirm.length > 0 && confirm !== next && (
                <p className="text-xs font-semibold text-brand-ember">
                  These don&apos;t match yet.
                </p>
              )}
            </Field>

            {error && (
              <p role="alert" className="flex items-start gap-2.5 rounded-lg border border-brand-ember/30 bg-brand-ember/[0.07] px-4 py-3 text-sm font-semibold text-brand-ember">
                <AlertCircle className="mt-0.5 size-4 shrink-0" /> {error}
              </p>
            )}

            <Button type="submit" disabled={busy || !ready}
              className="group h-12 w-full rounded-lg bg-brand-green text-base font-semibold text-white hover:bg-brand-green/90 disabled:opacity-40">
              {busy ? (
                <>Saving <Loader2 className="ml-3 size-4 animate-spin" /></>
              ) : (
                <>Save and continue <ArrowRight className="ml-3 size-4 transition-transform duration-300 group-hover:translate-x-1" /></>
              )}
            </Button>
          </form>

          {!forced && (
            <button onClick={() => router.back()}
              className="mt-5 w-full text-center text-xs font-semibold text-white/45 transition-colors hover:text-white">
              Go back without changing
            </button>
          )}
        </div>
      </div>
    </main>
  );
}

function Field({
  id, label, children,
}: { id: string; label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id} className="text-xs font-bold uppercase tracking-wide text-white/80">
        {label}
      </Label>
      {children}
    </div>
  );
}
