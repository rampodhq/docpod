export type SectionStyle =
  | "paragraph"
  | "bulleted"
  | "numbered"
  | "table"
  | "highlight";

export type ContextInputType = "file" | "url" | "text";

export type ContextInput = {
  id: string;
  label: string;
  description?: string;
  type: ContextInputType;
  required: boolean;
  acceptedFileTypes?: string[]; // e.g., [".pdf", ".docx", ".txt"]
};

export type ContextInputValue = {
  inputId: string;
  type: ContextInputType;
  value: string; // file path, URL, or text content
  fileName?: string; // for file uploads
};

export type Section = {
  id: string;
  title: string;
  content: string;
  style: SectionStyle;
  styles?: SectionStyle[];
  contextInputs?: ContextInput[]; // Template-level: what inputs are expected
  allowAdditionalContext?: boolean; // Allow ad-hoc inputs during generation
};

export type ManagedTemplate = {
  id: string;
  title: string;
  subtitle: string;
  icon: string;
  tag: string;
  tint: "peach" | "blue" | "sage";
  sections: Section[];
};


export const initialManagedTemplates: ManagedTemplate[] = [
  {
    id: "1",
    title: "Project Proposal",
    subtitle: "Client-ready proposal template",
    tag: "Business",
    tint: "peach",
    icon: "📁",
    sections: [
      {
        id: "s1",
        title: "Executive Summary",
        content: "Describe the client problem...",
        style: "paragraph",
        contextInputs: [
          {
            id: "ci1",
            label: "Client Brief",
            description: "Upload the client's project brief or RFP document",
            type: "file",
            required: true,
            acceptedFileTypes: [".pdf", ".docx", ".txt"],
          },
          {
            id: "ci2",
            label: "Company Background",
            description: "Add information about your company and past relevant work",
            type: "text",
            required: false,
          },
        ],
        allowAdditionalContext: true,
      },
      {
        id: "s2",
        title: "Scope of Work",
        content: "Define deliverables...",
        style: "paragraph",
        contextInputs: [
          {
            id: "ci3",
            label: "Project Requirements",
            description: "Link to project requirements document or specification",
            type: "url",
            required: true,
          },
        ],
        allowAdditionalContext: true,
      },
    ],
  },
  {
    id: "2",
    title: "SOP Template",
    subtitle: "Operational documentation template",
    tag: "Ops",
    tint: "blue",
    icon: "📄",
    sections: [
        {
        id: "s1",
        title: "Executive Summary",
        content: "Describe the client problem...",
        style: "paragraph",
        allowAdditionalContext: true,
      },
      {
        id: "s2",
        title: "Scope of Work",
        content: "Define deliverables...",
        style: "paragraph",
        allowAdditionalContext: true,
      },
    ],
  },
];
