"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowLeft, ArrowRight, Check, CheckCircle2, Loader2, Send, Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog, DialogContent, DialogDescription, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { quoteSteps, site } from "@/lib/site";
import { cn } from "@/lib/utils";

type Answers = Record<string, string[]>;

export function QuoteDialog({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(0);
  const [dir, setDir] = useState<"fwd" | "back">("fwd");
  const [answers, setAnswers] = useState<Answers>({});
  const [sending, setSending] = useState(false);
  const [done, setDone] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const advanceTimer = useRef<number | null>(null);

  // never leave a timer running after the dialog unmounts or closes
  useEffect(() => () => {
    if (advanceTimer.current) window.clearTimeout(advanceTimer.current);
  }, []);

  const total = quoteSteps.length + 1; // + contact step
  const isContact = step === quoteSteps.length;
  const current = step < quoteSteps.length ? quoteSteps[step] : undefined;
  const picked = current ? answers[current.id] ?? [] : [];
  const canAdvance = isContact || picked.length > 0;
  const pct = ((step + (canAdvance ? 1 : 0)) / total) * 100;

  const summary = useMemo(
    () =>
      quoteSteps
        .map((s) => `${s.question}\n  → ${(answers[s.id] ?? []).join(", ") || "—"}`)
        .join("\n\n"),
    [answers]
  );

  function choose(value: string) {
    if (!current) return;
    setAnswers((a) => {
      const prev = a[current.id] ?? [];
      if (current.multi) {
        return { ...a, [current.id]: prev.includes(value) ? prev.filter((v) => v !== value) : [...prev, value] };
      }
      return { ...a, [current.id]: [value] };
    });
    // single-choice auto-advances so it feels conversational
    if (!current.multi) {
      if (advanceTimer.current) window.clearTimeout(advanceTimer.current);
      advanceTimer.current = window.setTimeout(() => {
        advanceTimer.current = null;
        setDir("fwd");
        setStep((s) => Math.min(s + 1, quoteSteps.length));
      }, 320);
    }
  }

  function reset() {
    if (advanceTimer.current) { window.clearTimeout(advanceTimer.current); advanceTimer.current = null; }
    setStep(0); setAnswers({}); setDone(false); setErr(null); setDir("fwd");
  }

  function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const name = String(fd.get("name") ?? "").trim();
    const email = String(fd.get("email") ?? "").trim();
    if (!name || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setErr("Please add your name and a valid email.");
      return;
    }
    setErr(null);
    setSending(true);
    const body = [
      `Name: ${name}`,
      `Company: ${fd.get("company") || "—"}`,
      `Email: ${email}`,
      `Phone: ${fd.get("phone") || "—"}`,
      "",
      summary,
      "",
      `Notes: ${fd.get("notes") || "—"}`,
    ].join("\n");
    window.setTimeout(() => {
      window.location.href =
        `mailto:${site.salesEmail}?subject=${encodeURIComponent(`Quote request — ${name}`)}&body=${encodeURIComponent(body)}`;
      setSending(false);
      setDone(true);
    }, 500);
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => { if (!o && advanceTimer.current) { window.clearTimeout(advanceTimer.current); advanceTimer.current = null; } setOpen(o); if (!o) window.setTimeout(reset, 300); }}
    >
      <DialogTrigger asChild>{children}</DialogTrigger>

      <DialogContent className="max-h-[92vh] gap-0 overflow-hidden rounded-none p-0 sm:max-w-2xl">
        {/* ---------- Progress ---------- */}
        <div className="relative h-1 w-full bg-border">
          <span
            className="absolute inset-y-0 left-0 bg-brand-green transition-[width] duration-500 ease-out"
            style={{ width: `${done ? 100 : pct}%` }}
          />
        </div>

        {done ? (
          <div className="flex flex-col items-center gap-5 p-12 text-center">
            <CheckCircle2 className="size-14 animate-pop text-brand-green" />
            <DialogTitle className="font-display text-3xl font-700 uppercase">
              Your request is ready
            </DialogTitle>
            <DialogDescription className="max-w-md text-lg leading-relaxed text-foreground/85">
              We&apos;ve opened a pre-filled email to{" "}
              <span className="font-bold text-foreground">{site.salesEmail}</span>.
              Send it and we&apos;ll respond within one business day.
            </DialogDescription>
            <div className="mt-2 flex gap-3">
              <Button variant="outline" className="h-12 rounded-none" onClick={reset}>
                Start again
              </Button>
              <Button className="h-12 rounded-none bg-brand-green font-semibold text-white hover:bg-brand-green/90"
                onClick={() => setOpen(false)}>
                Close
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex max-h-[88vh] flex-col">
            {/* ---------- Header ---------- */}
            <div className="flex items-center justify-between gap-4 border-b border-border px-7 py-5">
              <div className="flex items-center gap-2.5">
                <Sparkles className="size-4 text-brand-green" />
                <span className="text-sm font-bold uppercase tracking-wide text-foreground">
                  Request a quote
                </span>
              </div>
              <span className="font-mono text-sm font-semibold tabular-nums text-foreground/60">
                {String(step + 1).padStart(2, "0")} / {String(total).padStart(2, "0")}
              </span>
            </div>

            {/* ---------- Body ---------- */}
            <div className="flex-1 overflow-y-auto px-7 py-8">
              <div
                key={step}
                className={dir === "fwd" ? "animate-step-in" : "animate-step-in-back"}
              >
                {isContact || !current ? (
                  <form id="quote-form" onSubmit={submit}>
                    <DialogTitle className="font-display text-2xl font-700 uppercase leading-tight md:text-3xl">
                      Where should we send it?
                    </DialogTitle>
                    <DialogDescription className="mt-2.5 text-base text-foreground/75">
                      We&apos;ll reply with a fixed price, a programme and a named lead engineer.
                    </DialogDescription>

                    <div className="mt-7 grid gap-5 sm:grid-cols-2">
                      <Row id="name" label="Full name" required>
                        <Input id="name" name="name" placeholder="Your name"
                          className="h-13 rounded-none border-border text-base font-medium" />
                      </Row>
                      <Row id="company" label="Company">
                        <Input id="company" name="company" placeholder="Company name"
                          className="h-13 rounded-none border-border text-base font-medium" />
                      </Row>
                      <Row id="email" label="Email" required>
                        <Input id="email" name="email" type="email" placeholder="you@company.com"
                          className="h-13 rounded-none border-border text-base font-medium" />
                      </Row>
                      <Row id="phone" label="Phone">
                        <Input id="phone" name="phone" type="tel" placeholder="+65 0000 0000"
                          className="h-13 rounded-none border-border text-base font-medium" />
                      </Row>
                    </div>

                    <div className="mt-5">
                      <Row id="notes" label="Anything else?">
                        <Textarea id="notes" name="notes" rows={3}
                          placeholder="Drawing counts, tie-in constraints, target dates…"
                          className="resize-none rounded-none border-border text-base font-medium" />
                      </Row>
                    </div>

                    {err && <p className="mt-4 text-sm font-semibold text-destructive">{err}</p>}

                    {/* recap */}
                    <div className="mt-7 border border-border bg-secondary/40 p-5">
                      <p className="text-sm font-bold uppercase tracking-wide text-foreground">
                        Your brief
                      </p>
                      <dl className="mt-4 space-y-2.5">
                        {quoteSteps.map((s) => (
                          <div key={s.id} className="flex flex-wrap gap-x-3 text-sm">
                            <dt className="font-semibold text-foreground/60">
                              {s.question.replace(/\?$/, "")}
                            </dt>
                            <dd className="font-bold text-foreground">
                              {(answers[s.id] ?? []).join(", ") || "—"}
                            </dd>
                          </div>
                        ))}
                      </dl>
                    </div>
                  </form>
                ) : (
                  <>
                    <DialogTitle className="font-display text-2xl font-700 uppercase leading-tight md:text-3xl">
                      {current.question}
                    </DialogTitle>
                    <DialogDescription className="mt-2.5 text-base text-foreground/75">
                      {current.hint}
                      {current.multi && (
                        <span className="ml-2 font-bold text-brand-green">Select all that apply</span>
                      )}
                    </DialogDescription>

                    <div className="mt-7 grid gap-2.5 sm:grid-cols-2">
                      {current.options.map((o, i) => {
                        const on = picked.includes(o.value);
                        return (
                          <button
                            key={o.value}
                            type="button"
                            onClick={() => choose(o.value)}
                            aria-pressed={on}
                            style={{ animationDelay: `${i * 45}ms` }}
                            className={cn(
                              "group flex animate-fade-up items-center justify-between gap-3 border p-4 text-left transition-all duration-200",
                              on
                                ? "border-brand-green bg-brand-green/10"
                                : "border-border bg-background hover:border-foreground/35 hover:bg-secondary/50"
                            )}
                          >
                            <span className="min-w-0">
                              <span className="block font-display text-base font-700 uppercase leading-tight text-foreground">
                                {o.label}
                              </span>
                              <span className="mt-1 block text-xs font-medium text-foreground/70">
                                {o.meta}
                              </span>
                            </span>
                            <span
                              className={cn(
                                "flex size-6 shrink-0 items-center justify-center border transition-all",
                                on
                                  ? "animate-pop border-brand-green bg-brand-green text-white"
                                  : "border-border text-transparent group-hover:border-foreground/35"
                              )}
                            >
                              <Check className="size-3.5" strokeWidth={3} />
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* ---------- Footer ---------- */}
            <div className="flex items-center justify-between gap-4 border-t border-border px-7 py-5">
              <Button
                variant="ghost"
                disabled={step === 0}
                onClick={() => { if (advanceTimer.current) window.clearTimeout(advanceTimer.current); setDir("back"); setStep((s) => Math.max(0, s - 1)); }}
                className="h-12 rounded-none px-5 font-semibold disabled:opacity-40"
              >
                <ArrowLeft className="mr-2 size-4" /> Back
              </Button>

              <div className="flex items-center gap-2">
                {Array.from({ length: total }).map((_, i) => (
                  <span key={i} className={cn(
                    "h-1.5 transition-all duration-300",
                    i === step ? "w-6 bg-brand-green" : i < step ? "w-1.5 bg-brand-green/50" : "w-1.5 bg-border"
                  )} />
                ))}
              </div>

              {isContact ? (
                <Button type="submit" form="quote-form" disabled={sending}
                  className="group h-12 rounded-none bg-brand-green px-7 font-semibold text-white hover:bg-brand-green/90">
                  {sending ? (<>Sending <Loader2 className="ml-2.5 size-4 animate-spin" /></>)
                           : (<>Send request <Send className="ml-2.5 size-4 transition-transform group-hover:translate-x-0.5" /></>)}
                </Button>
              ) : (
                <Button
                  disabled={!canAdvance}
                  onClick={() => { if (advanceTimer.current) window.clearTimeout(advanceTimer.current); setDir("fwd"); setStep((s) => Math.min(s + 1, quoteSteps.length)); }}
                  className="group h-12 rounded-none bg-brand-green px-7 font-semibold text-white hover:bg-brand-green/90 disabled:opacity-40"
                >
                  Continue
                  <ArrowRight className="ml-2.5 size-4 transition-transform group-hover:translate-x-1" />
                </Button>
              )}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

function Row({
  id, label, required, children,
}: { id: string; label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id} className="text-sm font-bold uppercase tracking-wide text-foreground">
        {label}{required && <span className="ml-1 text-brand-green">*</span>}
      </Label>
      {children}
    </div>
  );
}
