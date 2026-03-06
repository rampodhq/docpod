import type { ApiTemplateRead, ApiTemplateSummary } from "../api/templates.api";
import type {
  ContextInput,
  ManagedTemplate,
  Section,
  SectionStyle,
} from "../data/templates.management.data";
import type { Template } from "../data/templates.data";

const mapStyleToFrontend = (style: string): SectionStyle => {
  const normalized = style.toUpperCase();
  if (normalized === "BULLETED_LIST") return "bulleted";
  if (normalized === "NUMBERED_LIST") return "numbered";
  if (normalized === "TABLE") return "table";
  if (normalized === "QUOTE") return "quote";
  if (normalized === "HIGHLIGHT") return "highlight";
  return "paragraph";
};

const mapInputTypeToFrontend = (inputType: string): "file" | "url" | "text" => {
  const normalized = inputType.toUpperCase();
  if (normalized === "FILE") return "file";
  if (normalized === "WEBSITE") return "url";
  return "text";
};

const inferTint = (icon: string | null): "peach" | "blue" | "sage" => {
  if (icon === "ChartBar") return "blue";
  if (icon === "Settings" || icon === "Clipboard") return "sage";
  return "peach";
};

export const mapSummaryToTemplateCard = (template: ApiTemplateSummary): ManagedTemplate => ({
  id: template.id,
  title: template.name,
  subtitle: template.description ?? "No description",
  tag: template.is_active ? "Active" : "Inactive",
  tint: inferTint(template.icon),
  icon: template.icon ?? "DocumentText",
  sections: [],
});

export const mapReadToManagedTemplate = (template: ApiTemplateRead): ManagedTemplate => {
  const documentContextInputs: ContextInput[] = (template.document_context_inputs ?? [])
    .sort((a, b) => a.order_index - b.order_index)
    .map((input) => ({
      id: input.id,
      label: input.label,
      description: input.description ?? undefined,
      type: mapInputTypeToFrontend(input.input_type),
      required: input.required,
      acceptedFileTypes: input.allowed_file_types ?? undefined,
    }));

  const sections: Section[] = template.sections
    .sort((a, b) => a.order_index - b.order_index)
    .map((section) => {
      const mappedStyles = (section.allowed_styles ?? []).map(mapStyleToFrontend);
      const resolvedStyles = mappedStyles.length > 0 ? mappedStyles : ["paragraph"];
      const contextInputs: ContextInput[] = section.context_inputs
        .sort((a, b) => a.order_index - b.order_index)
        .map((input) => ({
          id: input.id,
          label: input.label,
          description: input.description ?? undefined,
          type: mapInputTypeToFrontend(input.input_type),
          required: input.required,
          acceptedFileTypes: input.allowed_file_types ?? undefined,
        }));

      return {
        id: section.id,
        title: section.title,
        content: section.content_instructions ?? "",
        style: resolvedStyles[0],
        styles: resolvedStyles,
        contextInputs,
        allowAdditionalContext: section.allow_additional_context,
      };
    });

  return {
    id: template.id,
    title: template.name,
    subtitle: template.description ?? "No description",
    tag: template.is_active ? "Active" : "Inactive",
    tint: inferTint(template.icon),
    icon: template.icon ?? "DocumentText",
    documentContextInputs,
    sections,
  };
};

export const mapSummaryToHomeTemplate = (template: ApiTemplateSummary): Template => ({
  id: template.id,
  name: template.name,
  description: template.description ?? "No description",
  icon: template.icon ?? "DocumentText",
  createdAt: template.created_at,
});
