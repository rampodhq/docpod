import { http } from "@/shared/lib/http/axios.client";
import { env } from "@/shared/lib/env";
import { getStoredToken, getStoredWorkspaceId } from "@/shared/lib/auth/session";

type ApiGenerationCreatePayload = {
  template_id: string;
  title: string;
  context_values: Array<{
    input_id?: string;
    type: "TEXT" | "WEBSITE" | "FILE";
    value: string;
    file_name?: string;
  }>;
};

export type ApiGenerationCreateResponse = {
  document_id: string;
  job_id: string;
  status: "QUEUED" | "RUNNING" | "SUCCEEDED" | "FAILED" | "CANCELLED";
};

export type ApiGenerationJobRead = {
  id: string;
  workspace_id: string;
  document_id: string;
  template_id: string;
  requested_by_user_id: string;
  status: "QUEUED" | "RUNNING" | "SUCCEEDED" | "FAILED" | "CANCELLED";
  pipeline_version: string;
  model_profile: string;
  final_markdown: string | null;
  final_html: string | null;
  token_usage_json: Record<string, unknown> | null;
  cost_usd: number;
  error_code: string | null;
  error_message: string | null;
  started_at: string | null;
  finished_at: string | null;
  created_at: string;
  updated_at: string;
};

export type ApiDocumentContentRead = {
  document_id: string;
  job_id: string | null;
  status: "QUEUED" | "GENERATING" | "COMPLETED" | "FAILED" | "CANCELLED";
  content_markdown: string | null;
};

const getHeaders = () => {
  const token = getStoredToken();
  const workspaceId = getStoredWorkspaceId();
  if (!token) throw new Error("Not authenticated");
  if (!workspaceId) throw new Error("No workspace selected");

  return {
    token,
    workspaceId,
    headers: {
      Authorization: `Bearer ${token}`,
      "X-Workspace-Id": workspaceId,
    },
  };
};

const parseDownloadFileName = (headerValue?: string): string | null => {
  if (!headerValue) return null;
  const utf8Match = headerValue.match(/filename\*=UTF-8''([^;]+)/i);
  if (utf8Match?.[1]) return decodeURIComponent(utf8Match[1]);
  const plainMatch = headerValue.match(/filename="?([^"]+)"?/i);
  return plainMatch?.[1] ?? null;
};

export const generationsApi = {
  async create(payload: ApiGenerationCreatePayload): Promise<ApiGenerationCreateResponse> {
    const { data } = await http.post<ApiGenerationCreateResponse>(
      "/api/v1/generations",
      payload,
      { ...getHeaders() },
    );
    return data;
  },

  async getJob(jobId: string): Promise<ApiGenerationJobRead> {
    const { data } = await http.get<ApiGenerationJobRead>(`/api/v1/generations/${jobId}`, { ...getHeaders() });
    return data;
  },

  async cancel(jobId: string): Promise<ApiGenerationJobRead> {
    const { data } = await http.post<ApiGenerationJobRead>(`/api/v1/generations/${jobId}/cancel`, {}, { ...getHeaders() });
    return data;
  },

  async getDocumentContent(documentId: string): Promise<ApiDocumentContentRead> {
    const { data } = await http.get<ApiDocumentContentRead>(`/api/v1/documents/${documentId}/content`, { ...getHeaders() });
    return data;
  },

  async downloadDocument(
    documentId: string,
    format: "md" | "pdf" | "docx",
  ): Promise<{ blob: Blob; filename: string }> {
    const response = await http.get<Blob>(`/api/v1/documents/${documentId}/download`, {
      ...getHeaders(),
      params: { format },
      responseType: "blob",
    });
    const header = response.headers["content-disposition"] as string | undefined;
    const fallback = `document_${documentId}.${format}`;
    return {
      blob: response.data,
      filename: parseDownloadFileName(header) || fallback,
    };
  },

  getStreamUrl(jobId: string): string {
    const { token, workspaceId } = getHeaders();
    const params = new URLSearchParams({
      access_token: token,
      workspace_id: workspaceId,
    });
    return `${env.NEXT_PUBLIC_API_BASE_URL}/api/v1/generations/${jobId}/stream?${params.toString()}`;
  },
};
