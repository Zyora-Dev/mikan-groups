import type { Metadata } from "next";
import { ProjectsOverview } from "@/components/projects-overview";
import { TeamShell } from "@/components/team-shell";

export const metadata: Metadata = {
  title: "Projects",
  robots: { index: false, follow: false, nocache: true },
};

export default function ProjectsPage() {
  return (
    <TeamShell>
      <ProjectsOverview />
    </TeamShell>
  );
}
