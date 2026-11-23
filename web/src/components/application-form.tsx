"use client";

import { useRef, useState } from "react";
import { ArrowRight, CheckCircle2, FileText, Loader2, Upload, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { jobs, site } from "@/lib/site";
import { cn } from "@/lib/utils";

type Status = "idle" | "sending" | "sent";
type Errors = Partial<Record<"name" | "email" | "phone" | "role" | "cv", string>>;

const MAX_MB = 5;

export function ApplicationForm({ defaultRole }: { defaultRole?: string }) {
  const [status, setStatus] = useState<Status>("idle");
  const [errors, setErrors] = useState<Errors>({});
  const [file, setFile] = useState<File | null>(null);
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  function pickFile(f: File | undefined) {
    if (!f) return;
    if (f.size > MAX_MB * 1024 * 1024) {
      setErrors((e) => ({ ...e, cv: `File must be under ${MAX_MB}MB.` }));
      return;
    }
    if (!/\.(pdf|docx?)$/i.test(f.name)) {
      setErrors((e) => ({ ...e, cv: "Upload a PDF or Word document." }));
      return;
    }
    setErrors((e) => ({ ...e, cv: undefined }));
    setFile(f);
  }

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const name = String(fd.get("name") ?? "").trim();
    const email = String(fd.get("email") ?? "").trim();
    const phone = String(fd.get("phone") ?? "").trim();
    const role = String(fd.get("role") ?? "").trim();

    const next: Errors = {};
    if (!name) next.name = "Please enter your full name.";
    if (!email) next.email = "Please enter your email.";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) next.email = "Enter a valid email address.";
    if (!phone) next.phone = "Please enter a contact number.";
    if (!role) next.role = "Select the role you're applying for.";
    if (!file) next.cv = "Attach your CV.";

    setErrors(next);
    if (Object.keys(next).length) return;

    setStatus("sending");
    const body = [
      `Role: ${role}`,
      `Name: ${name}`,
      `Email: ${email}`,
      `Phone: ${phone}`,
      `Experience: ${fd.get("experience") || "—"}`,
      `Notice period: ${fd.get("notice") || "—"}`,
      `CV: ${file?.name ?? "—"} (attach before sending)`,
      "",
      String(fd.get("message") ?? ""),
    ].join("\n");

    window.setTimeout(() => {
      window.location.href =
        `mailto:${site.email}?subject=${encodeURIComponent(`Application — ${role} — ${name}`)}&body=${encodeURIComponent(body)}`;
      setStatus("sent");
    }, 450);
  }

  if (status === "sent") {
    return (
      <div className="flex flex-col items-start gap-5 border border-brand-green/30 bg-brand-green/5 p-9">
        <CheckCircle2 className="size-10 text-brand-green" />
        <div>
          <h3 className="font-display text-2xl font-700 uppercase">Almost there</h3>
          <p className="mt-3 text-lg leading-relaxed text-foreground/85">
            We&apos;ve opened a pre-filled email in your mail app.{" "}
            <strong className="font-bold">Attach your CV</strong> ({file?.name}) before sending,
            or write to{" "}
            <a href={`mailto:${site.email}`} className="font-semibold text-brand-green underline underline-offset-4">
              {site.email}
            </a>.
          </p>
        </div>
        <Button variant="outline" className="h-11 rounded-none"
          onClick={() => { setStatus("idle"); setFile(null); }}>
          Submit another application
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-6">
      <div className="grid gap-6 sm:grid-cols-2">
        <Field id="name" label="Full name" required error={errors.name}>
          <Input id="name" name="name" placeholder="Your full name"
            className="h-14 rounded-none border-border bg-background text-base font-medium" />
        </Field>
        <Field id="email" label="Email" required error={errors.email}>
          <Input id="email" name="email" type="email" placeholder="you@email.com"
            className="h-14 rounded-none border-border bg-background text-base font-medium" />
        </Field>
        <Field id="phone" label="Phone" required error={errors.phone}>
          <Input id="phone" name="phone" type="tel" placeholder="+91 00000 00000"
            className="h-14 rounded-none border-border bg-background text-base font-medium" />
        </Field>
        <Field id="experience" label="Years of experience">
          <Input id="experience" name="experience" placeholder="e.g. 2 years, or fresher"
            className="h-14 rounded-none border-border bg-background text-base font-medium" />
        </Field>
      </div>

      <div className="grid gap-6 sm:grid-cols-2">
        <Field id="role" label="Role applying for" required error={errors.role}>
          <Select name="role" defaultValue={defaultRole ?? jobs[0].title}>
            <SelectTrigger id="role" className="h-14 rounded-none border-border bg-background text-base font-medium">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="rounded-none">
              {jobs.map((j) => (
                <SelectItem key={j.id} value={j.title} className="rounded-none">{j.title}</SelectItem>
              ))}
              <SelectItem value="Open application" className="rounded-none">Open application</SelectItem>
            </SelectContent>
          </Select>
        </Field>
        <Field id="notice" label="Notice period">
          <Input id="notice" name="notice" placeholder="e.g. Immediate, 30 days"
            className="h-14 rounded-none border-border bg-background text-base font-medium" />
        </Field>
      </div>

      {/* CV upload */}
      <Field id="cv" label="Attach CV" required error={errors.cv}>
        <div
          onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => { e.preventDefault(); setDragging(false); pickFile(e.dataTransfer.files?.[0]); }}
          className={cn(
            "flex flex-col items-center justify-center border-2 border-dashed px-6 py-10 text-center transition-colors",
            dragging ? "border-brand-green bg-brand-green/5" : "border-border bg-background"
          )}
        >
          {file ? (
            <div className="flex items-center gap-4">
              <FileText className="size-7 text-brand-green" />
              <div className="text-left">
                <p className="text-base font-bold text-foreground">{file.name}</p>
                <p className="text-sm font-medium text-foreground/70">
                  {(file.size / 1024 / 1024).toFixed(2)} MB
                </p>
              </div>
              <button type="button" onClick={() => setFile(null)}
                aria-label="Remove file"
                className="ml-2 border border-border p-2 transition-colors hover:border-destructive hover:text-destructive">
                <X className="size-4" />
              </button>
            </div>
          ) : (
            <>
              <Upload className="size-8 text-brand-green" />
              <p className="mt-4 text-base font-bold text-foreground">
                Drag your CV here, or{" "}
                <button type="button" onClick={() => inputRef.current?.click()}
                  className="text-brand-green underline underline-offset-4">
                  browse
                </button>
              </p>
              <p className="mt-2 text-sm font-medium text-foreground/70">
                PDF or Word, up to {MAX_MB}MB
              </p>
            </>
          )}
          <input ref={inputRef} id="cv" type="file" accept=".pdf,.doc,.docx" className="sr-only"
            onChange={(e) => pickFile(e.target.files?.[0])} />
        </div>
      </Field>

      <Field id="message" label="Anything else?">
        <Textarea id="message" name="message" rows={5}
          placeholder="Software you use, standards you've worked to, or anything you'd like us to know."
          className="resize-none rounded-none border-border bg-background text-base font-medium" />
      </Field>

      <div className="flex flex-wrap items-center gap-5 pt-2">
        <Button type="submit" disabled={status === "sending"}
          className="group h-14 rounded-none bg-brand-green px-8 text-base font-semibold text-white hover:bg-brand-green/90 disabled:opacity-70">
          {status === "sending" ? (
            <>Preparing <Loader2 className="ml-3 size-4 animate-spin" /></>
          ) : (
            <>Submit application <ArrowRight className="ml-3 size-4 transition-transform duration-300 group-hover:translate-x-1" /></>
          )}
        </Button>
        <p className="text-sm font-medium leading-relaxed text-foreground/75">
          We review every application.<br />Shortlisted candidates hear back within a week.
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
