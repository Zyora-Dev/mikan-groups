"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  AlertTriangle, ArrowUpRight, CheckCircle2, ClipboardList, Clock,
  FileText, FolderKanban, Inbox, Loader2, MessageSquare, Paperclip,
  RefreshCw, ThumbsUp,
} from "lucide-react";
import { DeadlineBars, StatusDonut, ThroughputChart } from "@/components/dash-charts";
import { TaskSheet } from "@/components/task-sheet";
import {
  type Activity, type DashProject, type DashTask, type PortalDashboard,
  type PortalFile, type Task, api,
} from "@/lib/api";
import {
  DUE_TONE, PROJECT_STATUS_STYLE, TASK_STATUS_STYLE, dueChip, fileSize,
  greeting, relativeTime, revLabel, today,
} from "@/lib/project-ui";
import { cn } from "@/lib/utils";

export function PortalHome() {
  const [data, setData] = useState<PortalDashboard | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState<Task | null>(null);
  const [opening, setOpening] = useState<string | null>(null);

  /** Dashboard rows are a flattened summary — fetch the full task to open it. */
  async function openTask(row: DashTask) {
    setOpening(row.id);
    try {
      const tasks = await api.tasks.list(row.project_id);
      const full = tasks.find((t) => t.id === row.id);
      if (full) setOpen(full);
    } catch {
      setError("Could not open that item. Please refresh.");
    } finally {
      setOpening(null);
    }
  }

  function load() {
    api.portal.dashboard()
      .then(setData)
      .catch(() => setError("Could not load your dashboard. Please refresh."));
  }

  useEffect(load, []);

  if (error) {
    return (
      <p className="border-l-2 border-brand-ember bg-brand-ember/5 px-5 py-4 text-sm font-semibold text-brand-ember">
        {error}
      </p>
    );
  }

  if (!data) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Loader2 className="size-6 animate-spin text-brand-green" />
      </div>
    );
  }

  const s = data.stats;
  const firstName = data.user_name.split(" ")[0];

  return (
    <div className="space-y-5">
      {/* ---------- greeting ---------- */}
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-brand-green">
            {today()}
          </p>
          <h1 className="mt-2 font-display text-2xl font-700 uppercase leading-none text-white">
            {greeting()}, {firstName}
          </h1>
          <p className="mt-2 text-sm font-medium text-white/55">
            {data.organisation}
          </p>
        </div>

        <Link href="/portal/projects"
          className="inline-flex items-center gap-2 border border-white/15 bg-white/[0.04] px-4 py-2.5 text-sm font-bold text-white transition-colors hover:border-brand-green/50 hover:bg-brand-green/10">
          <FolderKanban className="size-4 text-brand-green" />
          Your projects
        </Link>
      </header>

      {/* ---------- what needs you ---------- */}
      {(s.awaiting_you > 0 || s.changes_requested > 0) && (
        <section className="border border-brand-orange/30 bg-brand-orange/[0.07] p-5">
          <div className="flex items-start gap-3.5">
            <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-brand-orange/15">
              <ThumbsUp className="size-4.5 text-brand-orange" />
            </span>
            <div className="min-w-0">
              <p className="font-display text-base font-700 uppercase text-white">
                {s.awaiting_you > 0
                  ? `${s.awaiting_you} ${s.awaiting_you === 1 ? "item needs" : "items need"} your decision`
                  : "Changes are with the team"}
              </p>
              <p className="mt-1.5 text-sm font-medium leading-relaxed text-white/65">
                {s.awaiting_you > 0
                  ? "The team has submitted work for your review. Open an item to approve it or tell them what to change."
                  : `You've asked for changes on ${s.changes_requested} ${s.changes_requested === 1 ? "item" : "items"}. The team is working through them.`}
              </p>
            </div>
          </div>
        </section>
      )}

      {/* ---------- KPIs ---------- */}
      <div className="grid gap-px overflow-hidden rounded-xl border border-white/10 bg-white/[0.07] sm:grid-cols-2 lg:grid-cols-4">
        <Kpi Icon={ThumbsUp} label="Awaiting your review" value={s.awaiting_you}
          sub="Submitted for approval" tone="warn" />
        <Kpi Icon={Clock} label="In progress" value={s.tasks_open}
          sub="Open with the team" />
        <Kpi Icon={AlertTriangle} label="Overdue" value={s.overdue}
          sub="Past the agreed date" tone="danger" />
        <Kpi Icon={CheckCircle2} label="Completed" value={s.tasks_done}
          sub="Signed off" />
      </div>

      <div className="grid gap-px overflow-hidden rounded-xl border border-white/10 bg-white/[0.07] sm:grid-cols-2 lg:grid-cols-4">
        <Kpi Icon={FolderKanban} label="Active projects" value={s.projects_active}
          sub={`${s.projects_total} in total`} href="/portal/projects" />
        <Kpi Icon={RefreshCw} label="Changes requested" value={s.changes_requested}
          sub="Back with the team" tone="warn" />
        <Kpi Icon={Inbox} label="Your requests" value={s.requests_pending}
          sub="Not yet accepted" tone="warn" />
        <Kpi Icon={Paperclip} label="Files shared" value={s.files_shared}
          sub="Issued to you" href="/portal/files" />
      </div>

      {/* ---------- charts ---------- */}
      <div className="grid gap-5 lg:grid-cols-3">
        <Card title="Throughput" sub="Raised vs completed, last 8 weeks"
          className="lg:col-span-2">
          <ThroughputChart data={data.trend} hasHistory={data.has_history} />
        </Card>
        <Card title="Where work sits" sub="Across your open items">
          <StatusDonut data={data.status_mix} />
        </Card>
      </div>

      <div className="grid gap-5 lg:grid-cols-3">
        {/* ---------- awaiting you ---------- */}
        <Card title="Needs your decision"
          sub="Submitted work waiting on you"
          className="lg:col-span-2"
          count={data.awaiting_you.length}>
          <TaskList rows={data.awaiting_you} onOpen={openTask} opening={opening}
            empty="Nothing is waiting on you right now." />
        </Card>

        <Card title="Deadlines" sub="Open items by due date">
          <DeadlineBars data={data.deadlines} />
        </Card>
      </div>

      <div className="grid items-start gap-5 lg:grid-cols-3">
        <Card title="With the team" sub="Being drawn, checked or revised"
          className="lg:col-span-2" count={data.in_progress.length}>
          <TaskList rows={data.in_progress} onOpen={openTask} opening={opening}
            empty="No work is open at the moment." />
        </Card>

        <Card title="Recent activity" sub="Comments and files">
          <ActivityList rows={data.activity} />
        </Card>
      </div>

      <div className="grid items-start gap-5 lg:grid-cols-3">
        <Card title="Your projects" sub="Progress against each job"
          className="lg:col-span-2" count={data.projects.length}
          action={{ href: "/portal/projects", label: "All projects" }}>
          <ProjectList rows={data.projects} />
        </Card>

        <Card title="Latest files" sub="Newest first"
          action={{ href: "/portal/files", label: "All files" }}>
          <FileList rows={data.recent_files.slice(0, 6)} />
        </Card>
      </div>

      {/* ---------- your requests ---------- */}
      {data.my_requests.length > 0 && (
        <Card title="Your requests" sub="Raised by your team, not yet accepted"
          count={data.my_requests.length}>
          <TaskList rows={data.my_requests} onOpen={openTask} opening={opening}
            empty="You haven't raised anything." />
        </Card>
      )}

      <TaskSheet task={open} open={!!open}
        onOpenChange={(v) => !v && setOpen(null)}
        isClient onChanged={load} />
    </div>
  );
}

