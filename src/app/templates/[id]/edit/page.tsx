import TemplateEditPageClient from "./TemplateEditPageClient";

export const dynamicParams = false;

export function generateStaticParams() {
  return [];
}

export default function TemplateEditPage() {
  return <TemplateEditPageClient />;
}
