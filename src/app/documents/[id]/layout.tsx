import type { ReactNode } from "react";

export const dynamicParams = false;

export function generateStaticParams() {
  return [];
}

export default function DocumentRouteLayout({
  children,
}: {
  children: ReactNode;
}) {
  return children;
}
