import { http } from "@/shared/lib/http/axios.client";
import type { Document, CreateDocumentPayload } from "../types/documents.types";

export const documentsApi = {
  async list(): Promise<Document[]> {
    const { data } = await http.get<Document[]>("/documents");
    return data;
  },

  async getById(id: string): Promise<Document> {
    const { data } = await http.get<Document>(`/documents/${id}`);
    return data;
  },

  async create(payload: CreateDocumentPayload): Promise<Document> {
    const { data } = await http.post<Document>("/documents", payload);
    return data;
  },
};
