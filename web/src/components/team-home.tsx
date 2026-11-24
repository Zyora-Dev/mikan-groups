"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  AlertTriangle, Building2, CalendarClock, CheckCircle2, ClipboardList,
  Clock, FileText, FolderKanban, Inbox, MessageSquare, Paperclip,
  ThumbsUp, Users,
} from "lucide-react";
import {
  type Activity, type DashProject, type DashTask, type Dashboard,
  PRIORITY_LABELS, PROJECT_STATUS_LABELS, TASK_STATUS_LABELS,
  VERDICT_LABELS, api,
} from "@/lib/api";
import {
  daysUntil, formatDate, formatDateTime, PRIORITY_STYLE, progressTone,
  PROJECT_STATUS_STYLE, TASK_STATUS_STYLE, VERDICT_STYLE,
} from "@/lib/project-ui";
import { cn } from "@/lib/utils";

export function TeamHome() {
  const [data, setData] = useState<Dashboard | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.dashboard().then(setData).catch(() => {}).finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <p className="py-20 text-center text-sm font-bold uppercase tracking-wide text-white/45">
        Loading…
      </p>
    );
  }
  if (!data) {
    return (
      <p className="py-20 text-center text-sm font-bold text-white/70">
        Could not load the dashboard.
      </p>
    );
  }

  const isAdmin = data.role === "admin";
  const s = data.stats;

  return (
    <div className="space-y-10">
      <div>
        <h1 className="font-display text-3xl font-700 uppercase leading-none text-white">
          {isAdmin ? "Practice overview" : "My work"}
        </h1>
        <p className="mt-3 text-base font-medium text-white/65">
          {isAdmin
            ? "Everything across clients, projects and deadlines."
            : "Tasks assigned to you and the projects you lead."}
        </p>
      </div>

      {/* ---------- widgets ---------- */}
      <div className="grid gap-px bg-white/10 sm:grid-cols-2 lg:grid-cols-4">
        {isAdmin ? (
          <>
            <Stat Icon={Building2} label="Active clients"
              value={s.clients_active} sub={`${s.clients_total} total`}
              href="/internal/erp/team/clients" />
            <Stat Icon={FolderKanban} label="Active projects"
              value={s.projects_active} sub={`${s.projects_total} total`} />
            <Stat Icon={ClipboardList} label="Open tasks"
              value={s.tasks_open} sub={`${s.due_this_week} due this week`} />
            <Stat Icon={AlertTriangle} label="Overdue"
              value={s.tasks_overdue} sub="Past deadline"
              tone={s.tasks_overdue > 0 ? "danger" : undefined} />
          </>
        ) : (
          <>
            <Stat Icon={ClipboardList} label="My tasks"
              value={data.my_tasks.length} sub="Assigned to me" />
            <Stat Icon={CheckCircle2} label="To check"
              value={data.checking.length} sub="Waiting on my review"
              tone={data.checking.length > 0 ? "warn" : undefined} />
            <Stat Icon={AlertTriangle} label="Overdue"
              value={data.overdue.length} sub="In my projects"
              tone={data.overdue.length > 0 ? "danger" : undefined} />
            <Stat Icon={FolderKanban} label="Projects"
              value={data.projects.length} sub="I'm involved in" />
          </>
        )}
      </div>

      {isAdmin && (
        <div className="grid gap-px bg-white/10 sm:grid-cols-2 lg:grid-cols-4">
          <Stat Icon={ThumbsUp} label="Awaiting client"
            value={s.awaiting_client} sub="Submitted, not yet judged"
            tone={s.awaiting_client > 0 ? "warn" : undefined} />
          <Stat Icon={Inbox} label="Client requests"
            value={data.client_requests.length} sub="Raised, not accepted"
            tone={data.client_requests.length > 0 ? "warn" : undefined} />
          <Stat Icon={Users} label="Team" value={s.team_size} sub="Active staff"
            href="/internal/erp/team/members" />
          <Stat Icon={Users} label="Portal users" value={s.portal_users}
            sub="Across all clients" />
        </div>
      )}

      {/* ---------- lists ---------- */}
      <div className="grid gap-8 lg:grid-cols-2">
        {!isAdmin && (
          <TaskList title="Assigned to me" Icon={ClipboardList}
            tasks={data.my_tasks} empty="Nothing assigned to you yet." />
        )}
        {!isAdmin && data.checking.length > 0 && (
          <TaskList title="Waiting on my check" Icon={CheckCircle2}
            tasks={data.checking} empty="" />
        )}

        <TaskList title="Overdue" Icon={AlertTriangle} tasks={data.overdue}
          empty="Nothing is past its deadline." danger />

        {isAdmin && (
          <TaskList title="Awaiting client response" Icon={ThumbsUp}
            tasks={data.awaiting_client} empty="Nothing is sitting with a client." />
        )}

        {data.client_requests.length > 0 && (
          <TaskList title="Client requests" Icon={Inbox}
            tasks={data.client_requests}
            empty="" note="Raised by clients — accept to schedule." />
        )}
      </div>

      {/* ---------- projects ---------- */}
      <section className="border border-white/10">
        <h2 className="flex items-center gap-2.5 border-b border-white/10 p-5 text-xs font-bold uppercase tracking-wide text-white/70">
          <FolderKanban className="size-4" />
          {isAdmin ? "Projects" : "My projects"}
        </h2>
        {data.projects.length === 0 ? (
          <p className="p-8 text-center text-sm font-medium text-white/45">
            No projects yet.
          </p>
        ) : (
          <ul className="divide-y divide-white/10">
            {data.projects.map((p) => <ProjectRow key={p.id} p={p} />)}
          </ul>
        )}
      </section>

      {/* ---------- activity ---------- */}
      <section className="border border-white/10">
        <h2 className="flex items-center gap-2.5 border-b border-white/10 p-5 text-xs font-bold uppercase tracking-wide text-white/70">
          <MessageSquare className="size-4" /> Recent activity
        </h2>
        {data.activity.length === 0 ? (
          <p className="p-8 text-center text-sm font-medium text-white/45">
            Nothing yet.
          </p>
        ) : (
          <ul className="divide-y divide-white/10">
            {data.activity.map((a, i) => <ActivityItem key={`${a.task_id}-${i}`} a={a} />)}
          </ul>
        )}
      </section>
    </div>
  );
}

