import type { Metadata } from "next";
import { TeamHome } from "@/components/team-home";
import { TeamShell } from "@/components/team-shell";

export const metadata: Metadata = {
  title: "Team Dashboard",
  robots: { index: false, follow: false, nocache: true },
};

export default function TeamPage() {
  return (
    <TeamShell>
      <TeamHome />
    </TeamShell>
  );
}
