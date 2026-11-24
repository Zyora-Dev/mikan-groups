"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import {
  AlertTriangle, ArrowLeft, CalendarDays, CheckCircle2, Loader2,
  MessageSquare, Paperclip, Plus, ThumbsUp,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { TaskSheet } from "@/components/task-sheet";
import {
  PRIORITY_LABELS, PROJECT_STATUS_LABELS, TASK_STATUS_LABELS, VERDICT_LABELS,
  type Project, type Task, ApiError, api,
} from "@/lib/api";
import {
  DUE_TONE, PRIORITY_STYLE, PROJECT_STATUS_STYLE, TASK_STATUS_STYLE,
  VERDICT_STYLE, dueChip, formatDate, progressTone,
} from "@/lib/project-ui";
import { cn } from "@/lib/utils";

type Tab = "all" | "awaiting" | "open" | "done";

export function PortalProject({ projectId }: { projectId: string }) {
  const [project, setProject] = useState<Project | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [openTask, setOpenTask] = useState<Task | null>(null);
  const [tab, setTab] = useState<Tab>("all");
  const [requesting, setRequesting] = useState(false);

  const load = useCallback(async () => {
    try {
      const [p, t] = await Promise.all([
        api.projects.get(projectId),
        api.tasks.list(projectId),
      ]);
      setProject(p);
      setTasks(t);
      // Keep an open sheet in step with the refreshed list.
      setOpenTask((cur) => (cur ? t.find((x) => x.id === cur.id) ?? null : null));
    } catch (err) {
      setError(
        err instanceof ApiError && err.status === 404
          ? "That project isn't available on your account."
          : "Could not load this project. Please refresh.",
      );
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => { void load(); }, [load]);

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Loader2 className="size-6 animate-spin text-brand-green" />
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="space-y-4">
        <Link href="/portal/projects"
          className="inline-flex items-center gap-2 text-sm font-bold text-white/60 hover:text-white">
          <ArrowLeft className="size-4" /> Back to projects
        </Link>
        <p className="border-l-2 border-brand-ember bg-brand-ember/5 px-5 py-4 text-sm font-semibold text-brand-ember">
          {error}
        </p>
      </div>
    );
  }

  const awaiting = tasks.filter(
    (t) => t.status === "submitted" && t.verdict === "awaiting",
  );
  const done = tasks.filter((t) => t.status === "done");
  const open = tasks.filter((t) => t.status !== "done");
  const overdue = open.filter(
    (t) => t.due_date && new Date(t.due_date) < new Date(new Date().toDateString()),
  );

  const shown =
    tab === "awaiting" ? awaiting : tab === "open" ? open : tab === "done" ? done : tasks;

  const due = dueChip(project.target_date, project.status === "completed");

  const TABS: { value: Tab; label: string; count: number }[] = [
    { value: "all", label: "Everything", count: tasks.length },
    { value: "awaiting", label: "Needs you", count: awaiting.length },
    { value: "open", label: "In progress", count: open.length },
    { value: "done", label: "Complete", count: done.length },
  ];

  return (
    <div className="space-y-5">
      <Link href="/portal/projects"
        className="inline-flex items-center gap-2 text-sm font-bold text-white/60 transition-colors hover:text-white">
        <ArrowLeft className="size-4" /> Back to projects
      </Link>

      {/* ---------- header ---------- */}
      <header className="overflow-hidden rounded-xl border border-white/10 bg-neutral-900">
        <div className="flex flex-wrap items-start justify-between gap-4 px-6 py-5">
          <div className="min-w-0">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-brand-green">
              {project.job_number}
            </p>
            <h1 className="mt-2 font-display text-2xl font-700 uppercase leading-tight text-white">
              {project.title}
            </h1>
            {project.description && (
              <p className="mt-2.5 max-w-2xl text-sm font-medium leading-relaxed text-white/60">
                {project.description}
              </p>
            )}
          </div>

          <div className="flex shrink-0 flex-wrap items-center gap-2">
            <span className={cn(
              "rounded-full px-3 py-1.5 text-xs font-bold",
              PROJECT_STATUS_STYLE[project.status]
            )}>
              {PROJECT_STATUS_LABELS[project.status]}
            </span>
            {due && (
              <span className={cn(
                "flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold",
                DUE_TONE[due.tone]
              )}>
                <CalendarDays className="size-3.5" /> {due.label}
              </span>
            )}
          </div>
        </div>

        {/* progress + facts */}
        <div className="border-t border-white/[0.07] px-6 py-4">
          <div className="flex items-center gap-4">
            <div className="h-2 flex-1 overflow-hidden rounded-full bg-white/10">
              <div className="h-full rounded-full bg-brand-green transition-all duration-500"
                style={{ width: `${project.progress}%` }} />
            </div>
            <span className="w-12 shrink-0 text-right font-display text-lg font-700 tabular-nums text-white">
              {project.progress}%
            </span>
          </div>

          <dl className="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            <Fact label="Discipline" value={project.discipline ?? "Detailing"} />
            <Fact label="Standard" value={project.standard ?? "—"} />
            <Fact label="Started" value={formatDate(project.start_date)} />
            <Fact label="Target" value={formatDate(project.target_date)} />
          </dl>
        </div>

        {(awaiting.length > 0 || overdue.length > 0) && (
          <div className="flex flex-wrap gap-2 border-t border-white/[0.07] px-6 py-3.5">
            {awaiting.length > 0 && (
              <span className="inline-flex items-center gap-2 rounded-full bg-brand-orange/15 px-3 py-1.5 text-xs font-bold text-brand-orange">
                <ThumbsUp className="size-3.5" />
                {awaiting.length} waiting on your decision
              </span>
            )}
            {overdue.length > 0 && (
              <span className="inline-flex items-center gap-2 rounded-full bg-brand-ember/15 px-3 py-1.5 text-xs font-bold text-brand-ember">
                <AlertTriangle className="size-3.5" />
                {overdue.length} past the agreed date
              </span>
            )}
          </div>
        )}
      </header>

      {/* ---------- tasks ---------- */}
      <section className="overflow-hidden rounded-xl border border-white/10 bg-neutral-900">
        <header className="flex flex-wrap items-center gap-3 border-b border-white/[0.07] px-5 py-3.5">
          <div className="flex flex-wrap gap-1.5">
            {TABS.map((t) => (
              <button key={t.value} type="button" onClick={() => setTab(t.value)}
                className={cn(
                  "rounded-full px-3.5 py-1.5 text-xs font-bold transition-colors",
                  tab === t.value
                    ? "bg-brand-green text-white"
                    : "bg-white/[0.06] text-white/60 hover:bg-white/10 hover:text-white"
                )}>
                {t.label}
                <span className="ml-1.5 tabular-nums opacity-60">{t.count}</span>
              </button>
            ))}
          </div>

          <Button onClick={() => setRequesting(true)} variant="outline"
            className="ml-auto h-9 rounded-lg border-white/20 bg-transparent px-4 text-xs font-bold text-white hover:bg-white/10">
            <Plus className="mr-1.5 size-3.5" /> Request work
          </Button>
        </header>

        {shown.length === 0 ? (
          <p className="px-5 py-14 text-center text-sm font-medium text-white/40">
            {tab === "awaiting"
              ? "Nothing is waiting on you."
              : tab === "done"
                ? "Nothing has been signed off yet."
                : "No items here yet."}
          </p>
        ) : (
          <ul className="divide-y divide-white/[0.06]">
            {shown.map((t) => {
              const d = dueChip(t.due_date, t.status === "done");
              return (
                <li key={t.id}>
                  <button type="button" onClick={() => setOpenTask(t)}
                    className="group flex w-full flex-wrap items-center gap-4 px-5 py-4 text-left transition-colors hover:bg-white/[0.03]">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className={cn(
                          "rounded-full border px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide",
                          TASK_STATUS_STYLE[t.status]
                        )}>
                          {t.status === "submitted"
                            ? "For your review"
                            : TASK_STATUS_LABELS[t.status]}
                        </span>
                        {t.verdict !== "none" && (
                          <span className={cn(
                            "rounded-full border px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide",
                            VERDICT_STYLE[t.verdict]
                          )}>
                            {VERDICT_LABELS[t.verdict]}
                          </span>
                        )}
                        {t.raised_by_client && (
                          <span className="rounded-full border border-white/20 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white/55">
                            Your request
                          </span>
                        )}
                      </div>

                      <p className="mt-2 text-sm font-bold text-white transition-colors group-hover:text-brand-green">
                        {t.title}
                      </p>

                      <div className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs font-medium">
                        {d && (
                          <span className={cn(
                            "flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-bold",
                            DUE_TONE[d.tone]
                          )}>
                            <CalendarDays className="size-3" /> {d.label}
                          </span>
                        )}
                        <span className={PRIORITY_STYLE[t.priority]}>
                          {PRIORITY_LABELS[t.priority]}
                        </span>
                        {t.comment_count > 0 && (
                          <span className="flex items-center gap-1.5 text-white/55">
                            <MessageSquare className="size-3" /> {t.comment_count}
                          </span>
                        )}
                        {t.attachment_count > 0 && (
                          <span className="flex items-center gap-1.5 text-white/55">
                            <Paperclip className="size-3" /> {t.attachment_count}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex w-28 shrink-0 items-center gap-2.5">
                      <div className="h-1 flex-1 rounded-full bg-white/[0.08]">
                        <div className={cn(
                          "h-full rounded-full transition-all duration-500",
                          progressTone(t.status)
                        )} style={{ width: `${t.progress}%` }} />
                      </div>
                      <span className="w-9 text-right text-xs font-bold tabular-nums text-white/60">
                        {t.progress}%
                      </span>
                    </div>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <TaskSheet task={openTask} open={openTask !== null}
        onOpenChange={(o) => !o && setOpenTask(null)}
        isClient onChanged={() => void load()} />

      <RequestDialog projectId={projectId} open={requesting}
        onOpenChange={setRequesting} onCreated={() => void load()} />
    </div>
  );
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-[11px] font-bold uppercase tracking-wide text-white/40">
        {label}
      </dt>
      <dd className="mt-1 text-sm font-bold text-white">{value}</dd>
    </div>
  );
}

/** Clients raise work as a request; the team accepts and schedules it. */
function RequestDialog({
  projectId, open, onOpenChange, onCreated,
}: {
  projectId: string;
  open: boolean;
  onOpenChange: (o: boolean) => void;
  onCreated: () => void;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  useEffect(() => {
    if (open) { setError(null); setSent(false); }
  }, [open]);

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const title = String(fd.get("title") ?? "").trim();
    if (!title) { setError("Give the request a short title."); return; }

    setBusy(true);
    setError(null);
    try {
      await api.tasks.create(projectId, {
        title,
        description: String(fd.get("description") ?? "").trim() || null,
        due_date: String(fd.get("due_date") ?? "") || null,
      });
      setSent(true);
      onCreated();
      window.setTimeout(() => onOpenChange(false), 1400);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not send that request.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg border-white/10 bg-neutral-900 text-white">
        <DialogHeader>
          <DialogTitle className="font-display text-xl font-700 uppercase">
            Request work
          </DialogTitle>
        </DialogHeader>

        {sent ? (
          <div className="flex flex-col items-center gap-3 py-8 text-center">
            <CheckCircle2 className="size-8 text-brand-green" />
            <p className="text-sm font-bold text-white">Request sent</p>
            <p className="max-w-xs text-xs font-medium leading-relaxed text-white/55">
              The team has been notified. You&apos;ll see it here once they accept it.
            </p>
          </div>
        ) : (
          <form onSubmit={submit} className="space-y-4">
            <p className="text-sm font-medium leading-relaxed text-white/60">
              Tell the team what you need. They&apos;ll review it, schedule it and
              come back to you.
            </p>

            <div className="space-y-2">
              <Label htmlFor="title" className="text-xs font-bold uppercase tracking-wide text-white/70">
                What do you need? <span className="text-brand-green">*</span>
              </Label>
              <Input id="title" name="title" maxLength={200}
                placeholder="e.g. Revised connection details for Grid C"
                className="h-11 rounded-lg border-white/15 bg-neutral-950 text-sm font-medium text-white placeholder:text-white/30" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description" className="text-xs font-bold uppercase tracking-wide text-white/70">
                Detail
              </Label>
              <Textarea id="description" name="description" rows={4} maxLength={2000}
                placeholder="Any drawing references, revisions or constraints the team should know about."
                className="rounded-lg border-white/15 bg-neutral-950 text-sm font-medium text-white placeholder:text-white/30" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="due_date" className="text-xs font-bold uppercase tracking-wide text-white/70">
                Needed by
              </Label>
              <Input id="due_date" name="due_date" type="date"
                className="h-11 rounded-lg border-white/15 bg-neutral-950 text-sm font-medium text-white [color-scheme:dark]" />
            </div>

            {error && (
              <p className="border-l-2 border-brand-ember bg-brand-ember/5 px-4 py-3 text-sm font-semibold text-brand-ember">
                {error}
              </p>
            )}

            <div className="flex justify-end gap-2.5 pt-1">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}
                className="h-11 rounded-lg border-white/20 bg-transparent px-5 text-sm font-bold text-white hover:bg-white/10">
                Cancel
              </Button>
              <Button type="submit" disabled={busy}
                className="h-11 rounded-lg bg-brand-green px-5 text-sm font-bold text-white hover:bg-brand-green/90">
                {busy ? <Loader2 className="size-4 animate-spin" /> : "Send request"}
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
