import type { Metadata } from "next";
import { TeamMembers } from "@/components/team-members";
import { TeamShell } from "@/components/team-shell";

export const metadata: Metadata = {
  title: "Team Members",
  robots: { index: false, follow: false, nocache: true },
};

export default function MembersPage() {
  return (
    <TeamShell>
      <TeamMembers />
    </TeamShell>
  );
}
