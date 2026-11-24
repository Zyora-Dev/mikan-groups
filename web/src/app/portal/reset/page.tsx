import type { Metadata } from "next";
import { Suspense } from "react";
import { ResetPassword } from "@/components/reset-password";

export const metadata: Metadata = {
  title: "Reset password",
  robots: { index: false, follow: false, nocache: true },
};

export default function PortalResetPage() {
  // useSearchParams needs a boundary, or the route opts out of static rendering.
  return (
    <Suspense fallback={<main className="min-h-screen bg-neutral-950" />}>
      <ResetPassword scope="portal" />
    </Suspense>
  );
}
