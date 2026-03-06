import DocumentViewPageClient from "./DocumentViewPageClient";

export const dynamicParams = false;

export function generateStaticParams() {
  return [];
}

export default function DocumentViewPage() {
  return <DocumentViewPageClient />;
}
