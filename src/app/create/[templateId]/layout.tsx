import type { ReactNode } from "react";

export const dynamicParams = false;

export function generateStaticParams() {
  return [];
}

export default function CreateRouteLayout({
  children,
}: {
  children: ReactNode;
}) {
  return children;
}
