export type DocumentStatus = "draft" | "generated" | "archived";

export interface Document {
  id: string;
  title: string;
  templateId: string;
  status: DocumentStatus;
  createdAt: string;
  updatedAt: string;
}

export interface CreateDocumentPayload {
  title: string;
  templateId: string;
}
