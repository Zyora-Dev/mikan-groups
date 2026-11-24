"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import {
  AlertCircle, ArrowLeft, Building2, Check, FileCheck2, FolderKanban,
  Loader2, Mail, MapPin, Pencil, Trash2, Users, X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ClientPortalAccess } from "@/components/client-portal-access";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ProjectBoard } from "@/components/project-board";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  ApiError, CLIENT_TYPE_LABELS, type ClientDetail, type ClientStatus,
  ENTITY_LABELS, STATUS_LABELS, api,
} from "@/lib/api";
import { formatDate } from "@/lib/project-ui";
import { cn } from "@/lib/utils";

const STATUS_STYLE: Record<ClientStatus, string> = {
  active: "border-brand-green/40 bg-brand-green/10 text-brand-green",
  prospect: "border-brand-cyan/40 bg-brand-cyan/10 text-brand-cyan",
  dormant: "border-white/25 bg-white/5 text-white/70",
  archived: "border-white/15 bg-transparent text-white/45",
};

type Tab = "work" | "access" | "details";

export function ClientPage({ clientId }: { clientId: string }) {
  const router = useRouter();
  const [client, setClient] = useState<ClientDetail | null>(null);
  const [tab, setTab] = useState<Tab>("work");
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const load = useCallback(async () => {
    try {
      setClient(await api.clients.get(clientId));
    } catch (err) {
      if (err instanceof ApiError && (err.status === 401 || err.status === 403)) {
        router.replace("/internal/erp/team/login");
        return;
      }
      setError("Could not load this client.");
    } finally {
      setLoading(false);
    }
  }, [clientId, router]);

  useEffect(() => { void load(); }, [load]);

  async function changeStatus(next: ClientStatus) {
    if (!client) return;
    setBusy(true);
    try {
      setClient(await api.clients.update(client.id, { status: next }));
      setNotice(`Status set to ${STATUS_LABELS[next].toLowerCase()}.`);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not change status.");
    } finally {
      setBusy(false);
    }
  }

  async function onSave(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!client) return;
    const fd = new FormData(e.currentTarget);
    const text = (k: string) => String(fd.get(k) ?? "").trim() || null;

    setBusy(true);
    setError(null);
    try {
      setClient(await api.clients.update(client.id, {
        name: String(fd.get("name") ?? "").trim(),
        trading_name: text("trading_name"),
        registration_no: text("registration_no"),
        tax_no: text("tax_no"),
        website: text("website"),
        client_type: fd.get("client_type"),
        sector: text("sector"),
        default_standard: text("default_standard"),
        country: text("country"),
        city: text("city"),
        address_line1: text("address_line1"),
        postcode: text("postcode"),
        contracting_entity: fd.get("contracting_entity"),
        contact_name: text("contact_name"),
        contact_email: text("contact_email"),
        contact_phone: text("contact_phone"),
        nda_signed: fd.get("nda_signed") === "on",
        notes: text("notes"),
      }));
      setEditing(false);
      setNotice("Client updated.");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not save changes.");
    } finally {
      setBusy(false);
    }
  }

  async function onDelete() {
    if (!client) return;
    setBusy(true);
    try {
      await api.clients.remove(client.id);
      router.push("/internal/erp/team/clients");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not delete.");
      setConfirmDelete(false);
      setBusy(false);
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-24 animate-pulse rounded-xl bg-neutral-900" />
        <div className="h-96 animate-pulse rounded-xl bg-neutral-900" />
      </div>
    );
  }

  if (!client) {
    return (
      <div className="py-20 text-center">
        <p className="text-base font-bold text-white">{error ?? "Client not found"}</p>
        <Button asChild variant="outline"
          className="mt-6 h-11 rounded-lg border-white/20 bg-transparent px-5 font-semibold text-white hover:bg-white/10">
          <Link href="/internal/erp/team/clients">Back to clients</Link>
        </Button>
      </div>
    );
  }

  const TABS: { id: Tab; label: string; Icon: typeof FolderKanban; count?: number }[] = [
    { id: "work", label: "Work", Icon: FolderKanban },
    { id: "access", label: "Portal access", Icon: Users, count: client.user_count },
    { id: "details", label: "Company details", Icon: Building2 },
  ];

  return (
    <div className="space-y-6">
      <Link href="/internal/erp/team/clients"
        className="inline-flex items-center gap-2 text-sm font-semibold text-white/55 transition-colors hover:text-white">
        <ArrowLeft className="size-4" /> All clients
      </Link>

      {/* ---------- header card ---------- */}
      <header className="overflow-hidden rounded-xl border border-white/10 bg-neutral-900">
        <div className="flex flex-wrap items-start justify-between gap-5 p-6">
          <div className="flex min-w-0 items-start gap-4">
            <span className="flex size-12 shrink-0 items-center justify-center rounded-lg bg-brand-green/10">
              <Building2 className="size-5 text-brand-green" />
            </span>
            <div className="min-w-0">
              <h1 className="font-display text-2xl font-700 uppercase leading-tight text-white md:text-3xl">
                {client.name}
              </h1>
              <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-sm font-medium text-white/55">
                <span>{CLIENT_TYPE_LABELS[client.client_type]}</span>
                {client.country && (
                  <span className="flex items-center gap-1.5">
                    <MapPin className="size-3.5" /> {client.country}
                  </span>
                )}
                {client.contact_email && (
                  <a href={`mailto:${client.contact_email}`}
                    className="flex items-center gap-1.5 transition-colors hover:text-brand-green">
                    <Mail className="size-3.5" /> {client.contact_email}
                  </a>
                )}
                {client.nda_signed && (
                  <span className="flex items-center gap-1.5 text-brand-green">
                    <FileCheck2 className="size-3.5" /> NDA signed
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <Select value={client.status} onValueChange={(v) => changeStatus(v as ClientStatus)}
              disabled={busy}>
              <SelectTrigger aria-label="Status"
                className={cn("h-10 w-36 rounded-lg border text-xs font-bold uppercase",
                  STATUS_STYLE[client.status])}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="rounded-lg">
                {Object.entries(STATUS_LABELS).map(([v, l]) => (
                  <SelectItem key={v} value={v}>{l}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button onClick={() => setConfirmDelete(true)} variant="outline" aria-label="Delete client"
              className="size-10 rounded-lg border-white/15 bg-transparent p-0 text-white/50 hover:border-brand-ember/40 hover:bg-brand-ember/10 hover:text-brand-ember">
              <Trash2 className="size-4" />
            </Button>
          </div>
        </div>

        {/* ---------- tabs ---------- */}
        <nav className="flex gap-1 border-t border-white/[0.07] px-4" aria-label="Client sections">
          {TABS.map(({ id, label, Icon, count }) => (
            <button key={id} type="button" onClick={() => { setTab(id); setEditing(false); }}
              aria-current={tab === id ? "page" : undefined}
              className={cn(
                "relative flex items-center gap-2 px-4 py-3.5 text-sm font-semibold transition-colors",
                tab === id ? "text-white" : "text-white/50 hover:text-white/80"
              )}>
              <Icon className={cn("size-4", tab === id ? "text-brand-green" : "text-white/35")} />
              {label}
              {count !== undefined && count > 0 && (
                <span className="rounded bg-white/10 px-1.5 py-0.5 text-[11px] font-bold tabular-nums">
                  {count}
                </span>
              )}
              {tab === id && <span className="absolute inset-x-2 bottom-0 h-0.5 bg-brand-green" />}
            </button>
          ))}
        </nav>
      </header>

      {notice && (
        <Banner tone="good" onClose={() => setNotice(null)}>{notice}</Banner>
      )}
      {error && (
        <Banner tone="bad" onClose={() => setError(null)}>{error}</Banner>
      )}

      {confirmDelete && (
        <div className="rounded-xl border border-brand-ember/40 bg-brand-ember/[0.07] p-5">
          <p className="text-sm font-bold text-white">Delete {client.name} permanently?</p>
          <p className="mt-2 text-sm font-medium text-white/70">
            This cannot be undone. If their history is worth keeping, set the
            status to Archived instead.
          </p>
          <div className="mt-4 flex gap-2.5">
            <Button onClick={onDelete} disabled={busy}
              className="h-10 rounded-lg bg-brand-ember px-5 text-xs font-bold text-white hover:bg-brand-ember/90">
              {busy ? <Loader2 className="size-4 animate-spin" /> : "Yes, delete"}
            </Button>
            <Button onClick={() => setConfirmDelete(false)} variant="outline" disabled={busy}
              className="h-10 rounded-lg border-white/20 bg-transparent px-5 text-xs font-bold text-white hover:bg-white/10">
              Cancel
            </Button>
          </div>
        </div>
      )}

      {/* ---------- panels ---------- */}
      {tab === "work" && <ProjectBoard clientId={client.id} />}

      {tab === "access" && (
        <ClientPortalAccess clientId={client.id}
          clientName={client.trading_name ?? client.name}
          contactEmail={client.contact_email}
          onChanged={() => void load()} />
      )}

      {tab === "details" && (
        editing ? (
          <form onSubmit={onSave}
            className="space-y-7 rounded-xl border border-white/10 bg-neutral-900 p-6">
            <Group title="Identity">
              <F id="name" label="Legal name" required defaultValue={client.name} />
              <F id="trading_name" label="Trading name" defaultValue={client.trading_name} />
              <F id="registration_no" label="Registration no." defaultValue={client.registration_no} />
              <F id="tax_no" label="VAT / GST no." defaultValue={client.tax_no} />
              <F id="website" label="Website" defaultValue={client.website} />
            </Group>
            <Group title="Classification">
              <Sel id="client_type" label="Client type" defaultValue={client.client_type} options={CLIENT_TYPE_LABELS} />
              <F id="sector" label="Sector" defaultValue={client.sector} />
              <F id="default_standard" label="Default standard" defaultValue={client.default_standard} />
            </Group>
            <Group title="Address">
              <F id="country" label="Country" defaultValue={client.country} />
              <F id="city" label="City" defaultValue={client.city} />
              <F id="address_line1" label="Address" defaultValue={client.address_line1} />
              <F id="postcode" label="Postcode" defaultValue={client.postcode} />
            </Group>
            <Group title="Relationship">
              <Sel id="contracting_entity" label="Contracting entity" defaultValue={client.contracting_entity} options={ENTITY_LABELS} />
              <F id="contact_name" label="Contact name" defaultValue={client.contact_name} />
              <F id="contact_email" label="Contact email" type="email" defaultValue={client.contact_email} />
              <F id="contact_phone" label="Contact phone" defaultValue={client.contact_phone} />
            </Group>
            <Group title="Internal">
              <label className="flex items-center gap-3 py-1">
                <input type="checkbox" name="nda_signed" defaultChecked={client.nda_signed}
                  className="size-4 accent-[#00A651]" />
                <span className="text-sm font-semibold text-white">NDA signed</span>
              </label>
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="notes" className="text-xs font-bold uppercase tracking-wide text-white/70">
                  Notes
                </Label>
                <Textarea id="notes" name="notes" rows={4} defaultValue={client.notes ?? ""}
                  className="resize-none rounded-lg border-white/15 bg-neutral-950 text-sm font-medium text-white" />
              </div>
            </Group>

            <div className="flex gap-3 border-t border-white/[0.07] pt-6">
              <Button type="submit" disabled={busy}
                className="h-11 rounded-lg bg-brand-green px-7 font-semibold text-white hover:bg-brand-green/90">
                {busy ? <Loader2 className="size-4 animate-spin" /> : "Save changes"}
              </Button>
              <Button type="button" variant="outline" disabled={busy} onClick={() => setEditing(false)}
                className="h-11 rounded-lg border-white/20 bg-transparent px-6 font-semibold text-white hover:bg-white/10">
                Cancel
              </Button>
            </div>
          </form>
        ) : (
          <div className="overflow-hidden rounded-xl border border-white/10 bg-neutral-900">
            <div className="flex items-center justify-between px-6 py-4">
              <h2 className="text-sm font-bold text-white">Company details</h2>
              <Button onClick={() => setEditing(true)} variant="outline"
                className="h-9 rounded-lg border-white/20 bg-transparent px-4 text-xs font-bold text-white hover:bg-white/10">
                <Pencil className="mr-2 size-3.5" /> Edit
              </Button>
            </div>
            <div className="grid gap-px border-t border-white/[0.07] bg-white/[0.07] lg:grid-cols-2">
              <Section title="Identity" rows={[
                ["Trading name", client.trading_name],
                ["Registration no.", client.registration_no],
                ["VAT / GST", client.tax_no],
                ["Website", client.website],
                ["Sector", client.sector],
                ["Default standard", client.default_standard],
              ]} />
              <Section title="Address" rows={[
                ["Country", client.country],
                ["City", client.city],
                ["Address", client.address_line1],
                ["Postcode", client.postcode],
              ]} />
              <Section title="Relationship" rows={[
                ["Contracting entity", ENTITY_LABELS[client.contracting_entity]],
                ["Contact", client.contact_name],
                ["Email", client.contact_email],
                ["Phone", client.contact_phone],
              ]} />
              <Section title="Internal" rows={[
                ["NDA", client.nda_signed
                  ? `Signed${client.nda_signed_on ? ` · ${formatDate(client.nda_signed_on)}` : ""}`
                  : "Not signed"],
                ["Onboarded", formatDate(client.onboarded_on)],
                ["Portal users", String(client.user_count)],
                ["Notes", client.notes],
              ]} />
            </div>
          </div>
        )
      )}
    </div>
  );
}

/* ------------------------------------------------------------ pieces */

function Banner({
  tone, onClose, children,
}: { tone: "good" | "bad"; onClose: () => void; children: React.ReactNode }) {
  const good = tone === "good";
  return (
    <div className={cn(
      "flex items-start gap-3 rounded-lg border px-4 py-3",
      good ? "border-brand-green/30 bg-brand-green/[0.07]" : "border-brand-ember/30 bg-brand-ember/[0.07]"
    )}>
      {good
        ? <Check className="mt-0.5 size-4 shrink-0 text-brand-green" />
        : <AlertCircle className="mt-0.5 size-4 shrink-0 text-brand-ember" />}
      <p className={cn("flex-1 text-sm font-semibold", good ? "text-white/90" : "text-brand-ember")}>
        {children}
      </p>
      <button onClick={onClose} aria-label="Dismiss" className="text-white/40 hover:text-white">
        <X className="size-4" />
      </button>
    </div>
  );
}

function Group({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <fieldset>
      <legend className="text-xs font-bold uppercase tracking-[0.14em] text-brand-green">
        {title}
      </legend>
      <div className="mt-4 grid gap-5 sm:grid-cols-2">{children}</div>
    </fieldset>
  );
}

function F({
  id, label, required, type = "text", defaultValue,
}: { id: string; label: string; required?: boolean; type?: string; defaultValue?: string | null }) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id} className="text-xs font-bold uppercase tracking-wide text-white/70">
        {label}{required && <span className="ml-1 text-brand-green">*</span>}
      </Label>
      <Input id={id} name={id} type={type} required={required} defaultValue={defaultValue ?? ""}
        className="h-11 rounded-lg border-white/15 bg-neutral-950 text-sm font-medium text-white" />
    </div>
  );
}

function Sel({
  id, label, defaultValue, options,
}: { id: string; label: string; defaultValue: string; options: Record<string, string> }) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id} className="text-xs font-bold uppercase tracking-wide text-white/70">
        {label}
      </Label>
      <Select name={id} defaultValue={defaultValue}>
        <SelectTrigger id={id}
          className="h-11 rounded-lg border-white/15 bg-neutral-950 text-sm font-medium text-white">
          <SelectValue />
        </SelectTrigger>
        <SelectContent className="rounded-lg">
          {Object.entries(options).map(([v, l]) => (
            <SelectItem key={v} value={v}>{l}</SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

function Section({ title, rows }: { title: string; rows: [string, string | null][] }) {
  const filled = rows.filter(([, v]) => v);
  return (
    <div className="bg-neutral-900 p-6">
      <h3 className="text-xs font-bold uppercase tracking-[0.14em] text-brand-green">{title}</h3>
      {filled.length === 0 ? (
        <p className="mt-4 text-sm font-medium text-white/35">Nothing recorded yet</p>
      ) : (
        <dl className="mt-4 divide-y divide-white/[0.07]">
          {filled.map(([k, v]) => (
            <div key={k} className="flex gap-4 py-2.5">
              <dt className="w-36 shrink-0 text-sm font-medium text-white/45">{k}</dt>
              <dd className="min-w-0 flex-1 text-sm font-semibold text-white/90">{v}</dd>
            </div>
          ))}
        </dl>
      )}
    </div>
  );
}
