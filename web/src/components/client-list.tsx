"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import {
  AlertCircle, Building2, Check, ChevronRight, FileCheck2, Loader2, Plus, Search, Users, X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  ApiError, CLIENT_TYPE_LABELS, type ClientStatus, type ClientSummary,
  type ClientType, type ContractingEntity, ENTITY_LABELS, api,
} from "@/lib/api";
import { cn } from "@/lib/utils";

const STATUS_STYLE: Record<ClientStatus, string> = {
  active: "border-brand-green/40 bg-brand-green/10 text-brand-green",
  prospect: "border-brand-cyan/40 bg-brand-cyan/10 text-brand-cyan",
  dormant: "border-white/25 bg-white/5 text-white/70",
  archived: "border-white/15 bg-transparent text-white/45",
};

const FILTERS: { value: ClientStatus | "all"; label: string }[] = [
  { value: "all", label: "All" },
  { value: "active", label: "Active" },
  { value: "prospect", label: "Prospect" },
  { value: "dormant", label: "Dormant" },
  { value: "archived", label: "Archived" },
];

export function ClientList() {
  const router = useRouter();
  const [clients, setClients] = useState<ClientSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<ClientStatus | "all">("all");
  const [addOpen, setAddOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setClients(
        await api.clients.list({
          search: search || undefined,
          status: filter === "all" ? undefined : filter,
        })
      );
    } catch (err) {
      if (err instanceof ApiError && (err.status === 401 || err.status === 403)) {
        router.replace("/internal/erp/team/login");
        return;
      }
      setNotice("Could not load clients.");
    } finally {
      setLoading(false);
    }
  }, [router, search, filter]);

  useEffect(() => {
    const t = setTimeout(() => void load(), search ? 300 : 0);
    return () => clearTimeout(t);
  }, [load, search]);

  async function onCreate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    setFormError(null);
    setBusy(true);
    try {
      const created = await api.clients.create({
        name: String(fd.get("name") ?? "").trim(),
        client_type: String(fd.get("client_type") ?? "other") as ClientType,
        country: String(fd.get("country") ?? "").trim(),
        contracting_entity: String(fd.get("contracting_entity") ?? "singapore") as ContractingEntity,
        contact_email: String(fd.get("contact_email") ?? "").trim() || undefined,
        default_standard: String(fd.get("default_standard") ?? "").trim() || undefined,
      });
      setAddOpen(false);
      setNotice(`${created.name} onboarded. Add their people next.`);
      await load();
    } catch (err) {
      setFormError(err instanceof ApiError ? err.message : "Could not create the client.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-5">
        <div>
          <h1 className="font-display text-3xl font-700 uppercase leading-none text-white">
            Client organisations
          </h1>
          <p className="mt-3 text-base font-medium text-white/65">
            Companies you deliver for. Each is a separate tenant — their people
            only ever see their own projects.
          </p>
        </div>
        <Button onClick={() => { setFormError(null); setAddOpen(true); }}
          className="h-12 rounded-lg bg-brand-green px-6 font-semibold text-white hover:bg-brand-green/90">
          <Plus className="mr-2.5 size-4" /> Onboard client
        </Button>
      </div>

      {notice && (
        <div className="mt-7 flex items-start gap-3 border-l-2 border-brand-green bg-brand-green/10 px-4 py-3">
          <Check className="mt-0.5 size-4 shrink-0 text-brand-green" />
          <p className="flex-1 text-sm font-semibold text-white/90">{notice}</p>
          <button onClick={() => setNotice(null)} aria-label="Dismiss"
            className="text-white/45 transition-colors hover:text-white">
            <X className="size-4" />
          </button>
        </div>
      )}

      {/* filters */}
      <div className="mt-8 flex flex-wrap items-center gap-3">
        <div className="relative min-w-[16rem] flex-1">
          <Search className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-white/40" />
          <Input value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name"
            className="h-11 rounded-lg border-white/15 bg-neutral-900 pl-11 text-base font-medium text-white placeholder:text-white/35" />
        </div>
        <div className="flex gap-2">
          {FILTERS.map((f) => (
            <button key={f.value} type="button" onClick={() => setFilter(f.value)}
              aria-pressed={filter === f.value}
              className={cn(
                "border px-4 py-2.5 text-xs font-bold uppercase tracking-wide transition-colors",
                filter === f.value
                  ? "border-white bg-white text-neutral-950"
                  : "border-white/15 bg-neutral-900 text-white/65 hover:border-white/35 hover:text-white"
              )}>
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* list */}
      <div className="mt-6 border border-white/10">
        {loading ? (
          <p className="p-10 text-center text-sm font-bold uppercase tracking-wide text-white/45">
            Loading…
          </p>
        ) : clients.length === 0 ? (
          <div className="p-14 text-center">
            <Building2 className="mx-auto size-8 text-white/25" />
            <p className="mt-4 text-base font-bold text-white">
              {search || filter !== "all" ? "No clients match" : "No clients yet"}
            </p>
            <p className="mt-2 text-sm font-medium text-white/55">
              {search || filter !== "all"
                ? "Try a different search or filter."
                : "Onboard your first client to get started."}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-white/10">
            {clients.map((c) => (
              <Link key={c.id} href={`/internal/erp/team/clients/${c.id}`}
                className="flex w-full flex-wrap items-center gap-5 p-5 text-left transition-colors hover:bg-white/[0.05] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-green focus-visible:ring-inset">
                <span className="flex size-11 shrink-0 items-center justify-center border border-white/15 bg-neutral-950">
                  <Building2 className="size-5 text-brand-green" />
                </span>

                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2.5">
                    <p className="font-display text-lg font-700 uppercase leading-tight text-white">
                      {c.name}
                    </p>
                    <span className={cn(
                      "border px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide",
                      STATUS_STYLE[c.status]
                    )}>
                      {c.status}
                    </span>
                    {c.nda_signed && (
                      <span className="flex items-center gap-1.5 border border-white/20 px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide text-white/65">
                        <FileCheck2 className="size-3" /> NDA
                      </span>
                    )}
                  </div>
                  <p className="mt-1.5 text-sm font-medium text-white/70">
                    {CLIENT_TYPE_LABELS[c.client_type]}
                    {c.country && <span className="text-white/45"> · {c.country}</span>}
                    {c.sector && <span className="text-white/45"> · {c.sector}</span>}
                  </p>
                </div>

                <div className="text-right">
                  <p className="text-[11px] font-bold uppercase tracking-wide text-white/45">
                    Contract
                  </p>
                  <p className="mt-0.5 text-sm font-semibold text-white/85">
                    {ENTITY_LABELS[c.contracting_entity]}
                  </p>
                </div>

                <div className="flex w-24 items-center justify-end gap-2 text-white/70">
                  <Users className="size-4" />
                  <span className="text-sm font-bold tabular-nums">{c.user_count}</span>
                  <ChevronRight className="size-4 text-white/35" />
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* ---------- Onboard ---------- */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="rounded-xl border-white/10 bg-neutral-900 text-white sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-display text-2xl font-700 uppercase">
              Onboard client
            </DialogTitle>
            <DialogDescription className="text-sm font-medium text-white/65">
              Just the essentials now — registration, address and the rest can
              be filled in later.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={onCreate} noValidate className="mt-4 space-y-5">
            <Field id="name" label="Legal name" required>
              <Input id="name" name="name" required placeholder="Pacific Steel Fabricators Pty Ltd"
                disabled={busy}
                className="h-12 rounded-lg border-white/15 bg-neutral-950 text-base font-medium text-white placeholder:text-white/30" />
            </Field>

            <div className="grid gap-5 sm:grid-cols-2">
              <Field id="client_type" label="Client type" required>
                <Select name="client_type" defaultValue="main_contractor">
                  <SelectTrigger id="client_type"
                    className="h-12 rounded-lg border-white/15 bg-neutral-950 text-base font-medium text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="rounded-lg">
                    {Object.entries(CLIENT_TYPE_LABELS).map(([v, label]) => (
                      <SelectItem key={v} value={v} >{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>

              <Field id="country" label="Country" required>
                <Input id="country" name="country" required placeholder="Australia" disabled={busy}
                  className="h-12 rounded-lg border-white/15 bg-neutral-950 text-base font-medium text-white placeholder:text-white/30" />
              </Field>
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
              <Field id="contracting_entity" label="Contracting entity" required>
                <Select name="contracting_entity" defaultValue="singapore">
                  <SelectTrigger id="contracting_entity"
                    className="h-12 rounded-lg border-white/15 bg-neutral-950 text-base font-medium text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="rounded-lg">
                    {Object.entries(ENTITY_LABELS).map(([v, label]) => (
                      <SelectItem key={v} value={v} >{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>

              <Field id="default_standard" label="Default standard">
                <Input id="default_standard" name="default_standard" placeholder="AS/NZS 5131"
                  disabled={busy}
                  className="h-12 rounded-lg border-white/15 bg-neutral-950 text-base font-medium text-white placeholder:text-white/30" />
              </Field>
            </div>

            <Field id="contact_email" label="Primary contact email">
              <Input id="contact_email" name="contact_email" type="email"
                placeholder="ops@client.com" disabled={busy}
                className="h-12 rounded-lg border-white/15 bg-neutral-950 text-base font-medium text-white placeholder:text-white/30" />
            </Field>

            {formError && (
              <p role="alert" className="flex items-start gap-2.5 border-l-2 border-brand-ember bg-brand-ember/10 px-4 py-3 text-sm font-semibold text-brand-ember">
                <AlertCircle className="mt-0.5 size-4 shrink-0" />
                {formError}
              </p>
            )}

            <div className="flex gap-3 pt-2">
              <Button type="submit" disabled={busy}
                className="h-12 flex-1 rounded-lg bg-brand-green font-semibold text-white hover:bg-brand-green/90 disabled:opacity-60">
                {busy ? (<>Creating <Loader2 className="ml-2.5 size-4 animate-spin" /></>)
                      : (<><Building2 className="mr-2.5 size-4" /> Create client</>)}
              </Button>
              <Button type="button" variant="outline" disabled={busy} onClick={() => setAddOpen(false)}
                className="h-12 rounded-lg border-white/20 bg-transparent px-6 font-semibold text-white hover:bg-white/10">
                Cancel
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Field({
  id, label, required, children,
}: { id: string; label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id} className="text-xs font-bold uppercase tracking-wide text-white/80">
        {label}{required && <span className="ml-1 text-brand-green">*</span>}
      </Label>
      {children}
    </div>
  );
}
