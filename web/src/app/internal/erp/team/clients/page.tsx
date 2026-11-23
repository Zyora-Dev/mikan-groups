import type { Metadata } from "next";
import { ClientList } from "@/components/client-list";
import { TeamShell } from "@/components/team-shell";

export const metadata: Metadata = {
  title: "Clients",
  robots: { index: false, follow: false, nocache: true },
};

export default function ClientsPage() {
  return (
    <TeamShell>
      <ClientList />
    </TeamShell>
  );
}
