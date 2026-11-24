"use client";

import { useEffect, useState } from "react";
import { UserX } from "lucide-react";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { type Assignable, api } from "@/lib/api";
import { initials } from "@/lib/project-ui";

const UNASSIGNED = "__none__";

/** Cached across mounts — the staff list rarely changes within a session. */
let cache: Assignable[] | null = null;

export function useAssignable() {
  const [staff, setStaff] = useState<Assignable[]>(cache ?? []);

  useEffect(() => {
    if (cache) return;
    api.team.assignable()
      .then((list) => { cache = list; setStaff(list); })
      .catch(() => {});
  }, []);

  return staff;
}

export function AssigneePicker({
  value, onChange, label, disabled, placeholder = "Unassigned", exclude,
}: {
  value: string | null;
  onChange: (id: string | null) => void;
  label?: string;
  disabled?: boolean;
  placeholder?: string;
  /** Ids to hide — people already chosen elsewhere. */
  exclude?: readonly string[];
}) {
  const all = useAssignable();
  // Keep the current value listed even if excluded, or the Select shows blank.
  const staff = exclude?.length
    ? all.filter((s) => s.id === value || !exclude.includes(s.id))
    : all;

  return (
    <Select
      value={value ?? UNASSIGNED}
      onValueChange={(v) => onChange(v === UNASSIGNED ? null : v)}
      disabled={disabled}
    >
      <SelectTrigger aria-label={label ?? "Assignee"}
        className="h-11 rounded-lg border-white/15 bg-neutral-950 text-sm font-medium text-white">
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent className="rounded-lg">
        <SelectItem value={UNASSIGNED}>
          <span className="flex items-center gap-2.5 text-white/60">
            <UserX className="size-3.5" /> {placeholder}
          </span>
        </SelectItem>
        {staff.map((s) => (
          <SelectItem key={s.id} value={s.id}>
            <span className="flex items-center gap-2.5">
              <span className="flex size-5 items-center justify-center rounded bg-brand-green/15 text-[9px] font-bold text-brand-green">
                {initials(s.full_name)}
              </span>
              {s.full_name}
              {s.job_title && (
                <span className="text-xs text-white/40">· {s.job_title}</span>
              )}
            </span>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

/** Compact read-only display for rows. */
export function AssigneeChip({
  name, role = "Assignee",
}: { name: string | null; role?: string }) {
  if (!name) {
    return (
      <span className="flex items-center gap-1.5 text-xs font-medium text-white/35"
        title={`No ${role.toLowerCase()}`}>
        <UserX className="size-3.5" /> Unassigned
      </span>
    );
  }
  return (
    <span className="flex items-center gap-2 text-xs font-semibold text-white/70"
      title={`${role}: ${name}`}>
      <span className="flex size-5 items-center justify-center rounded bg-brand-green/15 text-[9px] font-bold text-brand-green">
        {initials(name)}
      </span>
      <span className="truncate">{name}</span>
    </span>
  );
}
