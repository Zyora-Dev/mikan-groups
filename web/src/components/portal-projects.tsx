"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle, FolderKanban, Loader2, Search, ThumbsUp,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  PROJECT_STATUS_LABELS, type Project, type ProjectStatus, api,
} from "@/lib/api";
import { DUE_TONE, PROJECT_STATUS_STYLE, dueChip, formatDate } from "@/lib/project-ui";
import { cn } from "@/lib/utils";

const FILTERS: { value: "all" | ProjectStatus; label: string }[] = [
  { value: "all", label: "All" },
  { value: "active", label: "Active" },
  { value: "planning", label: "Planning" },
  { value: "on_hold", label: "On hold" },
  { value: "completed", label: "Completed" },
];

export function PortalProjects() {
  const [rows, setRows] = useState<Project[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<"all" | ProjectStatus>("all");
  const [search, setSearch] = useState("");

  useEffect(() => {
    // The API scopes to the caller's organisation — no client id to pass.
    api.projects.list()
      .then(setRows)
      .catch(() => setError("Could not load your projects. Please refresh."));
  }, []);

  const shown = useMemo(() => {
    if (!rows) return [];
    const q = search.trim().toLowerCase();
    return rows.filter((p) => {
      if (filter !== "all" && p.status !== filter) return false;
      if (!q) return true;
      return (
        p.title.toLowerCase().includes(q) ||
        p.job_number.toLowerCase().includes(q) ||
        (p.discipline ?? "").toLowerCase().includes(q)
      );
    });
  }, [rows, filter, search]);

  if (error) {
    return (
      <p className="border-l-2 border-brand-ember bg-brand-ember/5 px-5 py-4 text-sm font-semibold text-brand-ember">
        {error}
      </p>
    );
  }

  if (!rows) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Loader2 className="size-6 animate-spin text-brand-green" />
      </div>
    );
  }

  const counts = {
    all: rows.length,
    active: rows.filter((p) => p.status === "active").length,
    planning: rows.filter((p) => p.status === "planning").length,
    on_hold: rows.filter((p) => p.status === "on_hold").length,
    completed: rows.filter((p) => p.status === "completed").length,
  } as Record<string, number>;

  return (
    <div className="space-y-5">
      <header>
        <h1 className="font-display text-2xl font-700 uppercase leading-none text-white">
          Your projects
        </h1>
        <p className="mt-2 text-sm font-medium text-white/55">
          Every job Mikan is running for you, with live progress.
        </p>
      </header>

      {/* filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex flex-wrap gap-1.5">
          {FILTERS.map((f) => (
            <button key={f.value} type="button" onClick={() => setFilter(f.value)}
              className={cn(
                "rounded-full px-3.5 py-1.5 text-xs font-bold transition-colors",
                filter === f.value
                  ? "bg-brand-green text-white"
                  : "bg-white/[0.06] text-white/60 hover:bg-white/10 hover:text-white"
              )}>
              {f.label}
              <span className="ml-1.5 tabular-nums opacity-60">{counts[f.value] ?? 0}</span>
            </button>
          ))}
        </div>

        <div className="relative ml-auto w-full sm:w-64">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-white/35" />
          <Input value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder="Search projects"
            className="h-10 rounded-lg border-white/10 bg-white/[0.04] pl-10 text-sm font-medium text-white placeholder:text-white/35" />
        </div>
      </div>

      {shown.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-xl border border-white/10 bg-neutral-900 px-6 py-16 text-center">
          <FolderKanban className="size-7 text-white/20" />
          <p className="text-sm font-bold text-white/70">
            {rows.length === 0 ? "No projects yet" : "Nothing matches that"}
          </p>
          <p className="max-w-sm text-xs font-medium leading-relaxed text-white/45">
            {rows.length === 0
              ? "Once Mikan sets up your first job it will appear here."
              : "Try a different filter or search term."}
          </p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {shown.map((p) => <ProjectCard key={p.id} p={p} />)}
        </div>
      )}
    </div>
  );
}

function ProjectCard({ p }: { p: Project }) {
  const due = dueChip(p.target_date, p.status === "completed");

  return (
    <Link href={`/portal/projects/${p.id}`}
      className="group flex flex-col overflow-hidden rounded-xl border border-white/10 bg-neutral-900 transition-colors hover:border-brand-green/40">
      <div className="flex items-start justify-between gap-3 border-b border-white/[0.07] px-5 py-4">
        <div className="min-w-0">
          <p className="text-[11px] font-bold uppercase tracking-wide text-brand-green">
            {p.job_number}
          </p>
          <h2 className="mt-1.5 line-clamp-2 text-base font-bold leading-tight text-white">
            {p.title}
          </h2>
        </div>
        <span className={cn(
          "shrink-0 rounded-full px-2.5 py-1 text-[11px] font-bold",
          PROJECT_STATUS_STYLE[p.status]
        )}>
          {PROJECT_STATUS_LABELS[p.status]}
        </span>
      </div>

      <div className="flex-1 px-5 py-4">
        <div className="flex items-center gap-3">
          <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/10">
            <div className="h-full rounded-full bg-brand-green transition-all"
              style={{ width: `${p.progress}%` }} />
          </div>
          <span className="w-9 shrink-0 text-right text-xs font-bold tabular-nums text-white/70">
            {p.progress}%
          </span>
        </div>

        <p className="mt-2.5 text-xs font-medium text-white/45">
          {p.done_count} of {p.task_count} items complete
        </p>

        {(p.awaiting_client > 0 || p.overdue_count > 0) && (
          <div className="mt-3.5 flex flex-wrap gap-2">
            {p.awaiting_client > 0 && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-orange/15 px-2.5 py-1 text-[11px] font-bold text-brand-orange">
                <ThumbsUp className="size-3" />
                {p.awaiting_client} awaiting you
              </span>
            )}
            {p.overdue_count > 0 && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-ember/15 px-2.5 py-1 text-[11px] font-bold text-brand-ember">
                <AlertTriangle className="size-3" />
                {p.overdue_count} overdue
              </span>
            )}
          </div>
        )}
      </div>

      <div className="flex items-center justify-between gap-3 border-t border-white/[0.07] px-5 py-3">
        <span className="truncate text-xs font-medium text-white/45">
          {p.discipline ?? "Detailing"}
          {p.standard && ` · ${p.standard}`}
        </span>
        {due ? (
          <span className={cn(
            "shrink-0 rounded-full px-2.5 py-1 text-[11px] font-bold",
            DUE_TONE[due.tone]
          )}>
            {due.label}
          </span>
        ) : (
          <span className="shrink-0 text-xs font-medium text-white/35">
            {formatDate(p.target_date)}
          </span>
        )}
      </div>
    </Link>
  );
}
