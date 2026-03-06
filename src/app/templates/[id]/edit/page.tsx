import TemplateEditPageClient from "./TemplateEditPageClient";

export const dynamicParams = false;

export async function generateStaticParams() {
  return [{ id: "preview" }];
}

export default function TemplateEditPage() {
  return <TemplateEditPageClient />;
}