/* ------------------------------------------------------------------ bits */

function Kpi({
  Icon, label, value, sub, tone = "normal", href,
}: {
  Icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: number;
  sub?: string;
  tone?: "normal" | "warn" | "danger";
  href?: string;
}) {
  // A zero in a danger tone shouldn't read as an alarm — it's good news.
  const hot = value > 0 && tone !== "normal";
  const colour = hot
    ? tone === "danger" ? "text-brand-ember" : "text-brand-orange"
    : "text-white";

  const body = (
    <>
      <div className="flex items-center gap-3">
        <span className={cn(
          "flex size-8 shrink-0 items-center justify-center rounded-lg",
          hot
            ? tone === "danger" ? "bg-brand-ember/15" : "bg-brand-orange/15"
            : "bg-brand-green/15"
        )}>
          <Icon className={cn("size-4", hot ? colour : "text-brand-green")} />
        </span>
        <p className={cn("font-display text-3xl font-700 leading-none tabular-nums", colour)}>
          {value}
        </p>
        {href && (
          <ArrowUpRight className="ml-auto size-3.5 text-white/25 transition-colors group-hover:text-brand-green" />
        )}
      </div>
      <p className="mt-3 text-sm font-bold leading-tight text-white">{label}</p>
      {sub && <p className="mt-0.5 text-xs font-medium text-white/45">{sub}</p>}
    </>
  );

  const shell = "group bg-neutral-900 p-4 transition-colors";
  return href
    ? <Link href={href} className={cn(shell, "hover:bg-neutral-800")}>{body}</Link>
    : <div className={shell}>{body}</div>;
}

