import CreateDocumentPageClient from "./CreateDocumentPageClient";

export const dynamicParams = false;

export function generateStaticParams() {
  return [];
}

export default function CreateDocumentPage() {
  return <CreateDocumentPageClient />;
}
