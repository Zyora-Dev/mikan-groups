import { PortalShell } from "@/components/portal-shell";
import { PortalHome } from "@/components/portal-home";

export default function PortalOverviewPage() {
  return (
    <PortalShell>
      <PortalHome />
    </PortalShell>
  );
}
