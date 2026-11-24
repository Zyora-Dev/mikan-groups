import type {
  AttachmentKind, ClientVerdict, ProjectStatus, TaskPriority, TaskStatus,
} from "@/lib/api";

export const TASK_STATUS_STYLE: Record<TaskStatus, string> = {
  requested: "border-brand-orange/40 bg-brand-orange/10 text-brand-orange",
  todo: "border-white/25 bg-white/5 text-white/70",
  in_progress: "border-brand-cyan/40 bg-brand-cyan/10 text-brand-cyan",
  in_review: "border-brand-blue/40 bg-brand-blue/10 text-brand-blue",
  submitted: "border-brand-orange/40 bg-brand-orange/10 text-brand-orange",
  done: "border-brand-green/40 bg-brand-green/10 text-brand-green",
};

export const VERDICT_STYLE: Record<ClientVerdict, string> = {
  none: "border-white/15 text-white/40",
  awaiting: "border-brand-orange/40 bg-brand-orange/10 text-brand-orange",
  approved: "border-brand-green/40 bg-brand-green/10 text-brand-green",
  changes_requested: "border-brand-ember/40 bg-brand-ember/10 text-brand-ember",
};

export const PRIORITY_STYLE: Record<TaskPriority, string> = {
  low: "text-white/45",
  normal: "text-white/65",
  high: "text-brand-orange",
  urgent: "text-brand-ember",
};

export const PROJECT_STATUS_STYLE: Record<ProjectStatus, string> = {
  planning: "border-brand-cyan/40 bg-brand-cyan/10 text-brand-cyan",
  active: "border-brand-green/40 bg-brand-green/10 text-brand-green",
  on_hold: "border-brand-orange/40 bg-brand-orange/10 text-brand-orange",
  completed: "border-white/25 bg-white/5 text-white/70",
  cancelled: "border-white/15 text-white/40",
};

export const KIND_STYLE: Record<AttachmentKind, string> = {
  drawing: "text-brand-cyan",
  model: "text-brand-blue",
  markup: "text-brand-ember",
  reference: "text-white/60",
  other: "text-white/50",
};

/** Progress bar colour follows the work state, not the number. */
export function progressTone(status: TaskStatus): string {
  if (status === "done") return "bg-brand-green";
  if (status === "submitted") return "bg-brand-orange";
  if (status === "requested") return "bg-brand-orange/60";
  return "bg-brand-cyan";
}

export function formatDate(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "2-digit", month: "short", year: "numeric",
  });
}

export function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString("en-GB", {
    day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit",
  });
}

/** Days until a deadline; negative when overdue. */
export function daysUntil(iso: string | null): number | null {
  if (!iso) return null;
  const due = new Date(iso);
  due.setHours(0, 0, 0, 0);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Math.round((due.getTime() - today.getTime()) / 86_400_000);
}
