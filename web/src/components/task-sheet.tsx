"use client";

import { useCallback, useEffect, useState } from "react";
import {
  AlertCircle, CalendarDays, ExternalLink, FileText, Loader2,
  MessageSquare, Paperclip, Plus, Send, ThumbsUp, Trash2, X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";
import {
  ApiError, ATTACHMENT_KIND_LABELS, type Attachment, type AttachmentKind,
  PRIORITY_LABELS, type Task, type TaskComment, TASK_STATUS_LABELS,
  type TaskPriority, type TaskStatus, VERDICT_LABELS, api,
} from "@/lib/api";
import {
  formatDate, formatDateTime, KIND_STYLE, PRIORITY_STYLE, progressTone,
  TASK_STATUS_STYLE, VERDICT_STYLE,
} from "@/lib/project-ui";
import { cn } from "@/lib/utils";

const TEAM_STATUSES: TaskStatus[] = [
  "requested", "todo", "in_progress", "in_review", "submitted", "done",
];

export function TaskSheet({
  task, open, onOpenChange, isClient, onChanged,
}: {
  task: Task | null;
  open: boolean;
  onOpenChange: (o: boolean) => void;
  isClient: boolean;
  onChanged: () => void;
}) {
  const [current, setCurrent] = useState<Task | null>(task);
  const [files, setFiles] = useState<Attachment[]>([]);
  const [comments, setComments] = useState<TaskComment[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [addFile, setAddFile] = useState(false);
  const [verdictNote, setVerdictNote] = useState("");
  const [showVerdict, setShowVerdict] = useState<"approved" | "changes_requested" | null>(null);

  useEffect(() => setCurrent(task), [task]);

  const loadSide = useCallback(async (id: string) => {
    const [f, c] = await Promise.all([
      api.tasks.attachments.list(id).catch(() => []),
      api.tasks.comments.list(id).catch(() => []),
    ]);
    setFiles(f);
    setComments(c);
  }, []);

  useEffect(() => {
    if (open && task) void loadSide(task.id);
  }, [open, task, loadSide]);

  if (!current) return null;
  const t = current;

  async function patch(body: Record<string, unknown>) {
    setBusy(true);
    setError(null);
    try {
      setCurrent(await api.tasks.update(t.id, body));
      onChanged();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not update the task.");
    } finally {
      setBusy(false);
    }
  }

  async function submitVerdict(v: "approved" | "changes_requested") {
    setBusy(true);
    setError(null);
    try {
      setCurrent(await api.tasks.setVerdict(t.id, v, verdictNote.trim() || undefined));
      setVerdictNote("");
      setShowVerdict(null);
      await loadSide(t.id);
      onChanged();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not record the verdict.");
    } finally {
      setBusy(false);
    }
  }

  async function postComment(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const body = String(new FormData(form).get("body") ?? "").trim();
    if (!body) return;
    setBusy(true);
    try {
      const created = await api.tasks.comments.add(t.id, body);
      setComments((c) => [...c, created]);
      form.reset();
      onChanged();
    } catch {
      setError("Could not post the comment.");
    } finally {
      setBusy(false);
    }
  }

  async function attach(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    setBusy(true);
    try {
      const created = await api.tasks.attachments.add(t.id, {
        label: String(fd.get("label") ?? "").trim(),
        url: String(fd.get("url") ?? "").trim(),
        kind: String(fd.get("kind") ?? "drawing"),
        revision: String(fd.get("revision") ?? "").trim() || undefined,
      });
      setFiles((f) => [created, ...f]);
      setAddFile(false);
      onChanged();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not add the file.");
    } finally {
      setBusy(false);
    }
  }

  async function removeFile(id: string) {
    try {
      await api.tasks.attachments.remove(id);
      setFiles((f) => f.filter((x) => x.id !== id));
      onChanged();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not remove the file.");
    }
  }

  const canJudge = isClient && t.status === "submitted";

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right"
        className="w-full overflow-y-auto border-white/10 bg-neutral-900 p-0 text-white sm:max-w-2xl">
        <div className="space-y-6 p-6">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className={cn("border px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide",
                TASK_STATUS_STYLE[t.status])}>
                {TASK_STATUS_LABELS[t.status]}
              </span>
              {t.verdict !== "none" && (
                <span className={cn("border px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide",
                  VERDICT_STYLE[t.verdict])}>
                  {VERDICT_LABELS[t.verdict]}
                </span>
              )}
              {t.raised_by_client && (
                <span className="border border-white/20 px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide text-white/60">
                  Client request
                </span>
              )}
            </div>
            <SheetTitle className="mt-3 font-display text-2xl font-700 uppercase leading-tight text-white">
              {t.title}
            </SheetTitle>
            {t.description && (
              <p className="mt-3 text-sm leading-relaxed text-white/75">{t.description}</p>
            )}
          </div>

          {error && (
            <p role="alert" className="flex items-start gap-2.5 border-l-2 border-brand-ember bg-brand-ember/10 px-4 py-3 text-sm font-semibold text-brand-ember">
              <AlertCircle className="mt-0.5 size-4 shrink-0" />
              <span className="flex-1">{error}</span>
              <button onClick={() => setError(null)} aria-label="Dismiss"><X className="size-4" /></button>
            </p>
          )}

          {/* ---- progress ---- */}
          <div className="border border-white/10 p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wide text-white/60">Progress</span>
              <span className="font-display text-xl font-700 tabular-nums text-white">{t.progress}%</span>
            </div>
            <div className="mt-3 h-2 w-full bg-white/10">
              <div className={cn("h-full transition-all duration-500", progressTone(t.status))}
                style={{ width: `${t.progress}%` }} />
            </div>

            {!isClient && (
              <div className="mt-4 flex flex-wrap gap-2">
                {[0, 25, 50, 75, 100].map((v) => (
                  <button key={v} type="button" disabled={busy}
                    onClick={() => patch({ progress: v })}
                    className={cn(
                      "border px-3 py-1.5 text-xs font-bold tabular-nums transition-colors",
                      t.progress === v
                        ? "border-brand-cyan bg-brand-cyan/15 text-brand-cyan"
                        : "border-white/15 text-white/60 hover:border-white/35 hover:text-white"
                    )}>
                    {v}%
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* ---- meta ---- */}
          <div className="grid gap-px bg-white/10 sm:grid-cols-2">
            <Meta label="Due" value={formatDate(t.due_date)} Icon={CalendarDays} />
            <Meta label="Priority" value={PRIORITY_LABELS[t.priority]}
              className={PRIORITY_STYLE[t.priority]} />
            <Meta label="Submitted" value={t.submitted_at ? formatDateTime(t.submitted_at) : "—"} />
            <Meta label="Completed" value={t.completed_at ? formatDateTime(t.completed_at) : "—"} />
          </div>

          {/* ---- team controls ---- */}
          {!isClient && (
            <div className="grid gap-4 border border-white/10 p-5 sm:grid-cols-2">
              <div className="space-y-2">
                <Label className="text-xs font-bold uppercase tracking-wide text-white/70">Status</Label>
                <Select value={t.status} onValueChange={(v) => patch({ status: v })} disabled={busy}>
                  <SelectTrigger className="h-11 rounded-lg border-white/15 bg-neutral-950 text-sm font-semibold text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="rounded-lg">
                    {TEAM_STATUSES.map((s) => (
                      <SelectItem key={s} value={s} >
                        {TASK_STATUS_LABELS[s]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-bold uppercase tracking-wide text-white/70">Priority</Label>
                <Select value={t.priority} onValueChange={(v) => patch({ priority: v })} disabled={busy}>
                  <SelectTrigger className="h-11 rounded-lg border-white/15 bg-neutral-950 text-sm font-semibold text-white">
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
          )}

          {/* ---- client verdict ---- */}
          {canJudge && (
            <div className="border border-brand-orange/30 bg-brand-orange/5 p-5">
              <p className="text-sm font-bold text-white">This work is ready for your review</p>
              <p className="mt-2 text-sm font-medium text-white/70">
                Approve it, or tell the team what needs to change.
              </p>

              {showVerdict && (
                <Textarea value={verdictNote} onChange={(e) => setVerdictNote(e.target.value)}
                  rows={3} placeholder={showVerdict === "approved" ? "Any note (optional)" : "What needs changing?"}
                  className="mt-4 resize-none rounded-lg border-white/15 bg-neutral-950 text-sm font-medium text-white" />
              )}

              <div className="mt-4 flex flex-wrap gap-2.5">
                {showVerdict === null ? (
                  <>
                    <Button onClick={() => setShowVerdict("approved")} disabled={busy}
                      className="h-11 rounded-lg bg-brand-green px-5 text-sm font-bold text-white hover:bg-brand-green/90">
                      <ThumbsUp className="mr-2 size-4" /> Approve
                    </Button>
                    <Button onClick={() => setShowVerdict("changes_requested")} disabled={busy}
                      variant="outline"
                      className="h-11 rounded-lg border-brand-ember/40 bg-transparent px-5 text-sm font-bold text-brand-ember hover:bg-brand-ember/10">
                      Request changes
                    </Button>
                  </>
                ) : (
                  <>
                    <Button onClick={() => submitVerdict(showVerdict)} disabled={busy}
                      className={cn("h-11 rounded-lg px-5 text-sm font-bold text-white",
                        showVerdict === "approved"
                          ? "bg-brand-green hover:bg-brand-green/90"
                          : "bg-brand-ember hover:bg-brand-ember/90")}>
                      {busy ? <Loader2 className="size-4 animate-spin" />
                            : showVerdict === "approved" ? "Confirm approval" : "Send back"}
                    </Button>
                    <Button onClick={() => { setShowVerdict(null); setVerdictNote(""); }}
                      variant="outline" disabled={busy}
                      className="h-11 rounded-lg border-white/20 bg-transparent px-5 text-sm font-bold text-white hover:bg-white/10">
                      Cancel
                    </Button>
                  </>
                )}
              </div>
            </div>
          )}

          {/* ---- files ---- */}
          <section className="overflow-hidden rounded-xl border border-white/10 bg-neutral-900">
            <div className="flex items-center justify-between border-b border-white/10 p-4">
              <h3 className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-white/70">
                <Paperclip className="size-3.5" /> Files ({files.length})
              </h3>
              <Button onClick={() => setAddFile((v) => !v)} variant="outline"
                className="h-9 rounded-lg border-white/20 bg-transparent px-3 text-xs font-bold text-white hover:bg-white/10">
                <Plus className="mr-1.5 size-3.5" /> {isClient ? "Add markup" : "Add file"}
              </Button>
            </div>

            {addFile && (
              <form onSubmit={attach} className="space-y-3 border-b border-white/10 bg-neutral-950/50 p-4">
                <Input name="label" required placeholder="A-101 Rev C"
                  className="h-11 rounded-lg border-white/15 bg-neutral-950 text-sm font-medium text-white" />
                <Input name="url" required type="url" placeholder="https://cloud.mikan-groups.com/…"
                  className="h-11 rounded-lg border-white/15 bg-neutral-950 text-sm font-medium text-white" />
                <div className="grid gap-3 sm:grid-cols-2">
                  <Select name="kind" defaultValue={isClient ? "markup" : "drawing"}>
                    <SelectTrigger className="h-11 rounded-lg border-white/15 bg-neutral-950 text-sm font-medium text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="rounded-lg">
                      {(Object.keys(ATTACHMENT_KIND_LABELS) as AttachmentKind[]).map((k) => (
                        <SelectItem key={k} value={k} >
                          {ATTACHMENT_KIND_LABELS[k]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Input name="revision" placeholder="Rev C"
                    className="h-11 rounded-lg border-white/15 bg-neutral-950 text-sm font-medium text-white" />
                </div>
                <div className="flex gap-2.5">
                  <Button type="submit" disabled={busy}
                    className="h-10 rounded-lg bg-brand-green px-5 text-xs font-bold text-white hover:bg-brand-green/90">
                    Add
                  </Button>
                  <Button type="button" variant="outline" onClick={() => setAddFile(false)}
                    className="h-10 rounded-lg border-white/20 bg-transparent px-5 text-xs font-bold text-white hover:bg-white/10">
                    Cancel
                  </Button>
                </div>
                <p className="text-xs font-medium text-white/45">
                  Paste a Mikan Cloud link — the file stays where it is.
                </p>
              </form>
            )}

            {files.length === 0 ? (
              <p className="p-5 text-center text-sm font-medium text-white/45">No files yet</p>
            ) : (
              <ul className="divide-y divide-white/10">
                {files.map((f) => (
                  <li key={f.id} className="flex items-center gap-3 p-4">
                    <FileText className={cn("size-4 shrink-0", KIND_STYLE[f.kind])} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-bold text-white">
                        {f.label}
                        {f.revision && <span className="ml-2 font-mono text-xs text-white/55">{f.revision}</span>}
                      </p>
                      <p className="mt-0.5 text-xs font-medium text-white/50">
                        {ATTACHMENT_KIND_LABELS[f.kind]} · {f.from_client ? "From client" : "From Mikan"} · {formatDate(f.created_at)}
                      </p>
                    </div>
                    <a href={f.url} target="_blank" rel="noopener noreferrer"
                      aria-label={`Open ${f.label}`}
                      className="border border-white/15 p-2 text-white/70 transition-colors hover:border-white/35 hover:text-white">
                      <ExternalLink className="size-3.5" />
                    </a>
                    {(!isClient || f.from_client) && (
                      <button onClick={() => removeFile(f.id)} aria-label={`Remove ${f.label}`}
                        className="border border-brand-ember/30 p-2 text-brand-ember transition-colors hover:bg-brand-ember/10">
                        <Trash2 className="size-3.5" />
                      </button>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </section>

          {/* ---- comments ---- */}
          <section className="overflow-hidden rounded-xl border border-white/10 bg-neutral-900">
            <h3 className="flex items-center gap-2 border-b border-white/10 p-4 text-xs font-bold uppercase tracking-wide text-white/70">
              <MessageSquare className="size-3.5" /> Comments ({comments.length})
            </h3>

            {comments.length === 0 ? (
              <p className="p-5 text-center text-sm font-medium text-white/45">No comments yet</p>
            ) : (
              <ul className="divide-y divide-white/10">
                {comments.map((c) => (
                  <li key={c.id} className={cn("p-4", c.is_verdict_note && "bg-brand-ember/5")}>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-sm font-bold text-white">{c.author_name}</span>
                      <span className={cn(
                        "border px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide",
                        c.from_client
                          ? "border-brand-cyan/40 text-brand-cyan"
                          : "border-brand-green/40 text-brand-green"
                      )}>
                        {c.from_client ? "Client" : "Mikan"}
                      </span>
                      {c.is_verdict_note && (
                        <span className="border border-brand-ember/40 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-brand-ember">
                          Verdict
                        </span>
                      )}
                      <span className="ml-auto text-xs font-medium text-white/45">
                        {formatDateTime(c.created_at)}
                      </span>
                    </div>
                    <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-white/85">
                      {c.body}
                    </p>
                  </li>
                ))}
              </ul>
            )}

            <form onSubmit={postComment} className="flex gap-2.5 border-t border-white/10 p-4">
              <Input name="body" required placeholder="Write a comment…" disabled={busy}
                className="h-11 flex-1 rounded-lg border-white/15 bg-neutral-950 text-sm font-medium text-white" />
              <Button type="submit" disabled={busy} aria-label="Post comment"
                className="h-11 w-11 shrink-0 rounded-lg bg-brand-green p-0 text-white hover:bg-brand-green/90">
                {busy ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
              </Button>
            </form>
          </section>
        </div>
      </SheetContent>
    </Sheet>
  );
}

function Meta({
  label, value, Icon, className,
}: {
  label: string; value: string;
  Icon?: React.ComponentType<{ className?: string }>;
  className?: string;
}) {
  return (
    <div className="bg-neutral-900 p-4">
      <p className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wide text-white/50">
        {Icon && <Icon className="size-3" />} {label}
      </p>
      <p className={cn("mt-1 text-sm font-bold text-white", className)}>{value}</p>
    </div>
  );
}
