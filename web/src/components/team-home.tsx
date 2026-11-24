"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  AlertTriangle, ArrowRight, ArrowUpRight, Building2, CalendarClock,
  CheckCircle2, ClipboardList, Clock, FolderKanban, Inbox, MessageSquare,
  Paperclip, ThumbsUp, Users,
} from "lucide-react";
import {
  DeadlineBars, StatusDonut, ThroughputChart,
} from "@/components/dash-charts";
import {
  type Activity, type DashProject, type DashTask, type Dashboard,
  PRIORITY_LABELS, PROJECT_STATUS_LABELS, type Session, TASK_STATUS_LABELS,
  VERDICT_LABELS, api,
} from "@/lib/api";
import {
  DUE_TONE, dueChip, greeting, initials, PRIORITY_STYLE,
  progressTone, PROJECT_STATUS_STYLE, relativeTime, TASK_STATUS_STYLE, today,
  VERDICT_STYLE,
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

  if (loading) return <Skeleton />;
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
  const attention =
    data.overdue.length + data.client_requests.length +
    (isAdmin ? 0 : data.checking.length);

  return (
    <div className="space-y-5">
      {/* ---------- header ---------- */}
      <header className="flex flex-wrap items-start justify-between gap-5">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-brand-green">
            {today()}
          </p>
          <h1 className="mt-2 font-display text-2xl font-700 uppercase leading-none text-white md:text-3xl">
            {greeting()}{firstName && `, ${firstName}`}
          </h1>
          <p className="mt-2 text-sm font-medium text-white/55">
            {attention === 0
              ? isAdmin ? "Nothing needs your attention right now." : "You're all caught up."
              : `${attention} item${attention === 1 ? "" : "s"} need${attention === 1 ? "s" : ""} attention.`}
          </p>
        </div>

        <Link href="/internal/erp/team/clients"
          className="group flex items-center gap-2.5 rounded-lg bg-brand-green px-5 py-3 text-sm font-bold text-white transition-colors hover:bg-brand-green/90">
          <Building2 className="size-4" /> Clients
          <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
        </Link>
      </header>

      {/* ---------- KPI strip ---------- */}
      <div className="grid gap-px overflow-hidden rounded-xl border border-white/10 bg-white/[0.07] sm:grid-cols-2 lg:grid-cols-4">
        {(isAdmin
          ? [
              { Icon: Building2, label: "Active clients", value: s.clients_active, sub: `${s.clients_total} on the books`, href: "/internal/erp/team/clients" },
              { Icon: FolderKanban, label: "Live projects", value: s.projects_active, sub: `${s.projects_total} total` },
              { Icon: ClipboardList, label: "Open tasks", value: s.tasks_open, sub: s.due_this_week ? `${s.due_this_week} due this week` : "None due this week" },
              { Icon: AlertTriangle, label: "Overdue", value: s.tasks_overdue, sub: "Past deadline", tone: "danger" as const },
            ]
          : [
              { Icon: ClipboardList, label: "My tasks", value: data.my_tasks.length, sub: "Assigned to me" },
              { Icon: CheckCircle2, label: "To check", value: data.checking.length, sub: "Waiting on my review", tone: "warn" as const },
              { Icon: AlertTriangle, label: "Overdue", value: data.overdue.length, sub: "In my projects", tone: "danger" as const },
              { Icon: FolderKanban, label: "Projects", value: data.projects.length, sub: "I'm involved in" },
            ]
        ).map((k) => <Kpi key={k.label} {...k} />)}
      </div>

      {isAdmin && (
        <div className="grid gap-px overflow-hidden rounded-xl border border-white/10 bg-white/[0.07] sm:grid-cols-2 lg:grid-cols-4">
          <Kpi Icon={ThumbsUp} label="With the client" value={s.awaiting_client}
            sub="Submitted, not yet judged" tone="warn" />
          <Kpi Icon={Inbox} label="New requests" value={data.client_requests.length}
            sub="Raised, not accepted" tone="warn" />
          <Kpi Icon={Users} label="Team" value={s.team_size} sub="Active staff"
            href="/internal/erp/team/members" />
          <Kpi Icon={Users} label="Portal users" value={s.portal_users} sub="Across all clients" />
        </div>
      )}

      {/* ---------- charts ---------- */}
      <div className="grid gap-5 xl:grid-cols-[1.6fr_1fr]">
        <Card title="Throughput" subtitle="Tasks created and completed, last eight weeks"
          legend={[
            { label: "Created", colour: "#29ABE2" },
            { label: "Completed", colour: "#00A651" },
          ]}>
          <ThroughputChart data={data.trend} hasHistory={data.has_history} />
        </Card>

        <Card title="Task status" subtitle="Where the work sits">
          <StatusDonut data={data.status_mix} />
        </Card>
      </div>

      <div className="grid gap-5 xl:grid-cols-[1fr_1.6fr]">
        <Card title="Deadlines" subtitle="Open tasks by when they're due">
          <DeadlineBars data={data.deadlines} />
        </Card>

        <Card title={isAdmin ? "Projects" : "My projects"} Icon={FolderKanban}
          count={data.projects.length}>
          {data.projects.length === 0 ? (
            <Empty text="No projects yet." />
          ) : (
            <ul className="divide-y divide-white/[0.07]">
              {data.projects.map((p) => <ProjectRow key={p.id} p={p} />)}
            </ul>
          )}
        </Card>
      </div>

      {/* ---------- lists ---------- */}
      <div className="grid gap-5 xl:grid-cols-2">
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

      <Card title="Recent activity" Icon={MessageSquare} count={data.activity.length}>
        {data.activity.length === 0 ? (
          <Empty text="Nothing yet." />
        ) : (
          <ul className="divide-y divide-white/[0.07]">
            {data.activity.map((a, i) => <ActivityItem key={`${a.task_id}-${i}`} a={a} />)}
          </ul>
        )}
      </Card>
    </div>
  );
}

