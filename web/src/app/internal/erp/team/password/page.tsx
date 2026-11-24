import type { Metadata } from "next";
import { ChangePassword } from "@/components/change-password";

export const metadata: Metadata = {
  title: "Change password",
  robots: { index: false, follow: false, nocache: true },
};

export default function PasswordPage() {
  return <ChangePassword />;
}
