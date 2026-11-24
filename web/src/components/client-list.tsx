"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  AlertCircle, Building2, Check, ChevronRight, FileCheck2, Loader2,
  Plus, Search, Users, X,
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
import { initials } from "@/lib/project-ui";
import { cn } from "@/lib/utils";

const STATUS_STYLE: Record<ClientStatus, string> = {
  active: "border-brand-green/40 bg-brand-green/10 text-brand-green",
  prospect: "border-brand-cyan/40 bg-brand-cyan/10 text-brand-cyan",
  dormant: "border-white/25 bg-white/5 text-white/70",
  archived: "border-white/15 bg-transparent text-white/40",
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
  const [all, setAll] = useState<ClientSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<ClientStatus | "all">("all");
  const [addOpen, setAddOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const [filtered, everything] = await Promise.all([
        api.clients.list({
          search: search || undefined,
          status: filter === "all" ? undefined : filter,
        }),
        api.clients.list(),
      ]);
      setClients(filtered);
      setAll(everything);
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

  // Counts come from the unfiltered set, so chips don't collapse as you filter.
  const counts = useMemo(() => {
    const by: Record<string, number> = { all: all.length };
    for (const c of all) by[c.status] = (by[c.status] ?? 0) + 1;
    return by;
  }, [all]);

  const summary = useMemo(() => ({
    total: all.length,
    active: all.filter((c) => c.status === "active").length,
    withAccess: all.filter((c) => c.user_count > 0).length,
    countries: new Set(all.map((c) => c.country).filter(Boolean)).size,
  }), [all]);

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
      setNotice(`${created.name} onboarded. Grant portal access next.`);
      await load();
    } catch (err) {
      setFormError(err instanceof ApiError ? err.message : "Could not create the client.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* ---------- header ---------- */}
      <header className="flex flex-wrap items-start justify-between gap-5">
        <div>
          <h1 className="font-display text-3xl font-700 uppercase leading-none text-white">
            Clients
          </h1>
          <p className="mt-2.5 text-sm font-medium text-white/55">
            Each is a separate tenant — their people only ever see their own work.
          </p>
        </div>
        <Button onClick={() => { setFormError(null); setAddOpen(true); }}
          className="h-11 rounded-lg bg-brand-green px-5 font-semibold text-white hover:bg-brand-green/90">
          <Plus className="mr-2.5 size-4" /> Onboard client
        </Button>
      </header>

      {/* ---------- summary ---------- */}
      <div className="grid gap-px overflow-hidden rounded-xl border border-white/10 bg-white/[0.07] sm:grid-cols-2 lg:grid-cols-4">
        <Mini label="Clients" value={summary.total} sub="On the books" />
        <Mini label="Active" value={summary.active} sub="Currently trading" />
        <Mini label="With portal access" value={summary.withAccess}
          sub={summary.total - summary.withAccess > 0
            ? `${summary.total - summary.withAccess} without`
            : "All set up"} />
        <Mini label="Countries" value={summary.countries} sub="Across the book" />
      </div>

      {notice && (
        <div className="flex items-start gap-3 rounded-lg border border-brand-green/30 bg-brand-green/[0.07] px-4 py-3">
          <Check className="mt-0.5 size-4 shrink-0 text-brand-green" />
          <p className="flex-1 text-sm font-semibold text-white/90">{notice}</p>
          <button onClick={() => setNotice(null)} aria-label="Dismiss"
            className="text-white/40 hover:text-white"><X className="size-4" /></button>
        </div>
      )}

      {/* ---------- list ---------- */}
      <section className="overflow-hidden rounded-xl border border-white/10 bg-neutral-900">
        <div className="flex flex-wrap items-center gap-3 p-4">
          <div className="relative min-w-[15rem] flex-1">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-white/35" />
            <Input value={search} onChange={(e) => setSearch(e.target.value)}
              placeholder="Search clients"
              className="h-10 rounded-lg border-white/10 bg-neutral-950 pl-10 text-sm font-medium text-white placeholder:text-white/30" />
          </div>
          <div className="flex flex-wrap gap-1.5">
            {FILTERS.map((f) => {
              const n = counts[f.value] ?? 0;
              return (
                <button key={f.value} type="button" onClick={() => setFilter(f.value)}
                  aria-pressed={filter === f.value}
                  className={cn(
                    "flex items-center gap-2 rounded-lg px-3.5 py-2 text-xs font-bold transition-colors",
                    filter === f.value
                      ? "bg-white text-neutral-950"
                      : "text-white/55 hover:bg-white/[0.06] hover:text-white"
                  )}>
                  {f.label}
                  <span className={cn("tabular-nums",
                    filter === f.value ? "text-neutral-950/50" : "text-white/35")}>
                    {n}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {loading ? (
          <div className="divide-y divide-white/[0.07] border-t border-white/[0.07]">
            {[0, 1, 2].map((i) => (
              <div key={i} className="h-[4.5rem] animate-pulse bg-white/[0.02]" />
            ))}
          </div>
        ) : clients.length === 0 ? (
          <div className="border-t border-white/[0.07] p-14 text-center">
            <Building2 className="mx-auto size-8 text-white/20" />
            <p className="mt-4 text-base font-bold text-white">
              {search || filter !== "all" ? "No clients match" : "No clients yet"}
            </p>
            <p className="mt-2 text-sm font-medium text-white/50">
              {search || filter !== "all"
                ? "Try a different search or filter."
                : "Onboard your first client to get started."}
            </p>
          </div>
        ) : (
          <ul className="divide-y divide-white/[0.07] border-t border-white/[0.07]">
            {clients.map((c) => (
              <li key={c.id}>
                <Link href={`/internal/erp/team/clients/${c.id}`}
                  className="group grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-4 px-4 py-3.5 transition-colors hover:bg-white/[0.04] sm:gap-6">
                  <span className={cn(
                    "flex size-10 shrink-0 items-center justify-center rounded-lg text-xs font-bold",
                    c.status === "active"
                      ? "bg-brand-green/10 text-brand-green"
                      : "bg-white/[0.06] text-white/50"
                  )}>
                    {initials(c.name)}
                  </span>

                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="truncate text-sm font-bold text-white transition-colors group-hover:text-brand-green">
                        {c.name}
                      </span>
                      <span className={cn("rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide",
                        STATUS_STYLE[c.status])}>
                        {c.status}
                      </span>
                      {c.nda_signed && (
                        <FileCheck2 className="size-3.5 text-white/35" aria-label="NDA signed" />
                      )}
                    </div>
                    <p className="mt-1 truncate text-xs font-medium text-white/45">
                      {CLIENT_TYPE_LABELS[c.client_type]}
                      {c.country && ` · ${c.country}`}
                      {c.sector && ` · ${c.sector}`}
                      {` · ${ENTITY_LABELS[c.contracting_entity]} entity`}
                    </p>
                  </div>

                  <div className="flex items-center gap-4">
                    <span className={cn(
                      "hidden items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-bold sm:flex",
                      c.user_count > 0
                        ? "bg-white/[0.06] text-white/70"
                        : "bg-brand-orange/10 text-brand-orange"
                    )}>
                      <Users className="size-3.5" />
                      {c.user_count > 0 ? c.user_count : "No access"}
                    </span>
                    <ChevronRight className="size-4 text-white/25 transition-all group-hover:translate-x-0.5 group-hover:text-white/60" />
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* ---------- onboard ---------- */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="rounded-xl border-white/10 bg-neutral-900 text-white sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-display text-2xl font-700 uppercase">
              Onboard client
            </DialogTitle>
            <DialogDescription className="text-sm font-medium text-white/60">
              Just the essentials — registration, address and the rest can be
              filled in later.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={onCreate} noValidate className="mt-4 space-y-5">
            <Field id="name" label="Legal name" required>
              <Input id="name" name="name" required disabled={busy}
                placeholder="Pacific Steel Fabricators Pty Ltd"
                className="h-11 rounded-lg border-white/15 bg-neutral-950 text-sm font-medium text-white placeholder:text-white/30" />
            </Field>

            <div className="grid gap-5 sm:grid-cols-2">
              <Field id="client_type" label="Client type" required>
                <Select name="client_type" defaultValue="main_contractor">
                  <SelectTrigger id="client_type"
                    className="h-11 rounded-lg border-white/15 bg-neutral-950 text-sm font-medium text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="rounded-lg">
                    {Object.entries(CLIENT_TYPE_LABELS).map(([v, l]) => (
                      <SelectItem key={v} value={v}>{l}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
              <Field id="country" label="Country" required>
                <Input id="country" name="country" required disabled={busy} placeholder="Australia"
                  className="h-11 rounded-lg border-white/15 bg-neutral-950 text-sm font-medium text-white placeholder:text-white/30" />
              </Field>
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
              <Field id="contracting_entity" label="Contracting entity" required>
                <Select name="contracting_entity" defaultValue="singapore">
                  <SelectTrigger id="contracting_entity"
                    className="h-11 rounded-lg border-white/15 bg-neutral-950 text-sm font-medium text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="rounded-lg">
                    {Object.entries(ENTITY_LABELS).map(([v, l]) => (
                      <SelectItem key={v} value={v}>{l}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
              <Field id="default_standard" label="Default standard">
                <Input id="default_standard" name="default_standard" disabled={busy}
                  placeholder="AS/NZS 5131"
                  className="h-11 rounded-lg border-white/15 bg-neutral-950 text-sm font-medium text-white placeholder:text-white/30" />
              </Field>
            </div>

            <Field id="contact_email" label="Primary contact email">
              <Input id="contact_email" name="contact_email" type="email" disabled={busy}
                placeholder="ops@client.com"
                className="h-11 rounded-lg border-white/15 bg-neutral-950 text-sm font-medium text-white placeholder:text-white/30" />
            </Field>

            {formError && (
              <p role="alert" className="flex items-start gap-2.5 rounded-lg border border-brand-ember/30 bg-brand-ember/[0.07] px-4 py-3 text-sm font-semibold text-brand-ember">
                <AlertCircle className="mt-0.5 size-4 shrink-0" /> {formError}
              </p>
            )}

            <div className="flex gap-3 pt-1">
              <Button type="submit" disabled={busy}
                className="h-11 flex-1 rounded-lg bg-brand-green font-semibold text-white hover:bg-brand-green/90 disabled:opacity-60">
                {busy ? <Loader2 className="size-4 animate-spin" /> : "Create client"}
              </Button>
              <Button type="button" variant="outline" disabled={busy} onClick={() => setAddOpen(false)}
                className="h-11 rounded-lg border-white/20 bg-transparent px-6 font-semibold text-white hover:bg-white/10">
                Cancel
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Mini({ label, value, sub }: { label: string; value: number; sub: string }) {
  return (
    <div className="bg-neutral-900 p-5">
      <p className="font-display text-3xl font-700 leading-none tabular-nums text-white">
        {value}
      </p>
      <p className="mt-2.5 text-sm font-bold text-white">{label}</p>
      <p className="mt-0.5 text-xs font-medium text-white/40">{sub}</p>
    </div>
  );
}

function Field({
  id, label, required, children,
}: { id: string; label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id} className="text-xs font-bold uppercase tracking-wide text-white/70">
        {label}{required && <span className="ml-1 text-brand-green">*</span>}
      </Label>
      {children}
    </div>
  );
}
