"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  AlertTriangle, ArrowUpRight, Building2, CalendarClock, CheckCircle2,
  ClipboardList, Clock, FolderKanban, Inbox, MessageSquare, Paperclip,
  ThumbsUp, Users,
} from "lucide-react";
import {
  type Activity, type DashProject, type DashTask, type Dashboard,
  PRIORITY_LABELS, PROJECT_STATUS_LABELS, type Session, TASK_STATUS_LABELS,
  VERDICT_LABELS, api,
} from "@/lib/api";
import {
  daysUntil, formatDate, greeting, initials, PRIORITY_STYLE, progressTone,
  PROJECT_STATUS_STYLE, relativeTime, TASK_STATUS_STYLE, today, VERDICT_STYLE,
} from "@/lib/project-ui";
import { cn } from "@/lib/utils";

export function TeamHome() {
  const [data, setData] = useState<Dashboard | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([api.dashboard(), api.me()])
      .then(([d, s]) => { setData(d); setSession(s); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="space-y-6 py-4">
        <div className="h-8 w-64 animate-pulse bg-white/[0.06]" />
        <div className="grid gap-px bg-white/5 sm:grid-cols-2 lg:grid-cols-4">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="h-36 animate-pulse bg-neutral-900" />
          ))}
        </div>
      </div>
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
  const firstName = session?.user.full_name.split(" ")[0] ?? "";

  const needsAttention =
    data.overdue.length + data.client_requests.length +
    (isAdmin ? 0 : data.checking.length);

  return (
    <div className="space-y-10">
      {/* ---------- greeting ---------- */}
      <header className="flex flex-wrap items-end justify-between gap-5 border-b border-white/10 pb-7">
        <div>
          <p className="text-sm font-bold uppercase tracking-[0.14em] text-brand-green">
            {today()}
          </p>
          <h1 className="mt-3 font-display text-4xl font-700 uppercase leading-none text-white">
            {greeting()}{firstName && `, ${firstName}`}
          </h1>
          <p className="mt-3 text-base font-medium text-white/60">
            {needsAttention === 0
              ? isAdmin
                ? "Nothing needs your attention right now."
                : "You're all caught up."
              : `${needsAttention} item${needsAttention === 1 ? "" : "s"} need${needsAttention === 1 ? "s" : ""} attention.`}
          </p>
        </div>

        {needsAttention > 0 && (
          <div className="flex items-center gap-3 border border-brand-ember/30 bg-brand-ember/[0.07] px-5 py-3">
            <AlertTriangle className="size-5 shrink-0 text-brand-ember" />
            <div>
              <p className="font-display text-2xl font-700 leading-none tabular-nums text-brand-ember">
                {needsAttention}
              </p>
              <p className="mt-1 text-[11px] font-bold uppercase tracking-wide text-white/60">
                Needs action
              </p>
            </div>
          </div>
        )}
      </header>

      {/* ---------- widgets ---------- */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {isAdmin ? (
          <>
            <Stat Icon={Building2} label="Active clients" value={s.clients_active}
              sub={`${s.clients_total} on the books`} href="/internal/erp/team/clients" />
            <Stat Icon={FolderKanban} label="Live projects" value={s.projects_active}
              sub={`${s.projects_total} total`} />
            <Stat Icon={ClipboardList} label="Open tasks" value={s.tasks_open}
              sub={s.due_this_week ? `${s.due_this_week} due this week` : "None due this week"} />
            <Stat Icon={AlertTriangle} label="Overdue" value={s.tasks_overdue}
              sub="Past deadline" tone={s.tasks_overdue > 0 ? "danger" : "calm"} />
            <Stat Icon={ThumbsUp} label="With the client" value={s.awaiting_client}
              sub="Submitted, not yet judged" tone={s.awaiting_client > 0 ? "warn" : "calm"} />
            <Stat Icon={Inbox} label="New requests" value={data.client_requests.length}
              sub="Raised, not accepted" tone={data.client_requests.length > 0 ? "warn" : "calm"} />
            <Stat Icon={Users} label="Team" value={s.team_size} sub="Active staff"
              href="/internal/erp/team/members" />
            <Stat Icon={Users} label="Portal users" value={s.portal_users}
              sub="Across all clients" />
          </>
        ) : (
          <>
            <Stat Icon={ClipboardList} label="My tasks" value={data.my_tasks.length}
              sub="Assigned to me" />
            <Stat Icon={CheckCircle2} label="To check" value={data.checking.length}
              sub="Waiting on my review" tone={data.checking.length > 0 ? "warn" : "calm"} />
            <Stat Icon={AlertTriangle} label="Overdue" value={data.overdue.length}
              sub="In my projects" tone={data.overdue.length > 0 ? "danger" : "calm"} />
            <Stat Icon={FolderKanban} label="Projects" value={data.projects.length}
              sub="I'm involved in" />
          </>
        )}
      </div>

      {/* ---------- lists ---------- */}
      <div className="grid gap-6 xl:grid-cols-2">
        {!isAdmin && (
          <TaskList title="Assigned to me" Icon={ClipboardList} tasks={data.my_tasks}
            empty="Nothing assigned to you yet." />
        )}
        {!isAdmin && data.checking.length > 0 && (
          <TaskList title="Waiting on my check" Icon={CheckCircle2}
            tasks={data.checking} empty="" tone="warn" />
        )}
        <TaskList title="Overdue" Icon={AlertTriangle} tasks={data.overdue}
          empty="Nothing is past its deadline." tone="danger" />
        {isAdmin && (
          <TaskList title="With the client" Icon={ThumbsUp} tasks={data.awaiting_client}
            empty="Nothing is sitting with a client." tone="warn" />
        )}
        {data.client_requests.length > 0 && (
          <TaskList title="New client requests" Icon={Inbox} tasks={data.client_requests}
            empty="" tone="warn" note="Accept these to schedule them." />
        )}
      </div>

      {/* ---------- projects + activity ---------- */}
      <div className="grid gap-6 xl:grid-cols-[1.35fr_1fr]">
        <Panel title={isAdmin ? "Projects" : "My projects"} Icon={FolderKanban}
          count={data.projects.length}>
          {data.projects.length === 0 ? (
            <Empty text="No projects yet." />
          ) : (
            <ul className="divide-y divide-white/[0.07]">
              {data.projects.map((p) => <ProjectRow key={p.id} p={p} />)}
            </ul>
          )}
        </Panel>

        <Panel title="Recent activity" Icon={MessageSquare} count={data.activity.length}>
          {data.activity.length === 0 ? (
            <Empty text="Nothing yet." />
          ) : (
            <ul className="divide-y divide-white/[0.07]">
              {data.activity.map((a, i) => (
                <ActivityItem key={`${a.task_id}-${i}`} a={a} />
              ))}
            </ul>
          )}
        </Panel>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------- pieces */

const TONE = {
  danger: { text: "text-brand-ember", rule: "bg-brand-ember", glow: "bg-brand-ember/[0.07]" },
  warn: { text: "text-brand-orange", rule: "bg-brand-orange", glow: "bg-brand-orange/[0.07]" },
  calm: { text: "text-white/35", rule: "bg-white/15", glow: "" },
  good: { text: "text-brand-green", rule: "bg-brand-green", glow: "" },
} as const;

function Stat({
  Icon, label, value, sub, tone = "good", href,
}: {
  Icon: React.ComponentType<{ className?: string }>;
  label: string; value: number; sub?: string;
  tone?: keyof typeof TONE; href?: string;
}) {
  // A zero overdue count is good news, not an alarm.
  const t = TONE[value === 0 && (tone === "danger" || tone === "warn") ? "calm" : tone];

  const body = (
    <>
      <span className={cn("absolute inset-x-0 top-0 h-0.5", t.rule)} />
      {t.glow && <span className={cn("absolute inset-0", t.glow)} />}

      <div className="relative flex items-start justify-between">
        <Icon className={cn("size-5", t.text)} />
        {href && (
          <ArrowUpRight className="size-4 text-white/20 transition-colors group-hover:text-white/70" />
        )}
      </div>

      <p className={cn("relative mt-6 font-display text-5xl font-700 leading-none tabular-nums", t.text)}>
        {value}
      </p>
      <p className="relative mt-3 text-sm font-bold text-white">{label}</p>
      {sub && <p className="relative mt-1 text-xs font-medium text-white/45">{sub}</p>}
    </>
  );

  const shell =
    "group relative overflow-hidden border border-white/10 bg-neutral-900 p-6 transition-colors";

  return href ? (
    <Link href={href} className={cn(shell, "hover:border-white/25 hover:bg-neutral-800")}>
      {body}
    </Link>
  ) : (
    <div className={shell}>{body}</div>
  );
}

function Panel({
  title, Icon, count, children,
}: {
  title: string; Icon: React.ComponentType<{ className?: string }>;
  count?: number; children: React.ReactNode;
}) {
  return (
    <section className="flex flex-col border border-white/10 bg-neutral-900/40">
      <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
        <h2 className="flex items-center gap-2.5 text-xs font-bold uppercase tracking-[0.14em] text-white/70">
          <Icon className="size-4" /> {title}
        </h2>
        {count !== undefined && (
          <span className="font-display text-sm font-700 tabular-nums text-white/50">
            {count}
          </span>
        )}
      </div>
      <div className="flex-1">{children}</div>
    </section>
  );
}

function Empty({ text }: { text: string }) {
  return (
    <div className="flex h-full min-h-[8rem] items-center justify-center p-8">
      <p className="text-sm font-medium text-white/40">{text}</p>
    </div>
  );
}

function TaskList({
  title, Icon, tasks, empty, tone, note,
}: {
  title: string; Icon: React.ComponentType<{ className?: string }>;
  tasks: DashTask[]; empty: string;
  tone?: "danger" | "warn"; note?: string;
}) {
  const hot = tone && tasks.length > 0;
  const t = hot ? TONE[tone] : null;

  return (
    <section className={cn(
      "flex flex-col border bg-neutral-900/40",
      hot ? tone === "danger" ? "border-brand-ember/25" : "border-brand-orange/25" : "border-white/10"
    )}>
      <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
        <h2 className={cn(
          "flex items-center gap-2.5 text-xs font-bold uppercase tracking-[0.14em]",
          t ? t.text : "text-white/70"
        )}>
          <Icon className="size-4" /> {title}
        </h2>
        <span className={cn(
          "font-display text-sm font-700 tabular-nums",
          t ? t.text : "text-white/50"
        )}>
          {tasks.length}
        </span>
      </div>

      {note && (
        <p className="border-b border-white/10 px-5 py-2.5 text-xs font-medium text-white/45">
          {note}
        </p>
      )}

      {tasks.length === 0 ? (
        <Empty text={empty} />
      ) : (
        <ul className="divide-y divide-white/[0.07]">
          {tasks.map((task) => <TaskRow key={task.id} t={task} />)}
        </ul>
      )}
    </section>
  );
}

function TaskRow({ t }: { t: DashTask }) {
  const days = daysUntil(t.due_date);
  const late = days !== null && days < 0;
  const soon = days !== null && days >= 0 && days <= 3;

  return (
    <li>
      <Link href={`/internal/erp/team/clients/${t.client_id}`}
        className="group relative block px-5 py-4 transition-colors hover:bg-white/[0.04]">
        {late && <span className="absolute inset-y-0 left-0 w-0.5 bg-brand-ember" />}

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
          <span className={cn("ml-auto text-[11px] font-bold uppercase tracking-wide",
            PRIORITY_STYLE[t.priority])}>
            {PRIORITY_LABELS[t.priority]}
          </span>
        </div>

        <p className="mt-2.5 text-sm font-bold leading-snug text-white transition-colors group-hover:text-brand-green">
          {t.title}
        </p>
        <p className="mt-1 text-xs font-medium text-white/50">
          <span className="font-mono text-brand-green/80">{t.job_number}</span>
          {" · "}{t.client_name}
        </p>

        <div className="mt-3.5 flex items-center gap-3">
          <div className="h-1 flex-1 bg-white/[0.08]">
            <div className={cn("h-full transition-all duration-500", progressTone(t.status))}
              style={{ width: `${t.progress}%` }} />
          </div>
          <span className="w-9 text-right text-xs font-bold tabular-nums text-white/60">
            {t.progress}%
          </span>
          {t.due_date && (
            <span className={cn(
              "flex w-24 items-center justify-end gap-1.5 text-xs font-bold",
              late ? "text-brand-ember" : soon ? "text-brand-orange" : "text-white/45"
            )}>
              <CalendarClock className="size-3 shrink-0" />
              {late ? `${Math.abs(days!)}d late`
                : days === 0 ? "Today"
                : soon ? `${days}d left`
                : formatDate(t.due_date)}
            </span>
          )}
        </div>
      </Link>
    </li>
  );
}

function ProjectRow({ p }: { p: DashProject }) {
  return (
    <li>
      <Link href={`/internal/erp/team/clients/${p.client_id}`}
        className="group flex flex-wrap items-center gap-5 px-5 py-4 transition-colors hover:bg-white/[0.04]">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2.5">
            <span className="font-mono text-xs font-bold text-brand-green">{p.job_number}</span>
            <span className="text-sm font-bold text-white transition-colors group-hover:text-brand-green">
              {p.title}
            </span>
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
          <p className="mt-1.5 text-xs font-medium text-white/50">
            {p.client_name} · {p.done_count}/{p.task_count} tasks
            {p.target_date && ` · due ${formatDate(p.target_date)}`}
          </p>
        </div>

        <div className="flex w-32 items-center gap-2.5">
          <div className="h-1 flex-1 bg-white/[0.08]">
            <div className="h-full bg-brand-green transition-all duration-500"
              style={{ width: `${p.progress}%` }} />
          </div>
          <span className="w-9 text-right text-xs font-bold tabular-nums text-white/60">
            {p.progress}%
          </span>
        </div>
      </Link>
    </li>
  );
}

function ActivityItem({ a }: { a: Activity }) {
  const Icon = a.kind === "attachment" ? Paperclip
    : a.kind === "verdict" ? ThumbsUp : MessageSquare;

  return (
    <li className="flex gap-3.5 px-5 py-4">
      <span className={cn(
        "flex size-9 shrink-0 items-center justify-center border text-[11px] font-bold",
        a.from_client
          ? "border-brand-cyan/30 bg-brand-cyan/10 text-brand-cyan"
          : "border-brand-green/30 bg-brand-green/10 text-brand-green"
      )}>
        {initials(a.actor)}
      </span>

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-baseline gap-x-2">
          <span className="text-sm font-bold text-white">{a.actor}</span>
          <Icon className={cn("size-3",
            a.kind === "verdict" ? "text-brand-ember" : "text-white/35")} />
          <span className="ml-auto text-xs font-medium text-white/40">
            {relativeTime(a.at)}
          </span>
        </div>
        <p className="mt-1 line-clamp-2 text-sm font-medium leading-snug text-white/75">
          {a.summary}
        </p>
        <p className="mt-1.5 truncate text-xs font-medium text-white/40">
          {a.task_title} · {a.client_name}
        </p>
      </div>
    </li>
  );
}
