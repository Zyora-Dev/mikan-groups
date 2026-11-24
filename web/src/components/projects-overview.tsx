"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  AlertTriangle, Building2, CalendarClock, ChevronRight, Clock,
  FolderKanban, Search, ThumbsUp,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  ApiError, type ClientSummary, type Project, PROJECT_STATUS_LABELS,
  type ProjectStatus, api,
} from "@/lib/api";
import {
  DUE_TONE, dueChip, formatDate, initials, PROJECT_STATUS_STYLE,
} from "@/lib/project-ui";
import { cn } from "@/lib/utils";

type Sort = "deadline" | "progress" | "client";

const FILTERS: { value: ProjectStatus | "all"; label: string }[] = [
  { value: "all", label: "All" },
  { value: "active", label: "Active" },
  { value: "planning", label: "Planning" },
  { value: "on_hold", label: "On hold" },
  { value: "completed", label: "Completed" },
];

export function ProjectsOverview() {
  const router = useRouter();
  const [projects, setProjects] = useState<Project[]>([]);
  const [clients, setClients] = useState<Record<string, ClientSummary>>({});
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<ProjectStatus | "all">("all");
  const [sort, setSort] = useState<Sort>("deadline");
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const [ps, cs] = await Promise.all([api.projects.list(), api.clients.list()]);
      setProjects(ps);
      setClients(Object.fromEntries(cs.map((c) => [c.id, c])));
    } catch (err) {
      if (err instanceof ApiError && (err.status === 401 || err.status === 403)) {
        router.replace("/internal/erp/team/login");
        return;
      }
      setError("Could not load projects.");
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => { void load(); }, [load]);

  const counts = useMemo(() => {
    const by: Record<string, number> = { all: projects.length };
    for (const p of projects) by[p.status] = (by[p.status] ?? 0) + 1;
    return by;
  }, [projects]);

  const summary = useMemo(() => {
    const open = projects.filter((p) => p.status !== "completed" && p.status !== "cancelled");
    return {
      live: projects.filter((p) => p.status === "active").length,
      overdue: projects.reduce((n, p) => n + p.overdue_count, 0),
      awaiting: projects.reduce((n, p) => n + p.awaiting_client, 0),
      progress: open.length
        ? Math.round(open.reduce((n, p) => n + p.progress, 0) / open.length)
        : 0,
    };
  }, [projects]);

  const shown = useMemo(() => {
    const term = search.trim().toLowerCase();
    let list = projects.filter((p) => {
      if (filter !== "all" && p.status !== filter) return false;
      if (!term) return true;
      const client = clients[p.organisation_id]?.name ?? "";
      return (
        p.title.toLowerCase().includes(term) ||
        p.job_number.toLowerCase().includes(term) ||
        client.toLowerCase().includes(term)
      );
    });

    list = [...list].sort((a, b) => {
      if (sort === "progress") return a.progress - b.progress;
      if (sort === "client") {
        return (clients[a.organisation_id]?.name ?? "")
          .localeCompare(clients[b.organisation_id]?.name ?? "");
      }
      // Deadline: soonest first, undated last.
      const av = a.target_date ?? "9999-12-31";
      const bv = b.target_date ?? "9999-12-31";
      return av.localeCompare(bv);
    });
    return list;
  }, [projects, clients, search, filter, sort]);

  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-display text-3xl font-700 uppercase leading-none text-white">
          Projects
        </h1>
        <p className="mt-2.5 text-sm font-medium text-white/55">
          Every job across every client. Open one to work on its tasks.
        </p>
      </header>

      {/* ---------- summary ---------- */}
      <div className="grid gap-px overflow-hidden rounded-xl border border-white/10 bg-white/[0.07] sm:grid-cols-2 lg:grid-cols-4">
        <Mini Icon={FolderKanban} label="Live projects" value={summary.live}
          sub={`${projects.length} in total`} />
        <Mini Icon={CalendarClock} label="Average progress" value={`${summary.progress}%`}
          sub="Across open projects" />
        <Mini Icon={AlertTriangle} label="Overdue tasks" value={summary.overdue}
          sub="Across all projects" tone={summary.overdue > 0 ? "danger" : undefined} />
        <Mini Icon={ThumbsUp} label="With clients" value={summary.awaiting}
          sub="Submitted, not yet judged" tone={summary.awaiting > 0 ? "warn" : undefined} />
      </div>

      {/* ---------- list ---------- */}
      <section className="overflow-hidden rounded-xl border border-white/10 bg-neutral-900">
        <div className="flex flex-wrap items-center gap-3 p-4">
          <div className="relative min-w-[14rem] flex-1">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-white/35" />
            <Input value={search} onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by job number, title or client"
              className="h-10 rounded-lg border-white/10 bg-neutral-950 pl-10 text-sm font-medium text-white placeholder:text-white/30" />
          </div>

          <div className="flex flex-wrap gap-1.5">
            {FILTERS.map((f) => (
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
                  {counts[f.value] ?? 0}
                </span>
              </button>
            ))}
          </div>

          <div className="flex items-center gap-1.5 border-l border-white/10 pl-3">
            <span className="text-xs font-bold uppercase tracking-wide text-white/35">Sort</span>
            {([
              { id: "deadline" as const, label: "Deadline" },
              { id: "progress" as const, label: "Progress" },
              { id: "client" as const, label: "Client" },
            ]).map((o) => (
              <button key={o.id} type="button" onClick={() => setSort(o.id)}
                aria-pressed={sort === o.id}
                className={cn(
                  "rounded-lg px-3 py-2 text-xs font-bold transition-colors",
                  sort === o.id ? "bg-white/10 text-white" : "text-white/45 hover:text-white"
                )}>
                {o.label}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="divide-y divide-white/[0.07] border-t border-white/[0.07]">
            {[0, 1, 2].map((i) => (
              <div key={i} className="h-[5.5rem] animate-pulse bg-white/[0.02]" />
            ))}
          </div>
        ) : error ? (
          <p className="border-t border-white/[0.07] p-12 text-center text-sm font-bold text-brand-ember">
            {error}
          </p>
        ) : shown.length === 0 ? (
          <div className="border-t border-white/[0.07] p-14 text-center">
            <FolderKanban className="mx-auto size-8 text-white/20" />
            <p className="mt-4 text-base font-bold text-white">
              {search || filter !== "all" ? "No projects match" : "No projects yet"}
            </p>
            <p className="mt-2 text-sm font-medium text-white/50">
              {search || filter !== "all"
                ? "Try a different search or filter."
                : "Open a client and create their first project."}
            </p>
          </div>
        ) : (
          <ul className="divide-y divide-white/[0.07] border-t border-white/[0.07]">
            {shown.map((p) => {
              const client = clients[p.organisation_id];
              const due = dueChip(p.target_date, p.status === "completed");
              return (
                <li key={p.id}>
                  <Link href={`/internal/erp/team/clients/${p.organisation_id}?project=${p.id}`}
                    className="group grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-4 px-4 py-4 transition-colors hover:bg-white/[0.04] sm:gap-6">
                    <span className={cn(
                      "flex size-10 shrink-0 items-center justify-center rounded-lg text-xs font-bold",
                      p.status === "active"
                        ? "bg-brand-green/10 text-brand-green"
                        : "bg-white/[0.06] text-white/50"
                    )}>
                      {client ? initials(client.name) : "—"}
                    </span>

                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-mono text-xs font-bold text-brand-green">
                          {p.job_number}
                        </span>
                        <span className="truncate text-sm font-bold text-white transition-colors group-hover:text-brand-green">
                          {p.title}
                        </span>
                        <span className={cn(
                          "rounded-full border px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide",
                          PROJECT_STATUS_STYLE[p.status])}>
                          {PROJECT_STATUS_LABELS[p.status]}
                        </span>
                        {p.overdue_count > 0 && (
                          <span className="flex items-center gap-1 rounded-full border border-brand-ember/40 bg-brand-ember/10 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-brand-ember">
                            <Clock className="size-3" /> {p.overdue_count}
                          </span>
                        )}
                        {p.awaiting_client > 0 && (
                          <span className="rounded-full border border-brand-orange/40 bg-brand-orange/10 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-brand-orange">
                            {p.awaiting_client} with client
                          </span>
                        )}
                        {p.target_date && (
                          <span className={cn(
                            "flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[10px] font-bold",
                            DUE_TONE[due.tone])}>
                            <CalendarClock className="size-3" /> {due.label}
                          </span>
                        )}
                      </div>

                      <p className="mt-1.5 flex flex-wrap items-center gap-x-3 truncate text-xs font-medium text-white/45">
                        <span className="flex items-center gap-1.5">
                          <Building2 className="size-3" />
                          {client?.name ?? "Unknown client"}
                        </span>
                        <span>{p.done_count}/{p.task_count} tasks</span>
                        {p.standard && <span>{p.standard}</span>}
                        {p.start_date && <span>from {formatDate(p.start_date)}</span>}
                      </p>
                    </div>

                    <div className="flex items-center gap-4">
                      <div className="hidden w-36 items-center gap-2.5 sm:flex">
                        <div className="h-1 flex-1 rounded-full bg-white/[0.08]">
                          <div className={cn("h-full rounded-full transition-all duration-500",
                            p.status === "completed" ? "bg-white/40" : "bg-brand-green")}
                            style={{ width: `${p.progress}%` }} />
                        </div>
                        <span className="w-9 text-right text-xs font-bold tabular-nums text-white/60">
                          {p.progress}%
                        </span>
                      </div>
                      <ChevronRight className="size-4 text-white/25 transition-all group-hover:translate-x-0.5 group-hover:text-white/60" />
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}

function Mini({
  Icon, label, value, sub, tone,
}: {
  Icon: React.ComponentType<{ className?: string }>;
  label: string; value: number | string; sub: string;
  tone?: "danger" | "warn";
}) {
  const hot = tone && value !== 0 && value !== "0";
  const colour = hot
    ? tone === "danger" ? "text-brand-ember" : "text-brand-orange"
    : "text-white";

  return (
    <div className="bg-neutral-900 p-5">
      <span className={cn("flex size-10 items-center justify-center rounded-lg",
        hot ? tone === "danger" ? "bg-brand-ember/15" : "bg-brand-orange/15" : "bg-white/[0.06]")}>
        <Icon className={cn("size-4.5", hot ? colour : "text-brand-green")} />
      </span>
      <p className={cn("mt-5 font-display text-3xl font-700 leading-none tabular-nums", colour)}>
        {value}
      </p>
      <p className="mt-2.5 text-sm font-bold text-white">{label}</p>
      <p className="mt-0.5 text-xs font-medium text-white/40">{sub}</p>
    </div>
  );
}
