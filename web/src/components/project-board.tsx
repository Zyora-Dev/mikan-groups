"use client";

import { useCallback, useEffect, useState } from "react";
import {
  AlertCircle, CalendarDays, ChevronDown, Clock, FolderOpen, Loader2,
  MessageSquare, Paperclip, Plus, Trash2,
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
import { TaskSheet } from "@/components/task-sheet";
import { Textarea } from "@/components/ui/textarea";
import {
  ApiError, PRIORITY_LABELS, PROJECT_STATUS_LABELS, type Project,
  type ProjectStatus, type Task, TASK_STATUS_LABELS, type TaskPriority,
  VERDICT_LABELS, api,
} from "@/lib/api";
import {
  DUE_TONE, dueChip, PRIORITY_STYLE, progressTone,
  PROJECT_STATUS_STYLE, TASK_STATUS_STYLE, VERDICT_STYLE,
} from "@/lib/project-ui";
import { cn } from "@/lib/utils";

export function ProjectBoard({
  clientId, isClient = false,
}: { clientId: string; isClient?: boolean }) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [tasks, setTasks] = useState<Record<string, Task[]>>({});
  const [expanded, setExpanded] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [newProject, setNewProject] = useState(false);
  const [newTaskFor, setNewTaskFor] = useState<string | null>(null);
  const [openTask, setOpenTask] = useState<Task | null>(null);

  const load = useCallback(async () => {
    try {
      const list = await api.projects.list(isClient ? undefined : { client_id: clientId });
      setProjects(list);
      if (list.length && expanded === null) setExpanded(list[0].id);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not load projects.");
    } finally {
      setLoading(false);
    }
  }, [clientId, isClient, expanded]);

  useEffect(() => { void load(); }, [load]);

  const loadTasks = useCallback(async (projectId: string) => {
    try {
      const list = await api.tasks.list(projectId);
      setTasks((t) => ({ ...t, [projectId]: list }));
    } catch {
      setError("Could not load tasks.");
    }
  }, []);

  useEffect(() => {
    if (expanded) void loadTasks(expanded);
  }, [expanded, loadTasks]);

  async function refresh() {
    await load();
    if (expanded) await loadTasks(expanded);
    if (openTask) {
      const fresh = (await api.tasks.list(openTask.project_id)).find((x) => x.id === openTask.id);
      if (fresh) setOpenTask(fresh);
    }
  }

  async function createProject(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    setBusy(true);
    setError(null);
    try {
      const created = await api.projects.create(clientId, {
        job_number: String(fd.get("job_number") ?? "").trim(),
        title: String(fd.get("title") ?? "").trim(),
        standard: String(fd.get("standard") ?? "").trim() || undefined,
        target_date: String(fd.get("target_date") ?? "") || undefined,
        description: String(fd.get("description") ?? "").trim() || undefined,
      });
      setNewProject(false);
      setExpanded(created.id);
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not create the project.");
    } finally {
      setBusy(false);
    }
  }

  async function createTask(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!newTaskFor) return;
    const fd = new FormData(e.currentTarget);
    setBusy(true);
    try {
      await api.tasks.create(newTaskFor, {
        title: String(fd.get("title") ?? "").trim(),
        description: String(fd.get("description") ?? "").trim() || undefined,
        due_date: String(fd.get("due_date") ?? "") || undefined,
        priority: String(fd.get("priority") ?? "normal"),
      });
      setNewTaskFor(null);
      await refresh();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not create the task.");
    } finally {
      setBusy(false);
    }
  }

  async function setProjectStatus(p: Project, status: ProjectStatus) {
    try {
      await api.projects.update(p.id, { status });
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not change status.");
    }
  }

  async function removeTask(task: Task) {
    try {
      await api.tasks.remove(task.id);
      await refresh();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not delete the task.");
    }
  }

  return (
    <section className="overflow-hidden rounded-xl border border-white/10 bg-neutral-900">
      <div className="flex flex-wrap items-center justify-between gap-4 px-5 py-4">
        <h2 className="text-sm font-bold text-white">
          {isClient ? "Your projects" : "Projects"}
          <span className="ml-2.5 font-display tabular-nums text-white/40">
            {projects.length}
          </span>
        </h2>
        {!isClient && (
          <Button onClick={() => setNewProject(true)}
            className="h-9 rounded-lg bg-brand-green px-4 text-xs font-bold text-white hover:bg-brand-green/90">
            <Plus className="mr-2 size-3.5" /> New project
          </Button>
        )}
      </div>

      {error && (
        <p role="alert" className="flex items-center gap-2.5 border-b border-white/10 bg-brand-ember/10 px-6 py-3.5 text-sm font-semibold text-brand-ember">
          <AlertCircle className="size-4 shrink-0" /> {error}
        </p>
      )}

      {loading ? (
        <p className="p-10 text-center text-sm font-bold uppercase tracking-wide text-white/45">
          Loading…
        </p>
      ) : projects.length === 0 ? (
        <div className="p-12 text-center">
          <FolderOpen className="mx-auto size-8 text-white/25" />
          <p className="mt-4 text-base font-bold text-white">No projects yet</p>
          <p className="mt-2 text-sm font-medium text-white/55">
            {isClient ? "Nothing has been set up yet." : "Create the first project for this client."}
          </p>
        </div>
      ) : (
        <div className="divide-y divide-white/10">
          {projects.map((p) => {
            const open = expanded === p.id;
            const list = tasks[p.id] ?? [];
            return (
              <article key={p.id}>
                <button type="button" onClick={() => setExpanded(open ? null : p.id)}
                  aria-expanded={open}
                  className={cn(
                    "flex w-full flex-wrap items-center gap-5 px-5 py-4 text-left transition-colors",
                    open ? "bg-white/[0.03]" : "hover:bg-white/[0.03]"
                  )}>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2.5">
                      <span className="font-mono text-xs font-bold text-brand-green">
                        {p.job_number}
                      </span>
                      <h3 className="text-sm font-bold leading-tight text-white">
                        {p.title}
                      </h3>
                      <span className={cn("rounded-full border px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wide",
                        PROJECT_STATUS_STYLE[p.status])}>
                        {PROJECT_STATUS_LABELS[p.status]}
                      </span>
                      {p.overdue_count > 0 && (
                        <span className="flex items-center gap-1 rounded-full border border-brand-ember/40 bg-brand-ember/10 px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wide text-brand-ember">
                          <Clock className="size-3" /> {p.overdue_count} overdue
                        </span>
                      )}
                      {p.target_date && (
                        <span className={cn(
                          "flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-bold",
                          DUE_TONE[dueChip(p.target_date, p.status === "completed").tone]
                        )}>
                          <CalendarDays className="size-3" />
                          {dueChip(p.target_date, p.status === "completed").label}
                        </span>
                      )}
                      {p.awaiting_client > 0 && (
                        <span className="rounded-full border border-brand-orange/40 bg-brand-orange/10 px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wide text-brand-orange">
                          {p.awaiting_client} awaiting {isClient ? "you" : "client"}
                        </span>
                      )}
                    </div>
                    <p className="mt-1.5 text-xs font-medium text-white/45">
                      {p.done_count}/{p.task_count} tasks
                      {p.standard && ` · ${p.standard}`}
                    </p>
                  </div>

                  <div className="flex w-36 items-center gap-2.5">
                    <div className="h-1 flex-1 rounded-full bg-white/[0.08]">
                      <div className="h-full rounded-full bg-brand-green transition-all duration-500"
                        style={{ width: `${p.progress}%` }} />
                    </div>
                    <span className="w-9 text-right text-xs font-bold tabular-nums text-white/60">
                      {p.progress}%
                    </span>
                  </div>

                  <ChevronDown className={cn("size-5 shrink-0 text-white/45 transition-transform",
                    open && "rotate-180")} />
                </button>

                {open && (
                  <div className="border-t border-white/[0.07] bg-neutral-950/50 p-5">
                    {!isClient && (
                      <div className="mb-4 flex flex-wrap items-center gap-3">
                        <Select value={p.status} onValueChange={(v) => setProjectStatus(p, v as ProjectStatus)}>
                          <SelectTrigger className="h-10 w-40 rounded-none border-white/15 bg-neutral-900 text-xs font-bold uppercase text-white">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="rounded-lg">
                            {(Object.keys(PROJECT_STATUS_LABELS) as ProjectStatus[]).map((s) => (
                              <SelectItem key={s} value={s} >
                                {PROJECT_STATUS_LABELS[s]}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Button onClick={() => setNewTaskFor(p.id)} variant="outline"
                          className="h-10 rounded-lg border-white/20 bg-transparent px-4 text-xs font-bold text-white hover:bg-white/10">
                          <Plus className="mr-1.5 size-3.5" /> Add task
                        </Button>
                      </div>
                    )}
                    {isClient && (
                      <Button onClick={() => setNewTaskFor(p.id)} variant="outline"
                        className="mb-4 h-10 rounded-lg border-white/20 bg-transparent px-4 text-xs font-bold text-white hover:bg-white/10">
                        <Plus className="mr-1.5 size-3.5" /> Request work
                      </Button>
                    )}

                    {list.length === 0 ? (
                      <p className="py-8 text-center text-sm font-medium text-white/45">
                        No tasks yet
                      </p>
                    ) : (
                      <ul className="space-y-2.5">
                        {list.map((t) => {
                          const due = dueChip(t.due_date, t.status === "done");
                          return (
                            <li key={t.id}>
                              <div className="flex flex-wrap items-center gap-4 rounded-lg border border-white/[0.07] bg-neutral-950/60 p-4 transition-colors hover:border-white/20 hover:bg-neutral-950">
                                <button type="button" onClick={() => setOpenTask(t)}
                                  className="group/task min-w-0 flex-1 text-left">
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
                                    {t.raised_by_client && (
                                      <span className="rounded-full border border-white/20 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white/55">
                                        Request
                                      </span>
                                    )}
                                  </div>
                                  <p className="mt-2 text-sm font-bold text-white transition-colors group-hover/task:text-brand-green">{t.title}</p>
                                  <div className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs font-medium">
                                    {t.due_date && (
                                      <span className={cn(
                                        "flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-bold",
                                        DUE_TONE[due.tone]
                                      )}>
                                        <CalendarDays className="size-3" /> {due.label}
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
                                </button>

                                <div className="flex w-28 shrink-0 items-center gap-2.5">
                                  <div className="h-1 flex-1 rounded-full bg-white/[0.08]">
                                    <div className={cn("h-full rounded-full transition-all duration-500", progressTone(t.status))}
                                      style={{ width: `${t.progress}%` }} />
                                  </div>
                                  <span className="w-9 text-right text-xs font-bold tabular-nums text-white/60">
                                    {t.progress}%
                                  </span>
                                </div>

                                {!isClient && (
                                  <button onClick={() => removeTask(t)} aria-label={`Delete ${t.title}`}
                                    className="shrink-0 border border-brand-ember/30 p-2 text-brand-ember transition-colors hover:bg-brand-ember/10">
                                    <Trash2 className="size-3.5" />
                                  </button>
                                )}
                              </div>
                            </li>
                          );
                        })}
                      </ul>
                    )}
                  </div>
                )}
              </article>
            );
          })}
        </div>
      )}

      <TaskSheet task={openTask} open={openTask !== null}
        onOpenChange={(o) => !o && setOpenTask(null)}
        isClient={isClient} onChanged={() => void refresh()} />

      {/* ---------- new project ---------- */}
      <Dialog open={newProject} onOpenChange={setNewProject}>
        <DialogContent className="rounded-xl border-white/10 bg-neutral-900 text-white sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-display text-2xl font-700 uppercase">New project</DialogTitle>
            <DialogDescription className="text-sm font-medium text-white/65">
              Tasks and deadlines are added once the project exists.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={createProject} className="mt-4 space-y-5">
            <div className="grid gap-5 sm:grid-cols-2">
              <Fld id="job_number" label="Job number" required placeholder="HW-2401" />
              <Fld id="standard" label="Standard" placeholder="AS/NZS 5131" />
            </div>
            <Fld id="title" label="Title" required placeholder="Warehouse steel package" />
            <Fld id="target_date" label="Target date" type="date" />
            <div className="space-y-2">
              <Label htmlFor="description" className="text-xs font-bold uppercase tracking-wide text-white/80">
                Description
              </Label>
              <Textarea id="description" name="description" rows={3}
                className="resize-none rounded-lg border-white/15 bg-neutral-950 text-sm font-medium text-white" />
            </div>
            <div className="flex gap-3 pt-1">
              <Button type="submit" disabled={busy}
                className="h-12 flex-1 rounded-lg bg-brand-green font-semibold text-white hover:bg-brand-green/90">
                {busy ? <Loader2 className="size-4 animate-spin" /> : "Create project"}
              </Button>
              <Button type="button" variant="outline" onClick={() => setNewProject(false)}
                className="h-12 rounded-lg border-white/20 bg-transparent px-6 font-semibold text-white hover:bg-white/10">
                Cancel
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* ---------- new task ---------- */}
      <Dialog open={newTaskFor !== null} onOpenChange={(o) => !o && setNewTaskFor(null)}>
        <DialogContent className="rounded-xl border-white/10 bg-neutral-900 text-white sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-display text-2xl font-700 uppercase">
              {isClient ? "Request work" : "New task"}
            </DialogTitle>
            <DialogDescription className="text-sm font-medium text-white/65">
              {isClient
                ? "Your request goes to the Mikan team to accept and schedule."
                : "Set a deadline so it appears in the overdue count."}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={createTask} className="mt-4 space-y-5">
            <Fld id="title" label="Title" required placeholder="Shop drawings — Grid A to F" />
            <div className="space-y-2">
              <Label htmlFor="description" className="text-xs font-bold uppercase tracking-wide text-white/80">
                Description
              </Label>
              <Textarea id="description" name="description" rows={3}
                className="resize-none rounded-lg border-white/15 bg-neutral-950 text-sm font-medium text-white" />
            </div>
            <div className="grid gap-5 sm:grid-cols-2">
              <Fld id="due_date" label="Deadline" type="date" />
              <div className="space-y-2">
                <Label htmlFor="priority" className="text-xs font-bold uppercase tracking-wide text-white/80">
                  Priority
                </Label>
                <Select name="priority" defaultValue="normal">
                  <SelectTrigger id="priority"
                    className="h-11 rounded-lg border-white/15 bg-neutral-950 text-sm font-medium text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="rounded-lg">
                    {(Object.keys(PRIORITY_LABELS) as TaskPriority[]).map((p) => (
                      <SelectItem key={p} value={p} >
                        {PRIORITY_LABELS[p]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex gap-3 pt-1">
              <Button type="submit" disabled={busy}
                className="h-12 flex-1 rounded-lg bg-brand-green font-semibold text-white hover:bg-brand-green/90">
                {busy ? <Loader2 className="size-4 animate-spin" /> : isClient ? "Send request" : "Create task"}
              </Button>
              <Button type="button" variant="outline" onClick={() => setNewTaskFor(null)}
                className="h-12 rounded-lg border-white/20 bg-transparent px-6 font-semibold text-white hover:bg-white/10">
                Cancel
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </section>
  );
}

function Fld({
  id, label, required, type = "text", placeholder,
}: { id: string; label: string; required?: boolean; type?: string; placeholder?: string }) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id} className="text-xs font-bold uppercase tracking-wide text-white/80">
        {label}{required && <span className="ml-1 text-brand-green">*</span>}
      </Label>
      <Input id={id} name={id} type={type} required={required} placeholder={placeholder}
        className="h-11 rounded-lg border-white/15 bg-neutral-950 text-sm font-medium text-white placeholder:text-white/30" />
    </div>
  );
}
