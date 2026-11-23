import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Client Portal",
  description: "Sign in to the Mikan client portal to track drawings, revisions and project status.",
  robots: { index: false, follow: false },
};

/** Standalone shell — the marketing header and footer are intentionally absent. */
export default function PortalLayout({ children }: { children: React.ReactNode }) {
  return <div className="min-h-screen">{children}</div>;
}
