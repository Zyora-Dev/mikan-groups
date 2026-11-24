"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import {
  AlertCircle, ArrowLeft, Building2, Check, Loader2, Pencil, Trash2, X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ClientPortalAccess } from "@/components/client-portal-access";
import { ProjectBoard } from "@/components/project-board";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  ApiError, CLIENT_TYPE_LABELS, type ClientDetail, type ClientStatus,
  ENTITY_LABELS, STATUS_LABELS, api,
} from "@/lib/api";
import { cn } from "@/lib/utils";

const STATUS_STYLE: Record<ClientStatus, string> = {
  active: "border-brand-green/40 bg-brand-green/10 text-brand-green",
  prospect: "border-brand-cyan/40 bg-brand-cyan/10 text-brand-cyan",
  dormant: "border-white/25 bg-white/5 text-white/70",
  archived: "border-white/15 bg-transparent text-white/45",
};

export function ClientPage({ clientId }: { clientId: string }) {
  const router = useRouter();
  const [client, setClient] = useState<ClientDetail | null>(null);
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

  useEffect(() => {
    void load();
  }, [load]);

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
      <p className="py-20 text-center text-sm font-bold uppercase tracking-wide text-white/45">
        Loading…
      </p>
    );
  }

  if (!client) {
    return (
      <div className="py-20 text-center">
        <p className="text-base font-bold text-white">{error ?? "Client not found"}</p>
        <Button asChild variant="outline"
          className="mt-6 h-11 rounded-none border-white/20 bg-transparent px-5 font-semibold text-white hover:bg-white/10">
          <Link href="/internal/erp/team/clients">Back to clients</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <Link href="/internal/erp/team/clients"
        className="inline-flex items-center gap-2 text-sm font-bold text-white/60 transition-colors hover:text-white">
        <ArrowLeft className="size-4" /> All clients
      </Link>

      {/* ---- header ---- */}
      <div className="flex flex-wrap items-start justify-between gap-5">
        <div className="flex items-start gap-4">
          <span className="flex size-14 shrink-0 items-center justify-center border border-white/15 bg-neutral-900">
            <Building2 className="size-6 text-brand-green" />
          </span>
          <div>
            <h1 className="font-display text-3xl font-700 uppercase leading-none text-white">
              {client.name}
            </h1>
            <p className="mt-2.5 text-base font-medium text-white/65">
              {CLIENT_TYPE_LABELS[client.client_type]}
              {client.country && ` · ${client.country}`}
              {client.sector && ` · ${client.sector}`}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Select value={client.status} onValueChange={(v) => changeStatus(v as ClientStatus)} disabled={busy}>
            <SelectTrigger aria-label="Status"
              className={cn("h-11 w-40 rounded-none border text-sm font-bold uppercase", STATUS_STYLE[client.status])}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="rounded-none">
              {Object.entries(STATUS_LABELS).map(([v, l]) => (
                <SelectItem key={v} value={v} className="rounded-none">{l}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          {!editing && (
            <Button onClick={() => setEditing(true)} variant="outline"
              className="h-11 rounded-none border-white/20 bg-transparent px-4 text-sm font-bold text-white hover:bg-white/10">
              <Pencil className="mr-2 size-4" /> Edit
            </Button>
          )}
          <Button onClick={() => setConfirmDelete(true)} variant="outline"
            className="h-11 rounded-none border-brand-ember/40 bg-transparent px-4 text-sm font-bold text-brand-ember hover:bg-brand-ember/10">
            <Trash2 className="mr-2 size-4" /> Delete
          </Button>
        </div>
      </div>

      {notice && (
        <div className="flex items-start gap-3 border-l-2 border-brand-green bg-brand-green/10 px-4 py-3">
          <Check className="mt-0.5 size-4 shrink-0 text-brand-green" />
          <p className="flex-1 text-sm font-semibold text-white/90">{notice}</p>
          <button onClick={() => setNotice(null)} aria-label="Dismiss"
            className="text-white/45 hover:text-white"><X className="size-4" /></button>
        </div>
      )}

      {error && (
        <p role="alert" className="flex items-start gap-2.5 border-l-2 border-brand-ember bg-brand-ember/10 px-4 py-3 text-sm font-semibold text-brand-ember">
          <AlertCircle className="mt-0.5 size-4 shrink-0" />
          <span className="flex-1">{error}</span>
          <button onClick={() => setError(null)} aria-label="Dismiss"><X className="size-4" /></button>
        </p>
      )}

      {confirmDelete && (
        <div className="border border-brand-ember/40 bg-brand-ember/10 p-5">
          <p className="text-sm font-bold text-white">Delete {client.name} permanently?</p>
          <p className="mt-2 text-sm font-medium text-white/70">
            This cannot be undone. If their history is worth keeping, set the
            status to Archived instead.
          </p>
          <div className="mt-4 flex gap-2.5">
            <Button onClick={onDelete} disabled={busy}
              className="h-10 rounded-none bg-brand-ember px-5 text-xs font-bold text-white hover:bg-brand-ember/90">
              {busy ? <Loader2 className="size-4 animate-spin" /> : "Yes, delete"}
            </Button>
            <Button onClick={() => setConfirmDelete(false)} variant="outline" disabled={busy}
              className="h-10 rounded-none border-white/20 bg-transparent px-5 text-xs font-bold text-white hover:bg-white/10">
              Cancel
            </Button>
          </div>
        </div>
      )}

      {/* ---- portal access ---- */}
      <ClientPortalAccess
        clientId={client.id}
        clientName={client.trading_name ?? client.name}
        contactEmail={client.contact_email}
        onChanged={() => void load()}
      />

      {/* ---- projects ---- */}
      <ProjectBoard clientId={client.id} />

      {/* ---- details ---- */}
      {editing ? (
        <form onSubmit={onSave} className="space-y-7 border border-white/10 p-6">
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
              <Label htmlFor="notes" className="text-xs font-bold uppercase tracking-wide text-white/80">Notes</Label>
              <Textarea id="notes" name="notes" rows={4} defaultValue={client.notes ?? ""}
                className="resize-none rounded-none border-white/15 bg-neutral-950 text-sm font-medium text-white" />
            </div>
          </Group>

          <div className="flex gap-3 border-t border-white/10 pt-6">
            <Button type="submit" disabled={busy}
              className="h-12 rounded-none bg-brand-green px-8 font-semibold text-white hover:bg-brand-green/90 disabled:opacity-60">
              {busy ? <>Saving <Loader2 className="ml-2.5 size-4 animate-spin" /></> : "Save changes"}
            </Button>
            <Button type="button" variant="outline" disabled={busy} onClick={() => setEditing(false)}
              className="h-12 rounded-none border-white/20 bg-transparent px-6 font-semibold text-white hover:bg-white/10">
              Cancel
            </Button>
          </div>
        </form>
      ) : (
        <div className="grid gap-6 lg:grid-cols-2">
          <Section title="Identity" rows={[
            ["Trading name", client.trading_name],
            ["Registration no.", client.registration_no],
            ["VAT / GST", client.tax_no],
            ["Website", client.website],
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
            ["NDA", client.nda_signed ? `Signed${client.nda_signed_on ? ` · ${client.nda_signed_on}` : ""}` : "Not signed"],
            ["Onboarded", client.onboarded_on],
            ["Portal users", String(client.user_count)],
            ["Notes", client.notes],
          ]} />
        </div>
      )}
    </div>
  );
}

function Group({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <fieldset>
      <legend className="text-xs font-bold uppercase tracking-[0.14em] text-brand-green">{title}</legend>
      <div className="mt-4 grid gap-5 sm:grid-cols-2">{children}</div>
    </fieldset>
  );
}

function F({
  id, label, required, type = "text", defaultValue,
}: { id: string; label: string; required?: boolean; type?: string; defaultValue?: string | null }) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id} className="text-xs font-bold uppercase tracking-wide text-white/80">
        {label}{required && <span className="ml-1 text-brand-green">*</span>}
      </Label>
      <Input id={id} name={id} type={type} required={required} defaultValue={defaultValue ?? ""}
        className="h-11 rounded-none border-white/15 bg-neutral-950 text-sm font-medium text-white" />
    </div>
  );
}

function Sel({
  id, label, defaultValue, options,
}: { id: string; label: string; defaultValue: string; options: Record<string, string> }) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id} className="text-xs font-bold uppercase tracking-wide text-white/80">{label}</Label>
      <Select name={id} defaultValue={defaultValue}>
        <SelectTrigger id={id} className="h-11 rounded-none border-white/15 bg-neutral-950 text-sm font-medium text-white">
          <SelectValue />
        </SelectTrigger>
        <SelectContent className="rounded-none">
          {Object.entries(options).map(([v, l]) => (
            <SelectItem key={v} value={v} className="rounded-none">{l}</SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

function Section({ title, rows }: { title: string; rows: [string, string | null][] }) {
  return (
    <div className="border border-white/10 p-6">
      <h3 className="text-xs font-bold uppercase tracking-[0.14em] text-brand-green">{title}</h3>
      <dl className="mt-4 divide-y divide-white/10 border-t border-white/10">
        {rows.map(([k, v]) => (
          <div key={k} className="flex gap-4 py-3">
            <dt className="w-40 shrink-0 text-sm font-semibold text-white/55">{k}</dt>
            <dd className="min-w-0 flex-1 text-sm font-medium text-white/90">
              {v || <span className="text-white/35">—</span>}
            </dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