function Card({
  title, sub, children, className, count, action,
}: {
  title: string;
  sub?: string;
  children: React.ReactNode;
  className?: string;
  count?: number;
  action?: { href: string; label: string };
}) {
  return (
    <section className={cn(
      "flex flex-col overflow-hidden rounded-xl border border-white/10 bg-neutral-900",
      className
    )}>
      <header className="flex items-start justify-between gap-4 border-b border-white/[0.07] px-5 py-3.5">
        <div className="min-w-0">
          <h2 className="flex items-center gap-2.5 font-display text-base font-700 uppercase tracking-wide text-white">
            {title}
            {count !== undefined && count > 0 && (
              <span className="rounded-full bg-white/10 px-2 py-0.5 text-[11px] font-bold tabular-nums text-white/70">
                {count}
              </span>
            )}
          </h2>
          {sub && <p className="mt-1 text-xs font-medium text-white/45">{sub}</p>}
        </div>
        {action && (
          <Link href={action.href}
            className="shrink-0 text-xs font-bold text-brand-green hover:underline">
            {action.label}
          </Link>
        )}
      </header>
      <div className="min-h-0 flex-1">{children}</div>
    </section>
  );
}

function Empty({ text }: { text: string }) {
  return (
    <p className="px-5 py-8 text-center text-sm font-medium text-white/40">{text}</p>
  );
}

function TaskList({
  rows, onOpen, opening, empty,
}: {
  rows: DashTask[];
  onOpen: (t: DashTask) => void;
  opening: string | null;
  empty: string;
}) {
  if (rows.length === 0) return <Empty text={empty} />;

  return (
    <ul className="divide-y divide-white/[0.06]">
      {rows.map((t) => {
        const due = dueChip(t.due_date, t.status === "done");
        return (
          <li key={t.id}>
            <button type="button" onClick={() => onOpen(t)}
              disabled={opening !== null}
              className="flex w-full items-center gap-3.5 px-5 py-3 text-left transition-colors hover:bg-white/[0.03] disabled:opacity-60">
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-bold text-white">{t.title}</p>
                <p className="mt-0.5 truncate text-xs font-medium text-white/45">
                  {t.job_number} · {t.project_title}
                </p>
              </div>

              <div className="flex shrink-0 items-center gap-2">
                {opening === t.id && (
                  <Loader2 className="size-3.5 animate-spin text-brand-green" />
                )}
                {due && (
                  <span className={cn(
                    "rounded-full px-2.5 py-1 text-[11px] font-bold",
                    DUE_TONE[due.tone]
                  )}>
                    {due.label}
                  </span>
                )}
                <span className={cn(
                  "hidden rounded-full px-2.5 py-1 text-[11px] font-bold sm:inline",
                  TASK_STATUS_STYLE[t.status]
                )}>
                  {t.status === "submitted" ? "For your review" : t.status.replace("_", " ")}
                </span>
              </div>
            </button>
          </li>
        );
      })}
    </ul>
  );
}

