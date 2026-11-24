"use client";

import { useCallback, useEffect, useState } from "react";
import { AlertCircle, Loader2, UserMinus, UserPlus, Users } from "lucide-react";
import { AssigneePicker } from "@/components/assignee-picker";
import { Button } from "@/components/ui/button";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  ApiError, PROJECT_ROLE_LABELS, type ProjectMember, type ProjectRole, api,
} from "@/lib/api";
import { initials } from "@/lib/project-ui";
import { cn } from "@/lib/utils";

const ROLE_STYLE: Record<ProjectRole, string> = {
  lead: "border-brand-orange/40 bg-brand-orange/10 text-brand-orange",
  checker: "border-brand-blue/40 bg-brand-blue/10 text-brand-blue",
  engineer: "border-brand-green/40 bg-brand-green/10 text-brand-green",
  detailer: "border-brand-cyan/40 bg-brand-cyan/10 text-brand-cyan",
  coordinator: "border-white/25 bg-white/5 text-white/70",
  support: "border-white/20 bg-transparent text-white/60",
};

export function ProjectTeam({
  projectId, onChanged,
}: { projectId: string; onChanged: () => void }) {
  const [members, setMembers] = useState<ProjectMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [pickUser, setPickUser] = useState<string | null>(null);
  const [pickRole, setPickRole] = useState<ProjectRole>("engineer");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setMembers(await api.projects.members.list(projectId));
    } catch {
      setError("Could not load the team.");
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => { void load(); }, [load]);

  async function add() {
    if (!pickUser) { setError("Choose someone first."); return; }
    setBusy(true);
    setError(null);
    try {
      await api.projects.members.add(projectId, pickUser, pickRole);
      setPickUser(null);
      setPickRole("engineer");
      setAdding(false);
      await load();
      onChanged();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not add them.");
    } finally {
      setBusy(false);
    }
  }

  async function remove(m: ProjectMember) {
    setBusy(true);
    try {
      await api.projects.members.remove(projectId, m.id);
      await load();
      onChanged();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not remove them.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="rounded-xl border border-white/10 bg-neutral-900/60">
      <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
        <h4 className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-white/70">
          <Users className="size-3.5" /> Project team
          <span className="font-display tabular-nums text-white/40">{members.length}</span>
        </h4>
        {!adding && (
          <Button onClick={() => { setAdding(true); setError(null); }}
            variant="outline"
            className="h-8 rounded-lg border-white/20 bg-transparent px-3 text-xs font-bold text-white hover:bg-white/10">
            <UserPlus className="mr-1.5 size-3.5" /> Add member
          </Button>
        )}
      </div>

      {adding && (
        <div className="space-y-3 border-t border-white/[0.07] bg-neutral-950/50 p-4">
          <div className="grid gap-3 sm:grid-cols-[1.4fr_1fr]">
            <AssigneePicker value={pickUser} onChange={setPickUser}
              exclude={members.map((m) => m.user_id)}
              placeholder="Choose a team member" />
            <Select value={pickRole} onValueChange={(v) => setPickRole(v as ProjectRole)}>
              <SelectTrigger aria-label="Project role"
                className="h-11 rounded-lg border-white/15 bg-neutral-950 text-sm font-medium text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="rounded-lg">
                {(Object.keys(PROJECT_ROLE_LABELS) as ProjectRole[]).map((r) => (
                  <SelectItem key={r} value={r}>{PROJECT_ROLE_LABELS[r]}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {pickRole === "lead" && (
            <p className="text-xs font-medium text-white/50">
              A project has one lead — the current lead becomes an engineer.
            </p>
          )}
          <div className="flex gap-2.5">
            <Button onClick={add} disabled={busy || !pickUser}
              className="h-9 rounded-lg bg-brand-green px-4 text-xs font-bold text-white hover:bg-brand-green/90 disabled:opacity-50">
              {busy ? <Loader2 className="size-4 animate-spin" /> : "Add to project"}
            </Button>
            <Button variant="outline" onClick={() => { setAdding(false); setPickUser(null); }}
              className="h-9 rounded-lg border-white/20 bg-transparent px-4 text-xs font-bold text-white hover:bg-white/10">
              Cancel
            </Button>
          </div>
        </div>
      )}

      {error && (
        <p role="alert" className="flex items-center gap-2 border-t border-white/[0.07] bg-brand-ember/10 px-4 py-2.5 text-xs font-semibold text-brand-ember">
          <AlertCircle className="size-3.5 shrink-0" /> {error}
        </p>
      )}

      {loading ? (
        <p className="border-t border-white/[0.07] p-5 text-center text-xs font-medium text-white/40">
          Loading…
        </p>
      ) : members.length === 0 ? (
        <p className="border-t border-white/[0.07] p-5 text-center text-xs font-medium text-white/40">
          Nobody assigned yet.
        </p>
      ) : (
        <ul className="divide-y divide-white/[0.07] border-t border-white/[0.07]">
          {members.map((m) => (
            <li key={m.id} className="flex items-center gap-3 px-4 py-3">
              <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-brand-green/10 text-[10px] font-bold text-brand-green">
                {initials(m.full_name)}
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="truncate text-sm font-bold text-white">
                    {m.full_name}
                  </span>
                  <span className={cn(
                    "rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide",
                    ROLE_STYLE[m.role])}>
                    {PROJECT_ROLE_LABELS[m.role]}
                  </span>
                </div>
                {(m.job_title || m.note) && (
                  <p className="mt-0.5 truncate text-xs font-medium text-white/45">
                    {m.job_title}
                    {m.job_title && m.note && " · "}
                    {m.note}
                  </p>
                )}
              </div>
              <button onClick={() => remove(m)} disabled={busy}
                aria-label={`Remove ${m.full_name} from this project`}
                className="rounded-lg border border-white/10 p-1.5 text-white/40 transition-colors hover:border-brand-ember/40 hover:text-brand-ember">
                <UserMinus className="size-3.5" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
