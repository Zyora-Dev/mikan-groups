import type { Metadata } from "next";
import { AuditLogPanel } from "@/components/audit-log";
import { TeamShell } from "@/components/team-shell";

export const metadata: Metadata = {
  title: "Audit log",
  robots: { index: false, follow: false, nocache: true },
};

export default function AuditPage() {
  return (
    <TeamShell>
      <div className="space-y-6">
        <header>
          <h1 className="font-display text-3xl font-700 uppercase leading-none text-white">
            Audit log
          </h1>
          <p className="mt-2.5 text-sm font-medium text-white/55">
            Who did what, and when. Rows are never edited or removed.
          </p>
        </header>
        <AuditLogPanel />
      </div>
    </TeamShell>
  );
}
