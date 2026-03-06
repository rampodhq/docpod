export const paths = {
  home: "/",
  documents: "/documents",
  documentView: "/documents/view",
  templates: "/templates",
  templateEdit: "/templates/edit",
  settings: "/settings",
  create: "/create",

  createTemplate: (id: string) => `/create?templateId=${encodeURIComponent(id)}`,
  editTemplate: (id: string) => `/templates/edit?id=${encodeURIComponent(id)}`,
  documentDetails: (id: string) => `/documents/view?id=${encodeURIComponent(id)}`,
};
