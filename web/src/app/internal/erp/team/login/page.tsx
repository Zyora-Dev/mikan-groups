import type { Metadata } from "next";
import { TeamLogin } from "@/components/team-login";

export const metadata: Metadata = {
  title: "Team Access",
  robots: { index: false, follow: false, nocache: true },
};

export default function TeamLoginPage() {
  return <TeamLogin />;
}
