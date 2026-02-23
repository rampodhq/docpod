import type { Metadata } from "next";
import "../globals.css";

export const metadata: Metadata = {
  title: "Login - docpod",
  description: "Sign in to your docpod account",
};

export default function LoginLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
