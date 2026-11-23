"use client";

import { useState } from "react";
import { ArrowRight, CheckCircle2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { enquiryTypes, site } from "@/lib/site";

type Status = "idle" | "sending" | "sent";
type Errors = Partial<Record<"name" | "email" | "message", string>>;

export function ContactForm() {
  const [status, setStatus] = useState<Status>("idle");
  const [errors, setErrors] = useState<Errors>({});

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const name = String(fd.get("name") ?? "").trim();
    const email = String(fd.get("email") ?? "").trim();
    const message = String(fd.get("message") ?? "").trim();

    const next: Errors = {};
    if (!name) next.name = "Please enter your name.";
    if (!email) next.email = "Please enter your email.";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) next.email = "Enter a valid email address.";
    if (!message) next.message = "Tell us briefly what you need.";

    setErrors(next);
    if (Object.keys(next).length) return;

    // No backend yet — hand off to the user's mail client.
    setStatus("sending");
    const subject = `${fd.get("enquiry") || "Enquiry"} — ${fd.get("company") || name}`;
    const body = [
      `Name: ${name}`,
      `Company: ${fd.get("company") || "—"}`,
      `Email: ${email}`,
      `Phone: ${fd.get("phone") || "—"}`,
      `Enquiry: ${fd.get("enquiry") || "—"}`,
      "",
      message,
    ].join("\n");

    window.setTimeout(() => {
      window.location.href =
        `mailto:${site.salesEmail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
      setStatus("sent");
    }, 450);
  }

  if (status === "sent") {
    return (
      <div className="flex flex-col items-start gap-5 border border-brand-green/30 bg-brand-green/5 p-9">
        <CheckCircle2 className="size-10 text-brand-green" />
        <div>
          <h3 className="font-display text-2xl font-700 uppercase">Your email is ready</h3>
          <p className="mt-3 text-lg leading-relaxed text-foreground/85">
            We&apos;ve opened a pre-filled message in your mail app. If nothing
            happened, write to us directly at{" "}
            <a href={`mailto:${site.salesEmail}`} className="font-semibold text-brand-green underline underline-offset-4">
              {site.salesEmail}
            </a>.
          </p>
        </div>
        <Button
          variant="outline"
          className="h-11 rounded-none"
          onClick={() => setStatus("idle")}
        >
          Send another enquiry
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-6">
      <div className="grid gap-6 sm:grid-cols-2">
        <Field id="name" label="Full name" required error={errors.name}>
          <Input id="name" name="name" placeholder="Jane Doe"
            className="h-14 rounded-none border-border bg-background text-base font-medium" />
        </Field>
        <Field id="company" label="Company">
          <Input id="company" name="company" placeholder="Company name"
            className="h-14 rounded-none border-border bg-background text-base font-medium" />
        </Field>
        <Field id="email" label="Email" required error={errors.email}>
          <Input id="email" name="email" type="email" placeholder="jane@company.com"
            className="h-14 rounded-none border-border bg-background text-base font-medium" />
        </Field>
        <Field id="phone" label="Phone">
          <Input id="phone" name="phone" type="tel" placeholder="+65 0000 0000"
            className="h-14 rounded-none border-border bg-background text-base font-medium" />
        </Field>
      </div>

      <Field id="enquiry" label="What can we help with?">
        <Select name="enquiry" defaultValue={enquiryTypes[0]}>
          <SelectTrigger id="enquiry" className="h-14 rounded-none border-border bg-background text-base font-medium">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="rounded-none">
            {enquiryTypes.map((t) => (
              <SelectItem key={t} value={t} className="rounded-none">{t}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </Field>

      <Field id="message" label="Project details" required error={errors.message}>
        <Textarea
          id="message"
          name="message"
          rows={6}
          placeholder="Scope, tonnage or drawing count, governing standard, and your target programme."
          className="resize-none rounded-none border-border bg-background text-base font-medium"
        />
      </Field>

      <div className="flex flex-wrap items-center gap-5 pt-2">
        <Button
          type="submit"
          disabled={status === "sending"}
          className="group h-14 rounded-none bg-brand-green px-8 text-base font-semibold text-white hover:bg-brand-green/90 disabled:opacity-70"
        >
          {status === "sending" ? (
            <>Preparing <Loader2 className="ml-3 size-4 animate-spin" /></>
          ) : (
            <>Send enquiry <ArrowRight className="ml-3 size-4 transition-transform duration-300 group-hover:translate-x-1" /></>
          )}
        </Button>
        <p className="text-sm font-medium leading-relaxed text-foreground/75">
          We reply within one business day.<br />Your details are never shared.
        </p>
      </div>
    </form>
  );
}

function Field({
  id, label, required, error, children,
}: {
  id: string; label: string; required?: boolean; error?: string; children: React.ReactNode;
}) {
  return (
    <div className="space-y-2.5">
      <Label htmlFor={id} className="text-sm font-bold uppercase tracking-wide text-foreground">
        {label}
        {required && <span className="ml-1 text-brand-green">*</span>}
      </Label>
      {children}
      {error && <p className="text-sm font-semibold text-destructive">{error}</p>}
    </div>
  );
}