/* ------------------------------------------------------------ shells */

function Card({
  title, subtitle, Icon, count, legend, children,
}: {
  title: string; subtitle?: string;
  Icon?: React.ComponentType<{ className?: string }>;
  count?: number;
  legend?: { label: string; colour: string }[];
  children: React.ReactNode;
}) {
  return (
    <section className="flex flex-col overflow-hidden rounded-xl border border-white/10 bg-neutral-900">
      <div className="flex flex-wrap items-start justify-between gap-3 px-5 py-3.5">
        <div>
          <h2 className="flex items-center gap-2.5 text-sm font-bold text-white">
            {Icon && <Icon className="size-4 text-white/45" />} {title}
          </h2>
          {subtitle && (
            <p className="mt-1 text-xs font-medium text-white/45">{subtitle}</p>
          )}
        </div>

        {legend && (
          <ul className="flex items-center gap-4">
            {legend.map((l) => (
              <li key={l.label} className="flex items-center gap-2">
                <span className="size-2 rounded-sm" style={{ background: l.colour }} />
                <span className="text-xs font-semibold text-white/60">{l.label}</span>
              </li>
            ))}
          </ul>
        )}

        {count !== undefined && (
          <span className="font-display text-sm font-700 tabular-nums text-white/45">
            {count}
          </span>
        )}
      </div>
      <div className="flex-1 border-t border-white/[0.07]">{children}</div>
    </section>
  );
}

function Kpi({
  Icon, label, value, sub, tone, href,
}: {
  Icon: React.ComponentType<{ className?: string }>;
  label: string; value: number; sub?: string;
  tone?: "danger" | "warn"; href?: string;
}) {
  // Zero overdue is good news, not an alarm.
  const hot = tone && value > 0;
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
            : "bg-white/[0.06]"
        )}>
          <Icon className={cn("size-4", hot ? colour : "text-brand-green")} />
        </span>
        <p className={cn("font-display text-3xl font-700 leading-none tabular-nums", colour)}>
          {value}
        </p>
        {href && (
          <ArrowUpRight className="ml-auto size-3.5 text-white/20 transition-colors group-hover:text-white/70" />
        )}
      </div>
      <p className="mt-3 text-sm font-bold leading-tight text-white">{label}</p>
      {sub && <p className="mt-0.5 text-xs font-medium text-white/45">{sub}</p>}
    </>
  );

  const shell = "group bg-neutral-900 p-4 transition-colors";
  return href ? (
    <Link href={href} className={cn(shell, "hover:bg-neutral-800")}>{body}</Link>
  ) : (
    <div className={shell}>{body}</div>
  );
}

function Empty({ text }: { text: string }) {
  return (
    <div className="flex h-full min-h-[8rem] items-center justify-center p-8">
      <p className="text-sm font-medium text-white/40">{text}</p>
    </div>
  );
}

function Skeleton() {
  return (
    <div className="space-y-6">
      <div className="h-10 w-72 animate-pulse rounded-lg bg-white/[0.06]" />
      <div className="grid gap-px overflow-hidden rounded-xl bg-white/[0.07] sm:grid-cols-2 lg:grid-cols-4">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="h-40 animate-pulse bg-neutral-900" />
        ))}
      </div>
      <div className="grid gap-5 xl:grid-cols-[1.6fr_1fr]">
        <div className="h-80 animate-pulse rounded-xl bg-neutral-900" />
        <div className="h-80 animate-pulse rounded-xl bg-neutral-900" />
      </div>
    </div>
  );
}

/* ------------------------------------------------------------- rows */

