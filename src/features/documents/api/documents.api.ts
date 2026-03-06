import { http } from "@/shared/lib/http/axios.client";
import { getStoredToken, getStoredWorkspaceId } from "@/shared/lib/auth/session";
import type { Document, DocumentContent, DocumentListResponse } from "../types/documents.types";

const getDocumentHeaders = () => {
  const token = getStoredToken();
  const workspaceId = getStoredWorkspaceId();
  if (!token) {
    throw new Error("Not authenticated");
  }
  if (!workspaceId) {
    throw new Error("No workspace selected");
  }
  return {
    headers: {
      Authorization: `Bearer ${token}`,
      "X-Workspace-Id": workspaceId,
    },
  };
};

export const documentsApi = {
  async list(params?: { limit?: number; offset?: number }): Promise<DocumentListResponse> {
    const { data } = await http.get<DocumentListResponse>("/api/v1/documents", {
      ...getDocumentHeaders(),
      params,
    });
    return data;
  },

  async getById(id: string): Promise<Document> {
    const { data } = await http.get<Document>(`/api/v1/documents/${id}`, getDocumentHeaders());
    return data;
  },

  async getContent(id: string): Promise<DocumentContent> {
    const { data } = await http.get<DocumentContent>(`/api/v1/documents/${id}/content`, getDocumentHeaders());
    return data;
  },
};
