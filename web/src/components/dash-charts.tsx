"use client";

import {
  Bar, BarChart, Cell, Pie, PieChart, ResponsiveContainer,
  Tooltip, XAxis, YAxis,
} from "recharts";
import { BarChart3 } from "lucide-react";
import type { DeadlineBand, Slice, TrendPoint } from "@/lib/api";
import { cn } from "@/lib/utils";

const GREEN = "#00A651";
const CYAN = "#29ABE2";
const ORANGE = "#F7941D";
const EMBER = "#F04E23";
const BLUE = "#0072CE";

/** Status colours match the badges used elsewhere. */
const STATUS_COLOUR: Record<string, string> = {
  requested: ORANGE,
  todo: "#64748b",
  in_progress: CYAN,
  in_review: BLUE,
  submitted: ORANGE,
  done: GREEN,
};

function Box({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="border border-white/15 bg-neutral-950 px-3 py-2 shadow-xl">
      <p className="text-[11px] font-bold uppercase tracking-wide text-white/55">{label}</p>
      <div className="mt-1 text-sm font-bold text-white">{value}</div>
    </div>
  );
}

/* -------------------------------------------------- throughput */

export function ThroughputChart({
  data, hasHistory,
}: { data: TrendPoint[]; hasHistory: boolean }) {
  if (!hasHistory) {
    return (
      <div className="flex h-[15rem] flex-col items-center justify-center gap-3 px-6 text-center">
        <BarChart3 className="size-7 text-white/20" />
        <p className="text-sm font-bold text-white/70">Not enough history yet</p>
        <p className="max-w-xs text-xs font-medium leading-relaxed text-white/45">
          Once a few tasks have been created and completed, eight weeks of
          throughput will appear here.
        </p>
      </div>
    );
  }

  return (
    <div className="h-[15rem] px-2 pb-2">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 16, right: 8, left: -18, bottom: 0 }}
          barGap={4}>
          <XAxis dataKey="label" tickLine={false} axisLine={false}
            tick={{ fill: "rgba(255,255,255,0.45)", fontSize: 11, fontWeight: 600 }} />
          <YAxis allowDecimals={false} tickLine={false} axisLine={false} width={34}
            tick={{ fill: "rgba(255,255,255,0.35)", fontSize: 11 }} />
          <Tooltip
            cursor={{ fill: "rgba(255,255,255,0.04)" }}
            content={({ active, payload, label }) =>
              active && payload?.length ? (
                <Box label={`Week of ${label}`} value={
                  <span className="flex gap-4">
                    <span className="text-brand-cyan">{payload[0]?.value} created</span>
                    <span className="text-brand-green">{payload[1]?.value} done</span>
                  </span>
                } />
              ) : null
            } />
          <Bar dataKey="created" fill={CYAN} radius={[3, 3, 0, 0]} maxBarSize={22} />
          <Bar dataKey="completed" fill={GREEN} radius={[3, 3, 0, 0]} maxBarSize={22} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

/* -------------------------------------------------- status mix */

export function StatusDonut({ data }: { data: Slice[] }) {
  const total = data.reduce((n, d) => n + d.value, 0);

  if (!total) {
    return (
      <div className="flex h-[15rem] items-center justify-center">
        <p className="text-sm font-medium text-white/40">No tasks yet</p>
      </div>
    );
  }

  const done = data.find((d) => d.key === "done")?.value ?? 0;
  const pct = Math.round((done / total) * 100);

  return (
    <div className="px-5 pb-4">
      <div className="relative h-40">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={data} dataKey="value" nameKey="label"
              cx="50%" cy="50%" innerRadius={56} outerRadius={82} paddingAngle={2}
              stroke="none" startAngle={90} endAngle={-270}>
              {data.map((d) => (
                <Cell key={d.key} fill={STATUS_COLOUR[d.key] ?? "#64748b"} />
              ))}
            </Pie>
            <Tooltip content={({ active, payload }) =>
              active && payload?.length ? (
                <Box label={String(payload[0].name)}
                  value={`${payload[0].value} task${payload[0].value === 1 ? "" : "s"}`} />
              ) : null
            } />
          </PieChart>
        </ResponsiveContainer>

        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <span className="font-display text-3xl font-700 leading-none tabular-nums text-white">
            {pct}%
          </span>
          <span className="mt-1.5 text-[10px] font-bold uppercase tracking-[0.16em] text-white/45">
            Complete
          </span>
        </div>
      </div>

      <ul className="mt-4 space-y-1.5">
        {data.map((d) => (
          <li key={d.key} className="flex items-center gap-2.5">
            <span className="size-2 shrink-0"
              style={{ background: STATUS_COLOUR[d.key] ?? "#64748b" }} />
            <span className="flex-1 text-xs font-semibold text-white/75">{d.label}</span>
            <span className="text-xs font-bold tabular-nums text-white">{d.value}</span>
            <span className="w-10 text-right text-xs font-medium tabular-nums text-white/40">
              {Math.round((d.value / total) * 100)}%
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/* -------------------------------------------------- deadlines */

const BANDS = [
  { key: "overdue", label: "Overdue", colour: EMBER },
  { key: "today", label: "Due today", colour: ORANGE },
  { key: "this_week", label: "This week", colour: CYAN },
  { key: "later", label: "Later", colour: GREEN },
  { key: "none_set", label: "No deadline", colour: "#475569" },
] as const;

export function DeadlineBars({ data }: { data: DeadlineBand }) {
  const total = BANDS.reduce((n, b) => n + data[b.key], 0);

  if (!total) {
    return (
      <div className="flex h-32 items-center justify-center">
        <p className="text-sm font-medium text-white/40">No open tasks</p>
      </div>
    );
  }

  return (
    <div className="p-5">
      {/* one stacked bar reads faster than five */}
      <div className="flex h-2.5 w-full overflow-hidden">
        {BANDS.map((b) =>
          data[b.key] > 0 ? (
            <div key={b.key} style={{
              width: `${(data[b.key] / total) * 100}%`,
              background: b.colour,
            }} />
          ) : null
        )}
      </div>

      <ul className="mt-5 grid gap-x-6 gap-y-3 sm:grid-cols-2">
        {BANDS.map((b) => (
          <li key={b.key} className={cn("flex items-center gap-2.5",
            data[b.key] === 0 && "opacity-40")}>
            <span className="size-2 shrink-0" style={{ background: b.colour }} />
            <span className="flex-1 text-xs font-semibold text-white/75">{b.label}</span>
            <span className="text-sm font-bold tabular-nums text-white">{data[b.key]}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