function ProjectList({ rows }: { rows: DashProject[] }) {
  if (rows.length === 0) {
    return <Empty text="No projects have been set up yet." />;
  }

  return (
    <ul className="divide-y divide-white/[0.06]">
      {rows.map((p) => {
        const due = dueChip(p.target_date, p.status === "completed");
        return (
          <li key={p.id}>
            <Link href={`/portal/projects/${p.id}`}
              className="group block px-5 py-3.5 transition-colors hover:bg-white/[0.03]">
              <div className="flex items-center gap-3">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-bold text-white">{p.title}</p>
                  <p className="mt-0.5 text-xs font-medium text-white/45">
                    {p.job_number} · {p.done_count}/{p.task_count} complete
                  </p>
                </div>
                {due && (
                  <span className={cn(
                    "shrink-0 rounded-full px-2.5 py-1 text-[11px] font-bold",
                    DUE_TONE[due.tone]
                  )}>
                    {due.label}
                  </span>
                )}
                <span className={cn(
                  "hidden shrink-0 rounded-full px-2.5 py-1 text-[11px] font-bold sm:inline",
                  PROJECT_STATUS_STYLE[p.status]
                )}>
                  {p.status.replace("_", " ")}
                </span>
              </div>

              <div className="mt-2.5 flex items-center gap-3">
                <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/10">
                  <div className="h-full rounded-full bg-brand-green transition-all"
                    style={{ width: `${p.progress}%` }} />
                </div>
                <span className="w-9 shrink-0 text-right text-xs font-bold tabular-nums text-white/70">
                  {p.progress}%
                </span>
              </div>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

function FileList({ rows }: { rows: PortalFile[] }) {
  if (rows.length === 0) return <Empty text="No files yet." />;

  return (
    <ul className="divide-y divide-white/[0.06]">
      {rows.map((f) => (
        <li key={f.id} className="flex items-center gap-3 px-5 py-3">
          <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-white/[0.06]">
            <FileText className="size-4 text-white/50" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-bold text-white">{f.label}</p>
            <p className="mt-0.5 truncate text-xs font-medium text-white/45">
              {f.job_number}
              {f.revision && ` · ${revLabel(f.revision)}`}
              {f.size_bytes && ` · ${fileSize(f.size_bytes)}`}
            </p>
          </div>
          {f.has_file ? (
            <a href={api.tasks.attachments.downloadUrl(f.id)}
              className="shrink-0 text-xs font-bold text-brand-green hover:underline">
              Download
            </a>
          ) : f.url ? (
            <a href={f.url} target="_blank" rel="noreferrer noopener"
              className="shrink-0 text-xs font-bold text-brand-green hover:underline">
              Open
            </a>
          ) : null}
        </li>
      ))}
    </ul>
  );
}

function ActivityList({ rows }: { rows: Activity[] }) {
  if (rows.length === 0) return <Empty text="Nothing has happened yet." />;

  return (
    <ul className="divide-y divide-white/[0.06]">
      {rows.map((a, i) => {
        const Icon = a.kind === "attachment" ? Paperclip
          : a.kind === "verdict" ? ClipboardList : MessageSquare;
        return (
          <li key={`${a.task_id}-${i}`} className="flex gap-3 px-5 py-3">
            <span className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-lg bg-white/[0.06]">
              <Icon className={cn(
                "size-3.5",
                a.from_client ? "text-brand-cyan" : "text-brand-green"
              )} />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-bold text-white">
                {a.from_client ? a.actor : `${a.actor} · Mikan`}
              </p>
              <p className="mt-0.5 line-clamp-2 text-xs font-medium leading-relaxed text-white/55">
                {a.summary}
              </p>
              <p className="mt-1 text-[11px] font-medium text-white/35">
                {a.task_title} · {relativeTime(a.at)}
              </p>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