function TaskList({
  title, Icon, tasks, empty, tone, note,
}: {
  title: string; Icon: React.ComponentType<{ className?: string }>;
  tasks: DashTask[]; empty: string;
  tone?: "danger" | "warn"; note?: string;
}) {
  const hot = tone && tasks.length > 0;

  return (
    <section className={cn(
      "flex flex-col overflow-hidden rounded-xl border bg-neutral-900",
      hot ? tone === "danger" ? "border-brand-ember/25" : "border-brand-orange/25" : "border-white/10"
    )}>
      <div className="flex items-center justify-between px-5 py-3.5">
        <h2 className={cn("flex items-center gap-2.5 text-sm font-bold",
          hot ? tone === "danger" ? "text-brand-ember" : "text-brand-orange" : "text-white")}>
          <Icon className="size-4" /> {title}
        </h2>
        <span className={cn("font-display text-sm font-700 tabular-nums",
          hot ? tone === "danger" ? "text-brand-ember" : "text-brand-orange" : "text-white/45")}>
          {tasks.length}
        </span>
      </div>

      {note && (
        <p className="border-t border-white/[0.07] px-5 py-2.5 text-xs font-medium text-white/45">
          {note}
        </p>
      )}

      <div className="flex-1 border-t border-white/[0.07]">
        {tasks.length === 0 ? (
          <Empty text={empty} />
        ) : (
          <ul className="divide-y divide-white/[0.07]">
            {tasks.map((task) => <TaskRow key={task.id} t={task} />)}
          </ul>
        )}
      </div>
    </section>
  );
}

function TaskRow({ t }: { t: DashTask }) {
  const due = dueChip(t.due_date, t.status === "done");
  const late = due.tone === "overdue";

  return (
    <li>
      <Link href={`/internal/erp/team/clients/${t.client_id}`}
        className="group relative block px-5 py-3 transition-colors hover:bg-white/[0.04]">
        {late && <span className="absolute inset-y-0 left-0 w-0.5 bg-brand-ember" />}

        <div className="flex flex-wrap items-center gap-2">
          <span className={cn("rounded-full border px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide",
            TASK_STATUS_STYLE[t.status])}>
            {TASK_STATUS_LABELS[t.status]}
          </span>
          {t.verdict !== "none" && (
            <span className={cn("rounded-full border px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide",
              VERDICT_STYLE[t.verdict])}>
              {VERDICT_LABELS[t.verdict]}
            </span>
          )}
          <span className={cn("ml-auto text-[11px] font-bold uppercase tracking-wide",
            PRIORITY_STYLE[t.priority])}>
            {PRIORITY_LABELS[t.priority]}
          </span>
        </div>

        <p className="mt-2 text-sm font-bold leading-snug text-white transition-colors group-hover:text-brand-green">
          {t.title}
        </p>
        <p className="mt-1 text-xs font-medium text-white/50">
          <span className="font-mono text-brand-green/80">{t.job_number}</span>
          {" · "}{t.client_name}
        </p>

        <div className="mt-2.5 flex items-center gap-3">
          <div className="h-1 flex-1 rounded-full bg-white/[0.08]">
            <div className={cn("h-full rounded-full transition-all duration-500", progressTone(t.status))}
              style={{ width: `${t.progress}%` }} />
          </div>
          <span className="w-9 text-right text-xs font-bold tabular-nums text-white/60">
            {t.progress}%
          </span>
          {t.due_date && (
            <span className={cn(
              "flex shrink-0 items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-bold",
              DUE_TONE[due.tone]
            )}>
              <CalendarClock className="size-3 shrink-0" /> {due.label}
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
        className="group flex flex-wrap items-center gap-5 px-5 py-3 transition-colors hover:bg-white/[0.04]">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2.5">
            <span className="font-mono text-xs font-bold text-brand-green">{p.job_number}</span>
            <span className="text-sm font-bold text-white transition-colors group-hover:text-brand-green">
              {p.title}
            </span>
            <span className={cn("rounded-full border px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide",
              PROJECT_STATUS_STYLE[p.status])}>
              {PROJECT_STATUS_LABELS[p.status]}
            </span>
            {p.overdue_count > 0 && (
              <span className="flex items-center gap-1 rounded rounded-full border border-brand-ember/40 bg-brand-ember/10 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-brand-ember">
                <Clock className="size-3" /> {p.overdue_count}
              </span>
            )}
          </div>
          <p className="mt-1.5 text-xs font-medium text-white/50">
            {p.client_name} · {p.done_count}/{p.task_count} tasks
          </p>
        </div>
        <div className="flex w-32 items-center gap-2.5">
          <div className="h-1 flex-1 rounded-full bg-white/[0.08]">
            <div className="h-full rounded-full bg-brand-green transition-all duration-500"
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
    <li className="flex gap-3 px-5 py-3">
      <span className={cn(
        "flex size-9 shrink-0 items-center justify-center rounded-lg border text-[11px] font-bold",
        a.from_client
          ? "border-brand-cyan/30 bg-brand-cyan/10 text-brand-cyan"
          : "border-brand-green/30 bg-brand-green/10 text-brand-green"
      )}>
        {initials(a.actor)}
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-baseline gap-x-2">
          <span className="text-sm font-bold text-white">{a.actor}</span>
          <Icon className={cn("size-3", a.kind === "verdict" ? "text-brand-ember" : "text-white/35")} />
          <span className="ml-auto text-xs font-medium text-white/40">{relativeTime(a.at)}</span>
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
