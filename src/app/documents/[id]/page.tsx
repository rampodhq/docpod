import DocumentViewPageClient from "./DocumentViewPageClient";

export const dynamicParams = false;

export async function generateStaticParams() {
  return [{ id: "preview" }];
}

export default function DocumentViewPage() {
  return <DocumentViewPageClient />;
}
