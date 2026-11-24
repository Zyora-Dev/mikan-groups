"use client";

import { useCallback, useEffect, useState } from "react";
import {
  AlertCircle, Check, Copy, KeyRound, Loader2, Lock, Mail, Trash2, UserPlus,
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
import { ApiError, type ClientUser, api } from "@/lib/api";
import { cn } from "@/lib/utils";

/** Suggests a password the admin can hand over. */
function suggestPassword() {
  const words = ["Harbour", "Girder", "Lattice", "Purlin", "Gusset", "Camber"];
  const w = words[Math.floor(Math.random() * words.length)];
  const n = Math.floor(1000 + Math.random() * 9000);
  return `${w}${n}!`;
}

export function ClientPortalAccess({
  clientId, clientName, contactEmail, onChanged,
}: {
  clientId: string;
  clientName: string;
  contactEmail: string | null;
  onChanged: () => void;
}) {
  const [users, setUsers] = useState<ClientUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [addOpen, setAddOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [password, setPassword] = useState(suggestPassword);
  const [copied, setCopied] = useState(false);
  const [confirmRemove, setConfirmRemove] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setUsers(await api.clients.users.list(clientId));
    } catch {
      setError("Could not load portal users.");
    } finally {
      setLoading(false);
    }
  }, [clientId]);

  useEffect(() => {
    void load();
  }, [load]);

  function openAdd() {
    setPassword(suggestPassword());
    setError(null);
    setCopied(false);
    setAddOpen(true);
  }

  async function copyPassword() {
    try {
      await navigator.clipboard.writeText(password);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard blocked — the field is selectable anyway */
    }
  }

  async function onCreate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    setError(null);
    setBusy(true);
    try {
      const created = await api.clients.users.create(clientId, {
        full_name: String(fd.get("full_name") ?? "").trim(),
        email: String(fd.get("email") ?? "").trim().toLowerCase(),
        password: String(fd.get("password") ?? ""),
        role: String(fd.get("role") ?? "client_admin") as "client_admin" | "client",
        job_title: String(fd.get("job_title") ?? "").trim() || undefined,
      });
      setAddOpen(false);
      setNotice(`${created.full_name} can now sign in at /portal.`);
      await load();
      onChanged();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not grant access.");
    } finally {
      setBusy(false);
    }
  }

  async function toggleActive(u: ClientUser) {
    try {
      await api.clients.users.update(clientId, u.id, { is_active: !u.is_active });
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Update failed.");
    }
  }

  async function remove(u: ClientUser) {
    try {
      await api.clients.users.remove(clientId, u.id);
      setNotice(`${u.full_name} removed.`);
      setConfirmRemove(null);
      await load();
      onChanged();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not remove.");
    }
  }

  async function resetPassword(u: ClientUser) {
    const next = suggestPassword();
    try {
      await api.clients.users.resetPassword(clientId, u.id, next);
      setNotice(`New password for ${u.full_name}: ${next}`);
      await load();
    } catch {
      setError("Could not reset the password.");
    }
  }

  return (
    <section className="overflow-hidden rounded-xl border border-white/10 bg-neutral-900">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 p-6">
        <div>
          <h2 className="font-display text-xl font-700 uppercase leading-tight text-white">
            Portal access
          </h2>
          <p className="mt-1.5 text-sm font-medium text-white/65">
            People at {clientName} who can sign in and see their projects.
          </p>
        </div>
        <Button onClick={openAdd}
          className="h-11 rounded-lg bg-brand-green px-5 font-semibold text-white hover:bg-brand-green/90">
          <UserPlus className="mr-2.5 size-4" /> Grant access
        </Button>
      </div>

      {notice && (
        <div className="flex items-start gap-3 border-b border-white/10 bg-brand-green/10 px-6 py-3.5">
          <Check className="mt-0.5 size-4 shrink-0 text-brand-green" />
          <p className="flex-1 text-sm font-semibold text-white/90">{notice}</p>
          <button onClick={() => setNotice(null)} aria-label="Dismiss"
            className="text-white/45 hover:text-white">×</button>
        </div>
      )}

      {error && (
        <p role="alert" className="flex items-start gap-2.5 border-b border-white/10 bg-brand-ember/10 px-6 py-3.5 text-sm font-semibold text-brand-ember">
          <AlertCircle className="mt-0.5 size-4 shrink-0" /> {error}
        </p>
      )}

      {loading ? (
        <p className="p-8 text-center text-sm font-bold uppercase tracking-wide text-white/45">
          Loading…
        </p>
      ) : users.length === 0 ? (
        <div className="p-10 text-center">
          <Lock className="mx-auto size-7 text-white/25" />
          <p className="mt-4 text-base font-bold text-white">No portal access yet</p>
          <p className="mt-2 text-sm font-medium text-white/55">
            Grant access so {clientName} can track their drawings.
          </p>
        </div>
      ) : (
        <div className="divide-y divide-white/10">
          {users.map((u) => {
            const locked = u.locked_until && new Date(u.locked_until) > new Date();
            return (
              <div key={u.id} className={cn("p-5", !u.is_active && "opacity-55")}>
                <div className="flex flex-wrap items-center gap-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2.5">
                      <p className="font-display text-base font-700 uppercase leading-tight text-white">
                        {u.full_name}
                      </p>
                      <span className={cn(
                        "rounded-full border px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wide",
                        u.role === "client_admin"
                          ? "border-brand-cyan/40 bg-brand-cyan/10 text-brand-cyan"
                          : "border-white/20 text-white/65"
                      )}>
                        {u.role === "client_admin" ? "Client admin" : "Client"}
                      </span>
                      {!u.is_active && (
                        <span className="rounded-full border border-white/20 px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wide text-white/60">
                          Disabled
                        </span>
                      )}
                      {locked && (
                        <span className="rounded-full border border-brand-ember/40 bg-brand-ember/10 px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wide text-brand-ember">
                          Locked
                        </span>
                      )}
                      {u.must_change_password && (
                        <span className="rounded-full border border-white/20 px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wide text-white/60">
                          Password pending
                        </span>
                      )}
                    </div>
                    <p className="mt-1.5 flex items-center gap-2 text-sm font-medium text-white/70">
                      <Mail className="size-3.5 text-white/45" />
                      {u.email}
                      {u.job_title && <span className="text-white/45">· {u.job_title}</span>}
                    </p>
                  </div>

                  <div className="flex gap-2">
                    <Button onClick={() => resetPassword(u)} variant="outline"
                      className="h-9 rounded-lg border-white/20 bg-transparent px-3 text-xs font-bold text-white hover:bg-white/10">
                      <KeyRound className="mr-1.5 size-3.5" /> Reset
                    </Button>
                    <Button onClick={() => toggleActive(u)} variant="outline"
                      className="h-9 rounded-lg border-white/20 bg-transparent px-3 text-xs font-bold text-white hover:bg-white/10">
                      {u.is_active ? "Disable" : "Enable"}
                    </Button>
                    <Button onClick={() => setConfirmRemove(u.id)} variant="outline"
                      aria-label={`Remove ${u.full_name}`}
                      className="h-9 rounded-lg border-brand-ember/40 bg-transparent px-3 text-brand-ember hover:bg-brand-ember/10">
                      <Trash2 className="size-3.5" />
                    </Button>
                  </div>
                </div>

                {confirmRemove === u.id && (
                  <div className="mt-4 flex flex-wrap items-center gap-3 border border-brand-ember/40 bg-brand-ember/10 p-4">
                    <p className="flex-1 text-sm font-semibold text-white">
                      Remove {u.full_name}&apos;s portal access?
                    </p>
                    <Button onClick={() => remove(u)}
                      className="h-9 rounded-lg bg-brand-ember px-4 text-xs font-bold text-white hover:bg-brand-ember/90">
                      Remove
                    </Button>
                    <Button onClick={() => setConfirmRemove(null)} variant="outline"
                      className="h-9 rounded-lg border-white/20 bg-transparent px-4 text-xs font-bold text-white hover:bg-white/10">
                      Cancel
                    </Button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* ---------- Grant access ---------- */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="rounded-xl border-white/10 bg-neutral-900 text-white sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-display text-2xl font-700 uppercase">
              Grant portal access
            </DialogTitle>
            <DialogDescription className="text-sm font-medium text-white/65">
              Send them the email and password below. They will be asked to
              change it when they first sign in.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={onCreate} noValidate className="mt-4 space-y-5">
            <Field id="full_name" label="Full name" required>
              <Input id="full_name" name="full_name" required placeholder="Dale Robertson" disabled={busy}
                className="h-12 rounded-lg border-white/15 bg-neutral-950 text-base font-medium text-white placeholder:text-white/30" />
            </Field>

            <Field id="email" label="Email" required>
              <Input id="email" name="email" type="email" required
                defaultValue={contactEmail ?? ""} placeholder="name@client.com" disabled={busy}
                className="h-12 rounded-lg border-white/15 bg-neutral-950 text-base font-medium text-white placeholder:text-white/30" />
              {contactEmail && (
                <p className="text-xs font-medium text-white/50">
                  Pre-filled from the client contact. Change it if a different
                  person needs access.
                </p>
              )}
            </Field>

            <div className="grid gap-5 sm:grid-cols-2">
              <Field id="role" label="Role" required>
                <Select name="role" defaultValue="client_admin">
                  <SelectTrigger id="role"
                    className="h-12 rounded-lg border-white/15 bg-neutral-950 text-base font-medium text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="rounded-lg">
                    <SelectItem value="client_admin" >Client admin</SelectItem>
                    <SelectItem value="client" >Client</SelectItem>
                  </SelectContent>
                </Select>
              </Field>

              <Field id="job_title" label="Job title">
                <Input id="job_title" name="job_title" placeholder="Document Controller" disabled={busy}
                  className="h-12 rounded-lg border-white/15 bg-neutral-950 text-base font-medium text-white placeholder:text-white/30" />
              </Field>
            </div>

            <Field id="password" label="Temporary password" required>
              <div className="flex gap-2">
                <Input id="password" name="password" required value={password}
                  onChange={(e) => setPassword(e.target.value)} disabled={busy}
                  className="h-12 flex-1 rounded-lg border-white/15 bg-neutral-950 text-base font-medium text-white" />
                <Button type="button" onClick={copyPassword} variant="outline"
                  aria-label="Copy password"
                  className="h-12 w-12 shrink-0 rounded-lg border-white/20 bg-transparent p-0 text-white hover:bg-white/10">
                  {copied ? <Check className="size-4 text-brand-green" /> : <Copy className="size-4" />}
                </Button>
                <Button type="button" onClick={() => setPassword(suggestPassword())} variant="outline"
                  className="h-12 shrink-0 rounded-lg border-white/20 bg-transparent px-3 text-xs font-bold text-white hover:bg-white/10">
                  New
                </Button>
              </div>
            </Field>

            {error && (
              <p role="alert" className="flex items-start gap-2.5 border-l-2 border-brand-ember bg-brand-ember/10 px-4 py-3 text-sm font-semibold text-brand-ember">
                <AlertCircle className="mt-0.5 size-4 shrink-0" /> {error}
              </p>
            )}

            <div className="flex gap-3 pt-2">
              <Button type="submit" disabled={busy}
                className="h-12 flex-1 rounded-lg bg-brand-green font-semibold text-white hover:bg-brand-green/90 disabled:opacity-60">
                {busy ? <>Creating <Loader2 className="ml-2.5 size-4 animate-spin" /></> : "Grant access"}
              </Button>
              <Button type="button" variant="outline" disabled={busy} onClick={() => setAddOpen(false)}
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

function Field({
  id, label, required, children,
}: { id: string; label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id} className="text-xs font-bold uppercase tracking-wide text-white/80">
        {label}{required && <span className="ml-1 text-brand-green">*</span>}
      </Label>
      {children}
    </div>
  );
}
