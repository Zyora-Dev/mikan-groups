"use client";

import { useEffect, useState } from "react";
import {
  AlertCircle, Ban, Building2, CheckCircle2, ClipboardList, Copy, FolderKanban,
  KeyRound, Loader2, Lock, Mail, Pencil, Phone, ShieldCheck, Trash2, X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { ApiError, type MemberDetail, api } from "@/lib/api";
import { formatDate, initials } from "@/lib/project-ui";
import { cn } from "@/lib/utils";

function suggestPassword() {
  const w = ["Girder", "Lattice", "Purlin", "Gusset", "Camber", "Haunch"];
  return `${w[Math.floor(Math.random() * w.length)]}${Math.floor(1000 + Math.random() * 9000)}!`;
}

export function MemberSheet({
  memberId, open, onOpenChange, onChanged, isSelf,
}: {
  memberId: string | null;
  open: boolean;
  onOpenChange: (o: boolean) => void;
  onChanged: (message?: string) => void;
  isSelf: boolean;
}) {
  const [member, setMember] = useState<MemberDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [editing, setEditing] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [pwOpen, setPwOpen] = useState(false);
  const [newPw, setNewPw] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!open || !memberId) return;
    setLoading(true);
    setEditing(false);
    setConfirmDelete(false);
    setPwOpen(false);
    setError(null);
    setNotice(null);
    api.team.get(memberId)
      .then(setMember)
      .catch(() => setError("Could not load this member."))
      .finally(() => setLoading(false));
  }, [open, memberId]);

  async function refresh() {
    if (!memberId) return;
    setMember(await api.team.get(memberId));
    onChanged();
  }

  async function patch(body: Record<string, unknown>, message?: string) {
    if (!member) return;
    setBusy(true);
    setError(null);
    try {
      await api.team.update(member.id, body);
      await refresh();
      if (message) setNotice(message);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not update.");
    } finally {
      setBusy(false);
    }
  }

  async function onSave(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    await patch({
      full_name: String(fd.get("full_name") ?? "").trim(),
      job_title: String(fd.get("job_title") ?? "").trim() || undefined,
      role: fd.get("role"),
    }, "Details updated.");
    setEditing(false);
  }

  async function savePassword() {
    if (!member) return;
    if (newPw.length < 10) { setError("Password must be at least 10 characters."); return; }
    setBusy(true);
    try {
      await api.team.resetPassword(member.id, newPw);
      setPwOpen(false);
      setNotice(`New password for ${member.full_name}: ${newPw}`);
      setNewPw("");
      await refresh();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not set the password.");
    } finally {
      setBusy(false);
    }
  }

  async function onDelete() {
    if (!member) return;
    setBusy(true);
    try {
      await api.team.remove(member.id);
      onOpenChange(false);
      onChanged(`${member.full_name} removed.`);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not delete.");
      setConfirmDelete(false);
    } finally {
      setBusy(false);
    }
  }

  const locked = member?.locked_until && new Date(member.locked_until) > new Date();

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right"
        className="w-full overflow-y-auto border-white/10 bg-neutral-900 p-0 text-white sm:max-w-xl">
        {loading || !member ? (
          <div className="flex h-full items-center justify-center">
            <p className="text-sm font-bold uppercase tracking-wide text-white/45">
              {error ?? "Loading…"}
            </p>
          </div>
        ) : (
          <div className="space-y-5 p-6">
            {/* ---- header ---- */}
            <div className="flex items-start gap-4">
              <span className={cn(
                "flex size-14 shrink-0 items-center justify-center rounded-xl text-sm font-bold",
                member.is_active
                  ? "bg-brand-green/10 text-brand-green"
                  : "bg-white/[0.06] text-white/45"
              )}>
                {initials(member.full_name)}
              </span>
              <div className="min-w-0 flex-1">
                <SheetTitle className="font-display text-2xl font-700 uppercase leading-tight text-white">
                  {member.full_name}
                </SheetTitle>
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <span className={cn(
                    "rounded-full border px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wide",
                    member.role === "admin"
                      ? "border-brand-orange/40 bg-brand-orange/10 text-brand-orange"
                      : "border-brand-green/40 bg-brand-green/10 text-brand-green"
                  )}>
                    {member.role}
                  </span>
                  {!member.is_active && (
                    <span className="rounded-full border border-white/20 px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wide text-white/60">
                      Blocked
                    </span>
                  )}
                  {locked && (
                    <span className="flex items-center gap-1.5 rounded-full border border-brand-ember/40 bg-brand-ember/10 px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wide text-brand-ember">
                      <Lock className="size-3" /> Locked out
                    </span>
                  )}
                  {member.must_change_password && (
                    <span className="rounded-full border border-white/20 px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wide text-white/60">
                      Password pending
                    </span>
                  )}
                </div>
              </div>
            </div>

            {notice && (
              <div className="flex items-start gap-3 rounded-lg border border-brand-green/30 bg-brand-green/[0.07] px-4 py-3">
                <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-brand-green" />
                <p className="flex-1 text-sm font-semibold text-white/90">{notice}</p>
                <button onClick={() => setNotice(null)} aria-label="Dismiss"
                  className="text-white/40 hover:text-white"><X className="size-4" /></button>
              </div>
            )}
            {error && (
              <p role="alert" className="flex items-start gap-2.5 rounded-lg border border-brand-ember/30 bg-brand-ember/[0.07] px-4 py-3 text-sm font-semibold text-brand-ember">
                <AlertCircle className="mt-0.5 size-4 shrink-0" />
                <span className="flex-1">{error}</span>
                <button onClick={() => setError(null)} aria-label="Dismiss"><X className="size-4" /></button>
              </p>
            )}

            {/* ---- workload ---- */}
            <div className="grid grid-cols-2 gap-px overflow-hidden rounded-xl border border-white/10 bg-white/[0.07] sm:grid-cols-4">
              <Stat Icon={FolderKanban} label="Projects led" value={member.workload.projects_led} />
              <Stat Icon={ClipboardList} label="Tasks open" value={member.workload.tasks_assigned} />
              <Stat Icon={ShieldCheck} label="To check" value={member.workload.tasks_checking} />
              <Stat Icon={AlertCircle} label="Overdue" value={member.workload.tasks_overdue}
                tone={member.workload.tasks_overdue > 0 ? "danger" : undefined} />
            </div>

            {member.workload.clients.length > 0 && (
              <div className="rounded-xl border border-white/10 p-5">
                <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-white/60">
                  <Building2 className="size-3.5" /> Working with
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {member.workload.clients.map((c) => (
                    <span key={c} className="rounded-full border border-white/15 bg-white/[0.04] px-3 py-1 text-xs font-semibold text-white/80">
                      {c}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* ---- details ---- */}
            {editing ? (
              <form onSubmit={onSave} className="space-y-4 rounded-xl border border-white/10 p-5">
                <div className="space-y-2">
                  <Label htmlFor="full_name" className="text-xs font-bold uppercase tracking-wide text-white/70">
                    Full name
                  </Label>
                  <Input id="full_name" name="full_name" required defaultValue={member.full_name}
                    className="h-11 rounded-lg border-white/15 bg-neutral-950 text-sm font-medium text-white" />
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="job_title" className="text-xs font-bold uppercase tracking-wide text-white/70">
                      Job title
                    </Label>
                    <Input id="job_title" name="job_title" defaultValue={member.job_title ?? ""}
                      className="h-11 rounded-lg border-white/15 bg-neutral-950 text-sm font-medium text-white" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="role" className="text-xs font-bold uppercase tracking-wide text-white/70">
                      Role
                    </Label>
                    <Select name="role" defaultValue={member.role} disabled={isSelf}>
                      <SelectTrigger id="role"
                        className="h-11 rounded-lg border-white/15 bg-neutral-950 text-sm font-medium text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="rounded-lg">
                        <SelectItem value="engineer">Engineer</SelectItem>
                        <SelectItem value="admin">Administrator</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="flex gap-2.5 pt-1">
                  <Button type="submit" disabled={busy}
                    className="h-10 rounded-lg bg-brand-green px-5 text-xs font-bold text-white hover:bg-brand-green/90">
                    {busy ? <Loader2 className="size-4 animate-spin" /> : "Save"}
                  </Button>
                  <Button type="button" variant="outline" onClick={() => setEditing(false)}
                    className="h-10 rounded-lg border-white/20 bg-transparent px-5 text-xs font-bold text-white hover:bg-white/10">
                    Cancel
                  </Button>
                </div>
              </form>
            ) : (
              <div className="rounded-xl border border-white/10">
                <div className="flex items-center justify-between px-5 py-3.5">
                  <p className="text-sm font-bold text-white">Account</p>
                  <Button onClick={() => setEditing(true)} variant="outline"
                    className="h-9 rounded-lg border-white/20 bg-transparent px-3.5 text-xs font-bold text-white hover:bg-white/10">
                    <Pencil className="mr-2 size-3.5" /> Edit
                  </Button>
                </div>
                <dl className="divide-y divide-white/[0.07] border-t border-white/[0.07]">
                  <Row Icon={Mail} label="Email" value={member.email} />
                  {member.job_title && <Row label="Job title" value={member.job_title} />}
                  {member.phone && <Row Icon={Phone} label="Phone" value={member.phone} />}
                  <Row label="Last sign-in"
                    value={member.last_login_at ? formatDate(member.last_login_at) : "Never"} />
                  <Row label="Added" value={formatDate(member.created_at)} />
                </dl>
              </div>
            )}

            {/* ---- password ---- */}
            <div className="rounded-xl border border-white/10 p-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-bold text-white">Password</p>
                  <p className="mt-1 text-xs font-medium text-white/50">
                    Set a new one and pass it on. They&apos;ll be asked to change it.
                  </p>
                </div>
                {!pwOpen && (
                  <Button onClick={() => { setNewPw(suggestPassword()); setPwOpen(true); }}
                    variant="outline"
                    className="h-9 rounded-lg border-white/20 bg-transparent px-3.5 text-xs font-bold text-white hover:bg-white/10">
                    <KeyRound className="mr-2 size-3.5" /> Change password
                  </Button>
                )}
              </div>

              {pwOpen && (
                <div className="mt-4 space-y-3">
                  <div className="flex gap-2">
                    <Input value={newPw} onChange={(e) => setNewPw(e.target.value)}
                      className="h-11 flex-1 rounded-lg border-white/15 bg-neutral-950 text-sm font-medium text-white" />
                    <Button type="button" variant="outline" aria-label="Copy password"
                      onClick={async () => {
                        try { await navigator.clipboard.writeText(newPw); setCopied(true);
                          setTimeout(() => setCopied(false), 2000); } catch { /* blocked */ }
                      }}
                      className="h-11 w-11 shrink-0 rounded-lg border-white/20 bg-transparent p-0 text-white hover:bg-white/10">
                      {copied ? <CheckCircle2 className="size-4 text-brand-green" /> : <Copy className="size-4" />}
                    </Button>
                    <Button type="button" variant="outline" onClick={() => setNewPw(suggestPassword())}
                      className="h-11 shrink-0 rounded-lg border-white/20 bg-transparent px-3 text-xs font-bold text-white hover:bg-white/10">
                      New
                    </Button>
                  </div>
                  <div className="flex gap-2.5">
                    <Button onClick={savePassword} disabled={busy}
                      className="h-10 rounded-lg bg-brand-green px-5 text-xs font-bold text-white hover:bg-brand-green/90">
                      {busy ? <Loader2 className="size-4 animate-spin" /> : "Set password"}
                    </Button>
                    <Button variant="outline" onClick={() => setPwOpen(false)}
                      className="h-10 rounded-lg border-white/20 bg-transparent px-5 text-xs font-bold text-white hover:bg-white/10">
                      Cancel
                    </Button>
                  </div>
                </div>
              )}
            </div>

            {/* ---- access ---- */}
            <div className="space-y-3 rounded-xl border border-white/10 p-5">
              <p className="text-sm font-bold text-white">Access</p>

              {locked && (
                <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-brand-ember/30 bg-brand-ember/[0.07] p-3.5">
                  <p className="text-xs font-semibold text-brand-ember">
                    Locked after failed sign-ins
                  </p>
                  <Button onClick={() => api.team.unlock(member.id).then(refresh)}
                    className="h-9 rounded-lg bg-brand-ember px-4 text-xs font-bold text-white hover:bg-brand-ember/90">
                    Unlock now
                  </Button>
                </div>
              )}

              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="text-xs font-medium text-white/60">
                  {member.is_active
                    ? "This account can sign in."
                    : "Blocked — sign-in is refused, history is kept."}
                </p>
                <Button
                  onClick={() => patch({ is_active: !member.is_active },
                    member.is_active ? "Account blocked." : "Account unblocked.")}
                  disabled={busy || isSelf}
                  variant="outline"
                  className={cn(
                    "h-9 rounded-lg bg-transparent px-4 text-xs font-bold",
                    member.is_active
                      ? "border-brand-orange/40 text-brand-orange hover:bg-brand-orange/10"
                      : "border-brand-green/40 text-brand-green hover:bg-brand-green/10"
                  )}>
                  <Ban className="mr-2 size-3.5" />
                  {member.is_active ? "Block account" : "Unblock"}
                </Button>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3 border-t border-white/[0.07] pt-3">
                <p className="text-xs font-medium text-white/60">
                  Delete permanently. Only possible once they hold no work.
                </p>
                <Button onClick={() => setConfirmDelete(true)} disabled={busy || isSelf}
                  variant="outline"
                  className="h-9 rounded-lg border-brand-ember/40 bg-transparent px-4 text-xs font-bold text-brand-ember hover:bg-brand-ember/10">
                  <Trash2 className="mr-2 size-3.5" /> Delete
                </Button>
              </div>

              {confirmDelete && (
                <div className="rounded-lg border border-brand-ember/40 bg-brand-ember/10 p-4">
                  <p className="text-sm font-bold text-white">
                    Delete {member.full_name}?
                  </p>
                  <p className="mt-1.5 text-xs font-medium text-white/70">
                    This cannot be undone. Blocking keeps their history instead.
                  </p>
                  <div className="mt-3 flex gap-2.5">
                    <Button onClick={onDelete} disabled={busy}
                      className="h-9 rounded-lg bg-brand-ember px-4 text-xs font-bold text-white hover:bg-brand-ember/90">
                      {busy ? <Loader2 className="size-4 animate-spin" /> : "Yes, delete"}
                    </Button>
                    <Button variant="outline" onClick={() => setConfirmDelete(false)}
                      className="h-9 rounded-lg border-white/20 bg-transparent px-4 text-xs font-bold text-white hover:bg-white/10">
                      Cancel
                    </Button>
                  </div>
                </div>
              )}

              {isSelf && (
                <p className="text-xs font-medium text-white/40">
                  You can&apos;t block or delete your own account.
                </p>
              )}
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}

function Stat({
  Icon, label, value, tone,
}: {
  Icon: React.ComponentType<{ className?: string }>;
  label: string; value: number; tone?: "danger";
}) {
  const hot = tone === "danger" && value > 0;
  return (
    <div className="bg-neutral-900 p-4">
      <Icon className={cn("size-4", hot ? "text-brand-ember" : "text-white/35")} />
      <p className={cn("mt-3 font-display text-2xl font-700 leading-none tabular-nums",
        hot ? "text-brand-ember" : "text-white")}>
        {value}
      </p>
      <p className="mt-1.5 text-[11px] font-bold uppercase tracking-wide text-white/50">
        {label}
      </p>
    </div>
  );
}

function Row({
  Icon, label, value,
}: {
  Icon?: React.ComponentType<{ className?: string }>;
  label: string; value: string;
}) {
  return (
    <div className="flex gap-4 px-5 py-3">
      <dt className="flex w-32 shrink-0 items-center gap-2 text-sm font-medium text-white/45">
        {Icon && <Icon className="size-3.5" />} {label}
      </dt>
      <dd className="min-w-0 flex-1 truncate text-sm font-semibold text-white/90">{value}</dd>
    </div>
  );
}
