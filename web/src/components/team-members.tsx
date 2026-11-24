"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import {
  AlertCircle, Check, ChevronRight, KeyRound, Loader2, Lock, Plus, ShieldCheck,
  UserPlus, X,
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
import { MemberSheet } from "@/components/member-sheet";
import { ApiError, type Session, type TeamMember, api } from "@/lib/api";
import { initials } from "@/lib/project-ui";
import { cn } from "@/lib/utils";

function fmt(iso: string | null) {
  if (!iso) return "Never";
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "2-digit", month: "short", year: "numeric",
  });
}

export function TeamMembers() {
  const router = useRouter();
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [addOpen, setAddOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [openId, setOpenId] = useState<string | null>(null);
  const [session, setSession] = useState<Session | null>(null);

  const load = useCallback(async () => {
    try {
      setMembers(await api.team.list());
    } catch (err) {
      if (err instanceof ApiError && (err.status === 401 || err.status === 403)) {
        router.replace("/internal/erp/team/login");
        return;
      }
      setNotice("Could not load team members.");
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    void load();
    api.me().then(setSession).catch(() => {});
  }, [load]);

  async function onCreate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const password = String(fd.get("password") ?? "");

    if (password.length < 10) {
      setFormError("Password must be at least 10 characters.");
      return;
    }

    setFormError(null);
    setBusy(true);
    try {
      const created = await api.team.create({
        full_name: String(fd.get("full_name") ?? "").trim(),
        email: String(fd.get("email") ?? "").trim().toLowerCase(),
        password,
        role: String(fd.get("role") ?? "engineer") as "admin" | "engineer",
        job_title: String(fd.get("job_title") ?? "").trim() || undefined,
      });
      setAddOpen(false);
      setNotice(`${created.full_name} added. They must change this password at first sign-in.`);
      await load();
    } catch (err) {
      setFormError(err instanceof ApiError ? err.message : "Could not create the account.");
    } finally {
      setBusy(false);
    }
  }



  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-5">
        <div>
          <h1 className="font-display text-3xl font-700 uppercase leading-none text-white">
            Team members
          </h1>
          <p className="mt-3 text-base font-medium text-white/65">
            Mikan staff accounts. Engineers issue and check drawings;
            administrators also manage users.
          </p>
        </div>
        <Button
          onClick={() => { setFormError(null); setAddOpen(true); }}
          className="group h-12 rounded-lg bg-brand-green px-6 font-semibold text-white hover:bg-brand-green/90"
        >
          <UserPlus className="mr-2.5 size-4" /> Add member
        </Button>
      </div>

      {notice && (
        <div className="mt-7 flex items-start gap-3 border-l-2 border-brand-green bg-brand-green/10 px-4 py-3">
          <Check className="mt-0.5 size-4 shrink-0 text-brand-green" />
          <p className="flex-1 text-sm font-semibold text-white/90">{notice}</p>
          <button onClick={() => setNotice(null)} aria-label="Dismiss"
            className="text-white/45 transition-colors hover:text-white">
            <X className="size-4" />
          </button>
        </div>
      )}

      <div className="mt-8 overflow-hidden rounded-xl border border-white/10 bg-neutral-900">
        {loading ? (
          <p className="p-10 text-center text-sm font-bold uppercase tracking-wide text-white/45">
            Loading…
          </p>
        ) : members.length === 0 ? (
          <div className="p-12 text-center">
            <Plus className="mx-auto size-8 text-white/25" />
            <p className="mt-4 text-base font-bold text-white">No team members yet</p>
          </div>
        ) : (
          <ul className="divide-y divide-white/[0.07] border-t border-white/[0.07]">
            {members.map((m) => {
              const locked = m.locked_until && new Date(m.locked_until) > new Date();
              return (
                <li key={m.id}>
                  <button type="button" onClick={() => setOpenId(m.id)}
                    className={cn(
                      "group grid w-full grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-4 px-4 py-3.5 text-left transition-colors hover:bg-white/[0.04] sm:gap-6",
                      !m.is_active && "opacity-55"
                    )}>
                    <span className={cn(
                      "flex size-10 shrink-0 items-center justify-center rounded-lg text-xs font-bold",
                      m.is_active ? "bg-brand-green/10 text-brand-green" : "bg-white/[0.06] text-white/45"
                    )}>
                      {initials(m.full_name)}
                    </span>

                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="truncate text-sm font-bold text-white transition-colors group-hover:text-brand-green">
                          {m.full_name}
                        </span>
                        <span className={cn(
                          "rounded-full border px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide",
                          m.role === "admin"
                            ? "border-brand-orange/40 bg-brand-orange/10 text-brand-orange"
                            : "border-brand-green/40 bg-brand-green/10 text-brand-green"
                        )}>
                          {m.role}
                        </span>
                        {!m.is_active && (
                          <span className="rounded-full border border-white/20 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white/55">
                            Blocked
                          </span>
                        )}
                        {locked && (
                          <span className="flex items-center gap-1 rounded-full border border-brand-ember/40 bg-brand-ember/10 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-brand-ember">
                            <Lock className="size-3" /> Locked
                          </span>
                        )}
                        {m.must_change_password && (
                          <span className="flex items-center gap-1 rounded-full border border-white/20 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white/55">
                            <KeyRound className="size-3" /> Pending
                          </span>
                        )}
                      </div>
                      <p className="mt-1 truncate text-xs font-medium text-white/45">
                        {m.email}
                        {m.job_title && ` · ${m.job_title}`}
                      </p>
                    </div>

                    <div className="flex items-center gap-4">
                      <div className="hidden text-right sm:block">
                        <p className="text-[10px] font-bold uppercase tracking-wide text-white/35">
                          Last sign-in
                        </p>
                        <p className="mt-0.5 text-xs font-semibold tabular-nums text-white/70">
                          {fmt(m.last_login_at)}
                        </p>
                      </div>
                      <ChevronRight className="size-4 text-white/25 transition-all group-hover:translate-x-0.5 group-hover:text-white/60" />
                    </div>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      <MemberSheet
        memberId={openId}
        open={openId !== null}
        onOpenChange={(o) => !o && setOpenId(null)}
        isSelf={openId === session?.user.id}
        onChanged={(msg) => { if (msg) setNotice(msg); void load(); }}
      />

      {/* ---------- Add member ---------- */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="rounded-xl border-white/10 bg-neutral-900 text-white sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-display text-2xl font-700 uppercase">
              Add team member
            </DialogTitle>
            <DialogDescription className="text-sm font-medium text-white/65">
              You set the first password. They will be asked to change it when
              they sign in.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={onCreate} noValidate className="mt-4 space-y-5">
            <Field id="full_name" label="Full name" required>
              <Input id="full_name" name="full_name" placeholder="Anvanto Joseph" disabled={busy}
                className="h-12 rounded-lg border-white/15 bg-neutral-950 text-base font-medium text-white placeholder:text-white/30" />
            </Field>

            <Field id="email" label="Email" required>
              <Input id="email" name="email" type="email" placeholder="name@mikan-groups.com" disabled={busy}
                className="h-12 rounded-lg border-white/15 bg-neutral-950 text-base font-medium text-white placeholder:text-white/30" />
            </Field>

            <div className="grid gap-5 sm:grid-cols-2">
              <Field id="role" label="Role" required>
                <Select name="role" defaultValue="engineer">
                  <SelectTrigger id="role"
                    className="h-12 rounded-lg border-white/15 bg-neutral-950 text-base font-medium text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="rounded-lg">
                    <SelectItem value="engineer" >Engineer</SelectItem>
                    <SelectItem value="admin" >Administrator</SelectItem>
                  </SelectContent>
                </Select>
              </Field>

              <Field id="job_title" label="Job title">
                <Input id="job_title" name="job_title" placeholder="Steel Detailer" disabled={busy}
                  className="h-12 rounded-lg border-white/15 bg-neutral-950 text-base font-medium text-white placeholder:text-white/30" />
              </Field>
            </div>

            <Field id="password" label="Temporary password" required>
              <Input id="password" name="password" type="text" autoComplete="new-password"
                placeholder="At least 10 characters" disabled={busy}
                className="h-12 rounded-lg border-white/15 bg-neutral-950 text-base font-medium text-white placeholder:text-white/30" />
              <p className="text-xs font-medium text-white/50">
                Shown in plain text so you can pass it on. Mix letters with
                numbers or symbols.
              </p>
            </Field>

            {formError && (
              <p role="alert" className="flex items-start gap-2.5 border-l-2 border-brand-ember bg-brand-ember/10 px-4 py-3 text-sm font-semibold text-brand-ember">
                <AlertCircle className="mt-0.5 size-4 shrink-0" />
                {formError}
              </p>
            )}

            <div className="flex gap-3 pt-2">
              <Button type="submit" disabled={busy}
                className="h-12 flex-1 rounded-lg bg-brand-green font-semibold text-white hover:bg-brand-green/90 disabled:opacity-60">
                {busy ? (<>Creating <Loader2 className="ml-2.5 size-4 animate-spin" /></>)
                      : (<><ShieldCheck className="mr-2.5 size-4" /> Create account</>)}
              </Button>
              <Button type="button" variant="outline" disabled={busy}
                onClick={() => setAddOpen(false)}
                className="h-12 rounded-lg border-white/20 bg-transparent px-6 font-semibold text-white hover:bg-white/10">
                Cancel
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
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
