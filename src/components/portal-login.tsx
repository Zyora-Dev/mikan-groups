"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import {
  ArrowLeft, ArrowRight, Eye, EyeOff, Loader2, Lock, Mail, ShieldCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PortalIllustration } from "@/components/portal-illustration";
import { site } from "@/lib/site";
import { cn } from "@/lib/utils";

const ROLES = [
  { value: "client", label: "Client", meta: "Track your drawings" },
  { value: "team", label: "Mikan team", meta: "Internal access" },
] as const;

export function PortalLogin() {
  const [role, setRole] = useState<string>("client");
  const [reveal, setReveal] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const email = String(fd.get("email") ?? "").trim();
    const pwd = String(fd.get("password") ?? "");

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError("Enter a valid email address.");
      return;
    }
    if (pwd.length < 6) {
      setError("Enter your password.");
      return;
    }

    setError(null);
    setBusy(true);
    // No auth backend yet — surface that honestly instead of pretending.
    window.setTimeout(() => {
      setBusy(false);
      setError("The portal isn't live yet. Contact us and we'll set up your access.");
    }, 900);
  }

  return (
    <main className="relative flex h-screen overflow-hidden bg-[#0d2419] p-4 md:p-6 lg:p-8">
      {/* faint drawing grid on the backdrop */}
      <div className="pointer-events-none absolute inset-0 bg-grid opacity-[0.05]" aria-hidden="true" />

      <div className="relative m-auto grid h-full w-full max-w-6xl overflow-hidden rounded-2xl bg-background shadow-2xl lg:grid-cols-2">
        {/* ===================== Form ===================== */}
        <div className="flex min-h-0 flex-col overflow-y-auto bg-secondary/40 p-6 md:p-10">
          <Link href="/" className="inline-flex w-fit items-center gap-2.5 text-sm font-bold text-foreground/70 transition-colors hover:text-foreground">
            <ArrowLeft className="size-4" />
            Back to site
          </Link>

          <div className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center py-6">
            <div className="inline-flex w-fit bg-white p-3 shadow-sm">
              <Image src="/mikan-logo.png" alt={site.name} width={679} height={368}
                priority className="h-10 w-auto" />
            </div>

            <h1 className="mt-7 font-display text-4xl font-700 uppercase leading-none text-foreground">
              Sign in
            </h1>
            <p className="mt-3 text-base font-medium text-foreground/75">
              Welcome back. Enter your details to reach your project files.
            </p>

            {/* role toggle */}
            <div className="mt-6 grid grid-cols-2 gap-2.5">
              {ROLES.map((r) => (
                <button
                  key={r.value}
                  type="button"
                  onClick={() => setRole(r.value)}
                  aria-pressed={role === r.value}
                  className={cn(
                    "border p-3.5 text-left transition-all duration-200",
                    role === r.value
                      ? "border-brand-green bg-brand-green/10"
                      : "border-border bg-background hover:border-foreground/30"
                  )}
                >
                  <span className="flex items-center gap-2">
                    <span className={cn(
                      "flex size-4 items-center justify-center rounded-full border-2 transition-colors",
                      role === r.value ? "border-brand-green" : "border-border"
                    )}>
                      {role === r.value && <span className="size-2 rounded-full bg-brand-green" />}
                    </span>
                    <span className="text-sm font-bold text-foreground">{r.label}</span>
                  </span>
                  <span className="mt-1 block pl-6 text-xs font-medium text-foreground/65">
                    {r.meta}
                  </span>
                </button>
              ))}
            </div>

            <form onSubmit={onSubmit} noValidate className="mt-6 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-bold uppercase tracking-wide text-foreground">
                  Email <span className="text-brand-green">*</span>
                </Label>
                <div className="relative">
                  <Mail className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-foreground/45" />
                  <Input id="email" name="email" type="email" autoComplete="email"
                    placeholder="you@company.com"
                    className="h-14 rounded-none border-border bg-background pl-11 text-base font-medium" />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password" className="text-sm font-bold uppercase tracking-wide text-foreground">
                    Password <span className="text-brand-green">*</span>
                  </Label>
                  <Link href="/contact" className="text-sm font-bold text-brand-green underline-offset-4 hover:underline">
                    Forgot password?
                  </Link>
                </div>
                <div className="relative">
                  <Lock className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-foreground/45" />
                  <Input id="password" name="password"
                    type={reveal ? "text" : "password"} autoComplete="current-password"
                    placeholder="Enter password"
                    className="h-14 rounded-none border-border bg-background px-11 text-base font-medium" />
                  <button type="button" onClick={() => setReveal((r) => !r)}
                    aria-label={reveal ? "Hide password" : "Show password"}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 text-foreground/50 transition-colors hover:text-foreground">
                    {reveal ? <EyeOff className="size-4.5" /> : <Eye className="size-4.5" />}
                  </button>
                </div>
              </div>

              {error && (
                <p className="animate-fade-up border-l-2 border-destructive bg-destructive/5 px-4 py-3 text-sm font-semibold text-destructive">
                  {error}
                </p>
              )}

              <Button type="submit" disabled={busy}
                className="group h-14 w-full rounded-none bg-brand-green text-base font-semibold text-white hover:bg-brand-green/90 disabled:opacity-70">
                {busy ? (
                  <>Signing in <Loader2 className="ml-3 size-4 animate-spin" /></>
                ) : (
                  <>Sign in <ArrowRight className="ml-3 size-4 transition-transform duration-300 group-hover:translate-x-1" /></>
                )}
              </Button>
            </form>

            <p className="mt-6 text-center text-sm font-medium text-foreground/75">
              Don&apos;t have access?{" "}
              <Link href="/contact" className="font-bold text-brand-green underline-offset-4 hover:underline">
                Request an account
              </Link>
            </p>
          </div>

          <p className="flex items-center justify-center gap-2 text-xs font-semibold text-foreground/60">
            <ShieldCheck className="size-3.5 text-brand-green" />
            Project data is confidential and access-controlled
          </p>
        </div>

        {/* ===================== Panel ===================== */}
        <div className="relative hidden min-h-0 flex-col justify-between overflow-hidden bg-[#0f2c1e] p-10 text-white lg:flex">
          <div className="pointer-events-none absolute inset-0 bg-grid opacity-[0.06]" aria-hidden="true" />

          <div className="relative">
            <span className="font-display text-5xl leading-none text-brand-green">&ldquo;</span>
            <p className="mt-4 max-w-md font-display text-2xl font-600 uppercase leading-[1.25]">
              Every drawing, every revision, every comment — in one register
              both teams can see.
            </p>
            <p className="mt-6 max-w-sm text-base leading-relaxed text-white/70">
              Track issue status, download the current revision and raise
              queries against a specific sheet — without a single email thread.
            </p>

            <div className="mt-9 flex flex-wrap gap-2.5">
              {["Drawing register", "Revision history", "RFI log", "Model downloads"].map((f) => (
                <span key={f} className="border border-white/20 px-3 py-1.5 text-xs font-bold uppercase tracking-wide text-white/85">
                  {f}
                </span>
              ))}
            </div>
          </div>

          <div className="relative -mx-10 -mb-10 mt-6 min-h-0 flex-1 text-white/35">
            <PortalIllustration />
          </div>
        </div>
      </div>
    </main>
  );
}
