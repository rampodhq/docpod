export type Template = {
  id: string;
  name: string;
  description: string;
  icon?: string;
  createdAt: string;
};

export const initialTemplates: Template[] = [
  {
    id: "1",
    name: "Employment Contract",
    description: "Standard employment agreement template",
    icon: "DocumentText",
    createdAt: new Date().toISOString(),
  },
  {
    id: "2",
    name: "NDA Agreement",
    description: "Mutual non-disclosure agreement",
    icon: "Clipboard",
    createdAt: new Date().toISOString(),
  },
];
