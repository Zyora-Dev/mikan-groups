"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  Download, ExternalLink, FileText, Loader2, Paperclip, Search,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  ATTACHMENT_KIND_LABELS, type AttachmentKind, type PortalFile, api,
} from "@/lib/api";
import { KIND_STYLE, fileSize, formatDateTime, revLabel } from "@/lib/project-ui";
import { cn } from "@/lib/utils";

type Source = "all" | "mikan" | "ours";

export function PortalFiles() {
  const [rows, setRows] = useState<PortalFile[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [kind, setKind] = useState<"all" | AttachmentKind>("all");
  const [source, setSource] = useState<Source>("all");

  useEffect(() => {
    api.portal.files()
      .then(setRows)
      .catch(() => setError("Could not load your files. Please refresh."));
  }, []);

  const shown = useMemo(() => {
    if (!rows) return [];
    const q = search.trim().toLowerCase();
    return rows.filter((f) => {
      if (kind !== "all" && f.kind !== kind) return false;
      if (source === "mikan" && f.from_client) return false;
      if (source === "ours" && !f.from_client) return false;
      if (!q) return true;
      return (
        f.label.toLowerCase().includes(q) ||
        (f.filename ?? "").toLowerCase().includes(q) ||
        f.job_number.toLowerCase().includes(q) ||
        f.project_title.toLowerCase().includes(q) ||
        f.task_title.toLowerCase().includes(q)
      );
    });
  }, [rows, search, kind, source]);

  if (error) {
    return (
      <p className="border-l-2 border-brand-ember bg-brand-ember/5 px-5 py-4 text-sm font-semibold text-brand-ember">
        {error}
      </p>
    );
  }

  if (!rows) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Loader2 className="size-6 animate-spin text-brand-green" />
      </div>
    );
  }

  const kinds = Array.from(new Set(rows.map((f) => f.kind)));

  return (
    <div className="space-y-5">
      <header>
        <h1 className="font-display text-2xl font-700 uppercase leading-none text-white">
          Files
        </h1>
        <p className="mt-2 text-sm font-medium text-white/55">
          Every drawing, model and markup across your projects.
        </p>
      </header>

      {/* filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex flex-wrap gap-1.5">
          {([
            { v: "all", l: "All" },
            { v: "mikan", l: "From Mikan" },
            { v: "ours", l: "From your team" },
          ] as { v: Source; l: string }[]).map((s) => (
            <button key={s.v} type="button" onClick={() => setSource(s.v)}
              className={cn(
                "rounded-full px-3.5 py-1.5 text-xs font-bold transition-colors",
                source === s.v
                  ? "bg-brand-green text-white"
                  : "bg-white/[0.06] text-white/60 hover:bg-white/10 hover:text-white"
              )}>
              {s.l}
            </button>
          ))}
        </div>

        {kinds.length > 1 && (
          <div className="flex flex-wrap gap-1.5">
            <button type="button" onClick={() => setKind("all")}
              className={cn(
                "rounded-full px-3.5 py-1.5 text-xs font-bold transition-colors",
                kind === "all"
                  ? "bg-white/15 text-white"
                  : "bg-white/[0.06] text-white/60 hover:bg-white/10 hover:text-white"
              )}>
              Any type
            </button>
            {kinds.map((k) => (
              <button key={k} type="button" onClick={() => setKind(k)}
                className={cn(
                  "rounded-full px-3.5 py-1.5 text-xs font-bold transition-colors",
                  kind === k
                    ? "bg-white/15 text-white"
                    : "bg-white/[0.06] text-white/60 hover:bg-white/10 hover:text-white"
                )}>
                {ATTACHMENT_KIND_LABELS[k]}
              </button>
            ))}
          </div>
        )}

        <div className="relative ml-auto w-full sm:w-64">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-white/35" />
          <Input value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder="Search files"
            className="h-10 rounded-lg border-white/10 bg-white/[0.04] pl-10 text-sm font-medium text-white placeholder:text-white/35" />
        </div>
      </div>

      {shown.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-xl border border-white/10 bg-neutral-900 px-6 py-16 text-center">
          <Paperclip className="size-7 text-white/20" />
          <p className="text-sm font-bold text-white/70">
            {rows.length === 0 ? "No files yet" : "Nothing matches that"}
          </p>
          <p className="max-w-sm text-xs font-medium leading-relaxed text-white/45">
            {rows.length === 0
              ? "Drawings and models issued to you will appear here."
              : "Try a different filter or search term."}
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-white/10 bg-neutral-900">
          <ul className="divide-y divide-white/[0.06]">
            {shown.map((f) => (
              <li key={f.id}
                className="flex flex-wrap items-center gap-4 px-5 py-4 transition-colors hover:bg-white/[0.03]">
                <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-white/[0.06]">
                  <FileText className="size-4 text-white/50" />
                </span>

                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="truncate text-sm font-bold text-white">{f.label}</p>
                    <span className={cn(
                      "rounded-full border px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide",
                      KIND_STYLE[f.kind]
                    )}>
                      {ATTACHMENT_KIND_LABELS[f.kind]}
                    </span>
                    {f.revision && (
                      <span className="rounded-full border border-white/20 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white/60">
                        {revLabel(f.revision)}
                      </span>
                    )}
                    {f.from_client && (
                      <span className="rounded-full border border-brand-cyan/30 bg-brand-cyan/10 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-brand-cyan">
                        Yours
                      </span>
                    )}
                  </div>

                  <p className="mt-1 truncate text-xs font-medium text-white/45">
                    <Link href={`/portal/projects/${f.project_id}`}
                      className="font-bold text-white/60 hover:text-brand-green hover:underline">
                      {f.job_number}
                    </Link>
                    {" · "}{f.task_title}
                    {f.size_bytes ? ` · ${fileSize(f.size_bytes)}` : ""}
                  </p>
                  <p className="mt-0.5 text-[11px] font-medium text-white/30">
                    {formatDateTime(f.created_at)}
                  </p>
                </div>

                {f.has_file ? (
                  <a href={api.tasks.attachments.downloadUrl(f.id)}
                    className="inline-flex shrink-0 items-center gap-2 rounded-lg border border-white/15 px-3.5 py-2 text-xs font-bold text-white transition-colors hover:border-brand-green/50 hover:bg-brand-green/10">
                    <Download className="size-3.5" /> Download
                  </a>
                ) : f.url ? (
                  <a href={f.url} target="_blank" rel="noreferrer noopener"
                    className="inline-flex shrink-0 items-center gap-2 rounded-lg border border-white/15 px-3.5 py-2 text-xs font-bold text-white transition-colors hover:border-brand-green/50 hover:bg-brand-green/10">
                    <ExternalLink className="size-3.5" /> Open
                  </a>
                ) : null}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
