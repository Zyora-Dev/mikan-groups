import type { Metadata } from "next";
import { ClientPage } from "@/components/client-page";
import { TeamShell } from "@/components/team-shell";

export const metadata: Metadata = {
  title: "Client",
  robots: { index: false, follow: false, nocache: true },
};

export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return (
    <TeamShell>
      <ClientPage clientId={id} />
    </TeamShell>
  );
}
