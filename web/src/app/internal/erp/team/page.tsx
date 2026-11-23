import type { Metadata } from "next";
import { TeamDashboard } from "@/components/team-dashboard";

export const metadata: Metadata = {
  title: "Team Dashboard",
  robots: { index: false, follow: false, nocache: true },
};

export default function TeamPage() {
  return <TeamDashboard />;
}
