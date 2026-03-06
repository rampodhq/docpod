import CreateDocumentPageClient from "./CreateDocumentPageClient";

export const dynamicParams = false;

export async function generateStaticParams() {
  return [{ templateId: "preview" }];
}

export default function CreateDocumentPage() {
  return <CreateDocumentPageClient />;
}
