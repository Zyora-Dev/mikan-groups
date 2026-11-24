import { PortalShell } from "@/components/portal-shell";
import { PortalProject } from "@/components/portal-project";

export default async function PortalProjectPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return (
    <PortalShell>
      <PortalProject projectId={id} />
    </PortalShell>
  );
}
