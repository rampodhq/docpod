export const paths = {
  home: "/",
  documents: "/documents",
  templates: "/templates",
  settings: "/settings",

  createTemplate: (id: string) => `/create/${id}`,
  editTemplate: (id: string) => `/templates/${id}/edit`,
  documentDetails: (id: string) => `/documents/${id}`,
};
