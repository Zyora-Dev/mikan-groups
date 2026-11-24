"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  ArrowLeft, ArrowRight, Eye, EyeOff, Loader2, Lock, Mail, ShieldCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PortalIllustration } from "@/components/portal-illustration";
import { ApiError, api } from "@/lib/api";
import { site } from "@/lib/site";

export function PortalLogin() {
  const router = useRouter();
  const [reveal, setReveal] = useState(false);
  const [busy, setBusy] = useState(false);
  const [checking, setChecking] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Already signed in? Don't make them type it again.
  useEffect(() => {
    api.me()
      .then((s) => {
        if (s.user.role === "client" || s.user.role === "client_admin") {
          router.replace("/portal/overview");
        } else {
          setChecking(false);
        }
      })
      .catch(() => setChecking(false));
  }, [router]);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const email = String(fd.get("email") ?? "").trim();
    const pwd = String(fd.get("password") ?? "");

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError("Enter a valid email address.");
      return;
    }
    if (!pwd) {
      setError("Enter your password.");
      return;
    }

    setError(null);
    setBusy(true);
    try {
      const session = await api.login(email, pwd);
      // Staff credentials are valid, but this door isn't theirs.
      if (session.user.role !== "client" && session.user.role !== "client_admin") {
        await api.logout().catch(() => {});
        setError("This sign-in is for client accounts.");
        setBusy(false);
        return;
      }
      router.replace(
        session.user.must_change_password ? "/portal/password" : "/portal/overview",
      );
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : "Could not reach the server. Try again.",
      );
      setBusy(false);
    }
  }

  if (checking) {
    return (
      <main className="flex h-screen items-center justify-center bg-[#0d2419]">
        <Loader2 className="size-6 animate-spin text-brand-green" />
      </main>
    );
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

            <form onSubmit={onSubmit} noValidate className="mt-7 space-y-4">
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
                  <Link href="/portal/forgot-password" className="text-sm font-bold text-brand-green underline-offset-4 hover:underline">
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
