import type { Metadata } from "next";
import { EmailSettingsPanel } from "@/components/email-settings";
import { TeamShell } from "@/components/team-shell";

export const metadata: Metadata = {
  title: "Email settings",
  robots: { index: false, follow: false, nocache: true },
};

export default function SettingsPage() {
  return (
    <TeamShell>
      <EmailSettingsPanel />
    </TeamShell>
  );
}
