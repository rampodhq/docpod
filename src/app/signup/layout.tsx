import type { Metadata } from "next";
import "../globals.css";

export const metadata: Metadata = {
  title: "Sign Up - docpod",
  description: "Create your docpod account",
};

export default function SignupLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
