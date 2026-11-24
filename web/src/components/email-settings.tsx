"use client";

import { useEffect, useState } from "react";
import {
  AlertCircle, Check, CheckCircle2, ExternalLink, Loader2, Mail,
  Send, ShieldCheck, X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { ApiError, type EmailSettings as Settings, api } from "@/lib/api";
import { formatDateTime } from "@/lib/project-ui";
import { cn } from "@/lib/utils";

/** Zoho hosts ZeptoMail per region; the wrong one rejects the token. */
const REGIONS = [
  { url: "https://api.zeptomail.com/v1.1/email", label: "Global (.com)" },
  { url: "https://api.zeptomail.eu/v1.1/email", label: "Europe (.eu)" },
  { url: "https://api.zeptomail.in/v1.1/email", label: "India (.in)" },
  { url: "https://api.zeptomail.com.au/v1.1/email", label: "Australia (.com.au)" },
];

const EVENTS = [
  { key: "notify_on_submit", label: "Work submitted for review",
    hint: "The client is told when you issue something" },
  { key: "notify_on_verdict", label: "Client approves or requests changes",
    hint: "The project team is told either way" },
  { key: "notify_on_comment", label: "New comment",
    hint: "Reaches the other side of the conversation" },
  { key: "notify_on_assignment", label: "Task assigned",
    hint: "The person taking it on is told" },
  { key: "notify_on_task_created", label: "Task created",
    hint: "Noisy on busy projects — off by default" },
] as const;

export function EmailSettingsPanel() {
  const [s, setS] = useState<Settings | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testTo, setTestTo] = useState("");
  const [key, setKey] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    api.emailSettings.get()
      .then((row) => { setS(row); setTestTo(row.from_email ?? ""); })
      .catch(() => setError("Could not load the settings."))
      .finally(() => setLoading(false));
  }, []);

  async function save(body: Record<string, unknown>, message?: string) {
    setBusy(true);
    setError(null);
    try {
      setS(await api.emailSettings.update(body));
      if (message) setNotice(message);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not save.");
    } finally {
      setBusy(false);
    }
  }

  async function onSave(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const body: Record<string, unknown> = {
      api_url: String(fd.get("api_url") ?? ""),
      from_email: String(fd.get("from_email") ?? "").trim() || undefined,
      from_name: String(fd.get("from_name") ?? "").trim() || undefined,
      reply_to: String(fd.get("reply_to") ?? "").trim() || undefined,
    };
    if (key.trim()) body.api_key = key.trim();
    await save(body, "Settings saved.");
    setKey("");
  }

  async function runTest() {
    if (!testTo) { setError("Enter an address to send the test to."); return; }
    setTesting(true);
    setError(null);
    try {
      const row = await api.emailSettings.test(testTo);
      setS(row);
      setNotice(row.last_test_ok
        ? `Test sent to ${testTo}.`
        : `Test failed: ${row.last_error}`);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not send the test.");
    } finally {
      setTesting(false);
    }
  }

  if (loading) {
    return <div className="h-96 animate-pulse rounded-xl bg-neutral-900" />;
  }
  if (!s) {
    return <p className="py-16 text-center text-sm font-bold text-brand-ember">{error}</p>;
  }

  const ready = s.api_key_set && !!s.from_email;

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-start justify-between gap-5">
        <div>
          <h1 className="font-display text-3xl font-700 uppercase leading-none text-white">
            Email
          </h1>
          <p className="mt-2.5 text-sm font-medium text-white/55">
            Notifications are sent through Zoho ZeptoMail. Credentials are
            stored here, not in the deployment.
          </p>
        </div>

        <button type="button" disabled={busy || !ready}
          onClick={() => save({ enabled: !s.enabled },
            s.enabled ? "Email switched off." : "Email switched on.")}
          className={cn(
            "flex items-center gap-3 rounded-lg border px-4 py-3 text-sm font-bold transition-colors disabled:opacity-50",
            s.enabled
              ? "border-brand-green/40 bg-brand-green/10 text-brand-green"
              : "border-white/15 bg-neutral-900 text-white/60 hover:text-white"
          )}>
          <span className={cn(
            "flex h-5 w-9 items-center rounded-full px-0.5 transition-colors",
            s.enabled ? "bg-brand-green" : "bg-white/15"
          )}>
            <span className={cn(
              "size-4 rounded-full bg-white transition-transform",
              s.enabled && "translate-x-4"
            )} />
          </span>
          {s.enabled ? "Sending" : "Paused"}
        </button>
      </header>

      {notice && (
        <Banner tone="good" onClose={() => setNotice(null)}>{notice}</Banner>
      )}
      {error && <Banner tone="bad" onClose={() => setError(null)}>{error}</Banner>}

      {!ready && (
        <div className="flex items-start gap-3 rounded-lg border border-brand-orange/30 bg-brand-orange/[0.07] px-4 py-3">
          <AlertCircle className="mt-0.5 size-4 shrink-0 text-brand-orange" />
          <p className="text-sm font-semibold text-white/85">
            Add a Send Mail token and a verified sender before switching
            sending on.
          </p>
        </div>
      )}

      {/* ---- credentials ---- */}
      <form onSubmit={onSave}
        className="space-y-5 rounded-xl border border-white/10 bg-neutral-900 p-6">
        <div className="flex items-center gap-2.5">
          <ShieldCheck className="size-4 text-brand-green" />
          <h2 className="text-sm font-bold text-white">Credentials</h2>
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="api_url" className="text-xs font-bold uppercase tracking-wide text-white/70">
              Zoho region
            </Label>
            <Select name="api_url" defaultValue={s.api_url}>
              <SelectTrigger id="api_url"
                className="h-11 rounded-lg border-white/15 bg-neutral-950 text-sm font-medium text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="rounded-lg">
                {REGIONS.map((r) => (
                  <SelectItem key={r.url} value={r.url}>{r.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs font-medium text-white/40">
              Must match the data centre your Zoho account sits in.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="api_key" className="text-xs font-bold uppercase tracking-wide text-white/70">
              Send Mail token
              {s.api_key_set && (
                <span className="ml-2 font-normal normal-case text-brand-green">
                  — one is stored
                </span>
              )}
            </Label>
            <Input id="api_key" name="api_key" type="password" value={key}
              onChange={(e) => setKey(e.target.value)}
              placeholder={s.api_key_set ? "Leave blank to keep the current one" : "Zoho-enczapikey …"}
              className="h-11 rounded-lg border-white/15 bg-neutral-950 text-sm font-medium text-white placeholder:text-white/25" />
            <p className="text-xs font-medium text-white/40">
              Paste it exactly as Zoho shows it, including the prefix.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="from_email" className="text-xs font-bold uppercase tracking-wide text-white/70">
              Sender address
            </Label>
            <Input id="from_email" name="from_email" type="email" defaultValue={s.from_email ?? ""}
              placeholder="noreply@mikan-groups.com"
              className="h-11 rounded-lg border-white/15 bg-neutral-950 text-sm font-medium text-white placeholder:text-white/25" />
            <p className="text-xs font-medium text-white/40">
              Must be a domain verified in Zoho, or sending is rejected.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="from_name" className="text-xs font-bold uppercase tracking-wide text-white/70">
              Sender name
            </Label>
            <Input id="from_name" name="from_name" defaultValue={s.from_name}
              className="h-11 rounded-lg border-white/15 bg-neutral-950 text-sm font-medium text-white" />
          </div>

          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="reply_to" className="text-xs font-bold uppercase tracking-wide text-white/70">
              Reply-to
            </Label>
            <Input id="reply_to" name="reply_to" type="email" defaultValue={s.reply_to ?? ""}
              placeholder="info@mikan-groups.com"
              className="h-11 rounded-lg border-white/15 bg-neutral-950 text-sm font-medium text-white placeholder:text-white/25" />
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 border-t border-white/[0.07] pt-5">
          <Button type="submit" disabled={busy}
            className="h-11 rounded-lg bg-brand-green px-6 font-semibold text-white hover:bg-brand-green/90">
            {busy ? <Loader2 className="size-4 animate-spin" /> : "Save credentials"}
          </Button>
          <a href="https://www.zoho.com/zeptomail/" target="_blank" rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-xs font-bold text-white/45 hover:text-white">
            Zoho ZeptoMail <ExternalLink className="size-3" />
          </a>
        </div>
      </form>

      {/* ---- test ---- */}
      <div className="rounded-xl border border-white/10 bg-neutral-900 p-6">
        <div className="flex items-center gap-2.5">
          <Send className="size-4 text-brand-green" />
          <h2 className="text-sm font-bold text-white">Send a test</h2>
        </div>
        <p className="mt-2 text-xs font-medium text-white/50">
          Sends one message regardless of the switch above, so delivery can
          be proven before turning it on.
        </p>

        <div className="mt-4 flex flex-wrap gap-3">
          <Input value={testTo} onChange={(e) => setTestTo(e.target.value)}
            type="email" placeholder="you@mikan-groups.com"
            className="h-11 min-w-[16rem] flex-1 rounded-lg border-white/15 bg-neutral-950 text-sm font-medium text-white placeholder:text-white/25" />
          <Button onClick={runTest} disabled={testing || !s.api_key_set}
            variant="outline"
            className="h-11 rounded-lg border-white/20 bg-transparent px-5 font-semibold text-white hover:bg-white/10 disabled:opacity-50">
            {testing ? <Loader2 className="size-4 animate-spin" /> : "Send test"}
          </Button>
        </div>

        {s.last_tested_at && (
          <div className={cn(
            "mt-4 flex items-start gap-2.5 rounded-lg border px-4 py-3 text-sm font-semibold",
            s.last_test_ok
              ? "border-brand-green/30 bg-brand-green/[0.07] text-white/85"
              : "border-brand-ember/30 bg-brand-ember/[0.07] text-brand-ember"
          )}>
            {s.last_test_ok
              ? <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-brand-green" />
              : <AlertCircle className="mt-0.5 size-4 shrink-0" />}
            <span>
              {s.last_test_ok ? "Last test succeeded" : `Last test failed — ${s.last_error}`}
              <span className="ml-2 font-normal text-white/45">
                {formatDateTime(s.last_tested_at)}
              </span>
            </span>
          </div>
        )}
      </div>

      {/* ---- events ---- */}
      <div className="overflow-hidden rounded-xl border border-white/10 bg-neutral-900">
        <div className="flex items-center gap-2.5 px-6 py-4">
          <Mail className="size-4 text-brand-green" />
          <h2 className="text-sm font-bold text-white">What sends an email</h2>
        </div>
        <ul className="divide-y divide-white/[0.07] border-t border-white/[0.07]">
          {EVENTS.map((e) => {
            const on = s[e.key];
            return (
              <li key={e.key} className="flex items-center justify-between gap-4 px-6 py-4">
                <div className="min-w-0">
                  <p className="text-sm font-bold text-white">{e.label}</p>
                  <p className="mt-0.5 text-xs font-medium text-white/45">{e.hint}</p>
                </div>
                <button type="button" disabled={busy}
                  onClick={() => save({ [e.key]: !on })}
                  aria-label={`${on ? "Disable" : "Enable"} ${e.label}`}
                  aria-pressed={on}
                  className={cn(
                    "flex h-6 w-11 shrink-0 items-center rounded-full px-0.5 transition-colors",
                    on ? "bg-brand-green" : "bg-white/15"
                  )}>
                  <span className={cn(
                    "size-5 rounded-full bg-white transition-transform",
                    on && "translate-x-5"
                  )} />
                </button>
              </li>
            );
          })}
        </ul>
        <p className="border-t border-white/[0.07] px-6 py-3 text-xs font-medium text-white/40">
          In-app notifications are always created. These switches only
          control email.
        </p>
      </div>
    </div>
  );
}

function Banner({
  tone, onClose, children,
}: { tone: "good" | "bad"; onClose: () => void; children: React.ReactNode }) {
  const good = tone === "good";
  return (
    <div className={cn(
      "flex items-start gap-3 rounded-lg border px-4 py-3",
      good ? "border-brand-green/30 bg-brand-green/[0.07]" : "border-brand-ember/30 bg-brand-ember/[0.07]"
    )}>
      {good ? <Check className="mt-0.5 size-4 shrink-0 text-brand-green" />
            : <AlertCircle className="mt-0.5 size-4 shrink-0 text-brand-ember" />}
      <p className={cn("flex-1 text-sm font-semibold",
        good ? "text-white/90" : "text-brand-ember")}>{children}</p>
      <button onClick={onClose} aria-label="Dismiss"
        className="text-white/40 hover:text-white"><X className="size-4" /></button>
    </div>
  );
}
