"use client";

import { useCallback, useEffect, useState } from "react";
import {
  ArrowRight, Building2, CheckCircle2, FileText, History, MessageSquare,
  Search, ThumbsDown, UserPlus, Users,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { AUDIT_LABELS, type AuditAction, type AuditEntry, api } from "@/lib/api";
import { formatDateTime, initials, relativeTime } from "@/lib/project-ui";
import { cn } from "@/lib/utils";

const ICONS: Partial<Record<AuditAction, typeof History>> = {
  approved: CheckCircle2,
  changes_requested: ThumbsDown,
  commented: MessageSquare,
  file_added: FileText,
  file_removed: FileText,
  assigned: UserPlus,
  member_added: Users,
  member_removed: Users,
};

const TONE: Partial<Record<AuditAction, string>> = {
  approved: "text-brand-green",
  changes_requested: "text-brand-ember",
  deleted: "text-brand-ember",
  file_removed: "text-brand-ember",
  member_removed: "text-brand-ember",
  submitted: "text-brand-orange",
  status_changed: "text-brand-cyan",
};

export function AuditLogPanel({
  clientId, projectId, entityId, compact,
}: {
  clientId?: string; projectId?: string; entityId?: string; compact?: boolean;
}) {
  const [entries, setEntries] = useState<AuditEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const load = useCallback(async () => {
    try {
      setEntries(await api.audit({
        client_id: clientId,
        project_id: projectId,
        entity_id: entityId,
        limit: compact ? 15 : 80,
      }));
    } catch {
      /* permissions or offline */
    } finally {
      setLoading(false);
    }
  }, [clientId, projectId, entityId, compact]);

  useEffect(() => { void load(); }, [load]);

  const term = search.trim().toLowerCase();
  const shown = term
    ? entries.filter((e) =>
        e.entity_label.toLowerCase().includes(term) ||
        e.actor_name.toLowerCase().includes(term) ||
        (e.client_name ?? "").toLowerCase().includes(term))
    : entries;

  return (
    <section className="overflow-hidden rounded-xl border border-white/10 bg-neutral-900">
      <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-4">
        <h2 className="flex items-center gap-2.5 text-sm font-bold text-white">
          <History className="size-4 text-white/45" />
          {compact ? "History" : "Audit log"}
          <span className="font-display tabular-nums text-white/40">{entries.length}</span>
        </h2>
        {!compact && (
          <div className="relative min-w-[14rem] flex-1 sm:max-w-xs">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-white/35" />
            <Input value={search} onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by task, person or client"
              className="h-10 rounded-lg border-white/10 bg-neutral-950 pl-10 text-sm font-medium text-white placeholder:text-white/30" />
          </div>
        )}
      </div>

      {loading ? (
        <div className="divide-y divide-white/[0.07] border-t border-white/[0.07]">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-16 animate-pulse bg-white/[0.02]" />
          ))}
        </div>
      ) : shown.length === 0 ? (
        <div className="border-t border-white/[0.07] p-12 text-center">
          <History className="mx-auto size-7 text-white/20" />
          <p className="mt-3 text-sm font-medium text-white/45">
            {term ? "Nothing matches" : "Nothing recorded yet"}
          </p>
        </div>
      ) : (
        <ul className="divide-y divide-white/[0.07] border-t border-white/[0.07]">
          {shown.map((e) => {
            const Icon = ICONS[e.action] ?? History;
            const tone = TONE[e.action] ?? "text-white/35";
            return (
              <li key={e.id} className="flex gap-3.5 px-5 py-3.5">
                <span className={cn(
                  "flex size-8 shrink-0 items-center justify-center rounded-lg border text-[10px] font-bold",
                  e.actor_is_client
                    ? "border-brand-cyan/30 bg-brand-cyan/10 text-brand-cyan"
                    : "border-brand-green/30 bg-brand-green/10 text-brand-green"
                )}>
                  {initials(e.actor_name)}
                </span>

                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-baseline gap-x-2">
                    <span className="text-sm font-bold text-white">{e.actor_name}</span>
                    <span className={cn("flex items-center gap-1.5 text-xs font-bold", tone)}>
                      <Icon className="size-3" /> {AUDIT_LABELS[e.action]}
                    </span>
                    <span className="ml-auto text-xs font-medium text-white/40"
                      title={formatDateTime(e.created_at)}>
                      {relativeTime(e.created_at)}
                    </span>
                  </div>

                  <p className="mt-1 truncate text-sm font-medium text-white/80">
                    {e.entity_label}
                  </p>

                  {(e.old_value || e.new_value) && (
                    <p className="mt-1 flex flex-wrap items-center gap-1.5 text-xs font-semibold">
                      {e.old_value && (
                        <span className="rounded border border-white/10 px-1.5 py-0.5 text-white/45 line-through">
                          {e.old_value.replace(/_/g, " ")}
                        </span>
                      )}
                      {e.old_value && e.new_value && (
                        <ArrowRight className="size-3 text-white/30" />
                      )}
                      {e.new_value && (
                        <span className={cn("rounded border px-1.5 py-0.5", tone,
                          "border-current/30")}>
                          {e.new_value.replace(/_/g, " ")}
                        </span>
                      )}
                    </p>
                  )}

                  {e.detail && (
                    <p className="mt-1 line-clamp-2 text-xs font-medium italic text-white/50">
                      &ldquo;{e.detail}&rdquo;
                    </p>
                  )}

                  {!clientId && e.client_name && (
                    <p className="mt-1 flex items-center gap-1.5 text-xs font-medium text-white/35">
                      <Building2 className="size-3" /> {e.client_name}
                    </p>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
