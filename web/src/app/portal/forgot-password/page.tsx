import type { Metadata } from "next";
import { ForgotPassword } from "@/components/forgot-password";

export const metadata: Metadata = {
  title: "Forgot password",
  robots: { index: false, follow: false, nocache: true },
};

export default function PortalForgotPage() {
  return <ForgotPassword scope="portal" />;
}