/* ----------------------------------------------------------- widgets */

function Stat({
  Icon, label, value, sub, tone, href,
}: {
  Icon: React.ComponentType<{ className?: string }>;
  label: string; value: number; sub?: string;
  tone?: "danger" | "warn"; href?: string;
}) {
  const colour =
    tone === "danger" ? "text-brand-ember"
    : tone === "warn" ? "text-brand-orange"
    : "text-brand-green";

  const body = (
    <>
      <Icon className={cn("size-5", colour)} />
      <p className={cn("mt-5 font-display text-4xl font-700 tabular-nums", colour)}>
        {value}
      </p>
      <p className="mt-2 text-sm font-bold text-white">{label}</p>
      {sub && <p className="mt-1 text-xs font-medium text-white/55">{sub}</p>}
    </>
  );

  return href ? (
    <Link href={href} className="bg-neutral-900 p-6 transition-colors hover:bg-neutral-800">
      {body}
    </Link>
  ) : (
    <div className="bg-neutral-900 p-6">{body}</div>
  );
}

function TaskList({
  title, Icon, tasks, empty, danger, note,
}: {
  title: string;
  Icon: React.ComponentType<{ className?: string }>;
  tasks: DashTask[]; empty: string; danger?: boolean; note?: string;
}) {
  return (
    <section className="border border-white/10">
      <div className="flex items-center justify-between border-b border-white/10 p-5">
        <h2 className={cn(
          "flex items-center gap-2.5 text-xs font-bold uppercase tracking-wide",
          danger && tasks.length > 0 ? "text-brand-ember" : "text-white/70"
        )}>
          <Icon className="size-4" /> {title}
        </h2>
        <span className="font-display text-sm font-700 tabular-nums text-white/70">
          {tasks.length}
        </span>
      </div>

      {note && (
        <p className="border-b border-white/10 px-5 py-2.5 text-xs font-medium text-white/50">
          {note}
        </p>
      )}

      {tasks.length === 0 ? (
        <p className="p-8 text-center text-sm font-medium text-white/45">{empty}</p>
      ) : (
        <ul className="divide-y divide-white/10">
          {tasks.map((t) => {
            const days = daysUntil(t.due_date);
            const late = days !== null && days < 0;
            return (
              <li key={t.id}>
                <Link href={`/internal/erp/team/clients/${t.client_id}`}
                  className="block p-4 transition-colors hover:bg-white/[0.04]">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={cn("border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide",
                      TASK_STATUS_STYLE[t.status])}>
                      {TASK_STATUS_LABELS[t.status]}
                    </span>
                    {t.verdict !== "none" && (
                      <span className={cn("border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide",
                        VERDICT_STYLE[t.verdict])}>
                        {VERDICT_LABELS[t.verdict]}
                      </span>
                    )}
                    <span className={cn("ml-auto text-[11px] font-bold uppercase", PRIORITY_STYLE[t.priority])}>
                      {PRIORITY_LABELS[t.priority]}
                    </span>
                  </div>

                  <p className="mt-2 text-sm font-bold text-white">{t.title}</p>
                  <p className="mt-1 text-xs font-medium text-white/55">
                    <span className="font-mono text-brand-green">{t.job_number}</span>
                    {" · "}{t.client_name}
                  </p>

                  <div className="mt-3 flex items-center gap-3">
                    <div className="h-1.5 flex-1 bg-white/10">
                      <div className={cn("h-full", progressTone(t.status))}
                        style={{ width: `${t.progress}%` }} />
                    </div>
                    <span className="w-10 text-right text-xs font-bold tabular-nums text-white/70">
                      {t.progress}%
                    </span>
                    {t.due_date && (
                      <span className={cn(
                        "flex items-center gap-1.5 text-xs font-bold",
                        late ? "text-brand-ember" : "text-white/55"
                      )}>
                        <CalendarClock className="size-3" />
                        {late ? `${Math.abs(days!)}d late` : formatDate(t.due_date)}
                      </span>
                    )}
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}

function ProjectRow({ p }: { p: DashProject }) {
  return (
    <li>
      <Link href={`/internal/erp/team/clients/${p.client_id}`}
        className="flex flex-wrap items-center gap-5 p-4 transition-colors hover:bg-white/[0.04]">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2.5">
            <span className="font-mono text-xs font-bold text-brand-green">
              {p.job_number}
            </span>
            <span className="text-sm font-bold text-white">{p.title}</span>
            <span className={cn("border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide",
              PROJECT_STATUS_STYLE[p.status])}>
              {PROJECT_STATUS_LABELS[p.status]}
            </span>
            {p.overdue_count > 0 && (
              <span className="flex items-center gap-1 border border-brand-ember/40 bg-brand-ember/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-brand-ember">
                <Clock className="size-3" /> {p.overdue_count}
              </span>
            )}
          </div>
          <p className="mt-1.5 text-xs font-medium text-white/55">
            {p.client_name} · {p.done_count}/{p.task_count} tasks
            {p.target_date && ` · due ${formatDate(p.target_date)}`}
          </p>
        </div>
        <div className="w-32">
          <div className="h-1.5 w-full bg-white/10">
            <div className="h-full bg-brand-green" style={{ width: `${p.progress}%` }} />
          </div>
          <p className="mt-1.5 text-right text-xs font-bold tabular-nums text-white/70">
            {p.progress}%
          </p>
        </div>
      </Link>
    </li>
  );
}

function ActivityItem({ a }: { a: Activity }) {
  const Icon = a.kind === "attachment" ? Paperclip
    : a.kind === "verdict" ? ThumbsUp : MessageSquare;
  const tint = a.kind === "verdict" ? "text-brand-ember"
    : a.from_client ? "text-brand-cyan" : "text-brand-green";

  return (
    <li className="flex gap-4 p-4">
      <Icon className={cn("mt-0.5 size-4 shrink-0", tint)} />
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm font-bold text-white">{a.actor}</span>
          <span className={cn("border px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide",
            a.from_client ? "border-brand-cyan/40 text-brand-cyan" : "border-brand-green/40 text-brand-green")}>
            {a.from_client ? "Client" : "Mikan"}
          </span>
          <span className="ml-auto text-xs font-medium text-white/45">
            {formatDateTime(a.at)}
          </span>
        </div>
        <p className="mt-1.5 text-sm font-medium text-white/80">{a.summary}</p>
        <p className="mt-1 flex items-center gap-1.5 text-xs font-medium text-white/45">
          <FileText className="size-3" /> {a.task_title} · {a.client_name}
        </p>
      </div>
    </li>
  );
}
