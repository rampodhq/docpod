import { http } from "@/shared/lib/http/axios.client";
import { getStoredToken, getStoredWorkspaceId } from "@/shared/lib/auth/session";

type ApiTemplateContextInput = {
  id: string;
  label: string;
  input_type: string;
  required: boolean;
  description: string | null;
  allowed_file_types: string[] | null;
  order_index: number;
};

type ApiTemplateSection = {
  id: string;
  title: string;
  order_index: number;
  content_instructions: string | null;
  allowed_styles: string[];
  allow_additional_context: boolean;
  context_inputs: ApiTemplateContextInput[];
};

export type ApiTemplateRead = {
  id: string;
  workspace_id: string;
  name: string;
  description: string | null;
  icon: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  sections: ApiTemplateSection[];
};

export type ApiTemplateSummary = {
  id: string;
  workspace_id: string;
  name: string;
  description: string | null;
  icon: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  section_count: number;
};

export type ApiTemplateListResponse = {
  items: ApiTemplateSummary[];
  total: number;
  limit: number;
  offset: number;
};

export type ApiTemplateIcon = {
  key: string;
  label: string;
};

type CreateTemplatePayload = {
  name?: string;
  description?: string;
  icon?: string;
  sections?: Array<{
    title: string;
    order_index: number;
    content?: string;
    content_instructions?: string;
    allowed_styles: string[];
    allow_additional_context: boolean;
    context_inputs: Array<{
      label: string;
      input_type: string;
      required: boolean;
      description?: string;
      allowed_file_types?: string[];
      order_index: number;
    }>;
  }>;
};

type UpdateTemplatePayload = {
  name: string;
  description?: string;
  icon?: string;
  sections: CreateTemplatePayload["sections"];
};

const getTemplateHeaders = () => {
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

export const templatesApi = {
  async list(params?: { query?: string; limit?: number; offset?: number }): Promise<ApiTemplateListResponse> {
    const { data } = await http.get<ApiTemplateListResponse>("/api/v1/templates", {
      ...getTemplateHeaders(),
      params,
    });
    return data;
  },

  async listIcons(): Promise<ApiTemplateIcon[]> {
    const { data } = await http.get<ApiTemplateIcon[]>("/api/v1/templates/icons", getTemplateHeaders());
    return data;
  },

  async getById(id: string): Promise<ApiTemplateRead> {
    const { data } = await http.get<ApiTemplateRead>(`/api/v1/templates/${id}`, getTemplateHeaders());
    return data;
  },

  async create(payload: CreateTemplatePayload): Promise<ApiTemplateRead> {
    const { data } = await http.post<ApiTemplateRead>("/api/v1/templates", payload, getTemplateHeaders());
    return data;
  },

  async update(id: string, payload: UpdateTemplatePayload): Promise<ApiTemplateRead> {
    const { data } = await http.put<ApiTemplateRead>(`/api/v1/templates/${id}`, payload, getTemplateHeaders());
    return data;
  },

  async patch(id: string, payload: { name?: string; description?: string; icon?: string; is_active?: boolean }): Promise<ApiTemplateRead> {
    const { data } = await http.patch<ApiTemplateRead>(`/api/v1/templates/${id}`, payload, getTemplateHeaders());
    return data;
  },

  async duplicate(id: string, payload?: { name?: string }): Promise<ApiTemplateRead> {
    const { data } = await http.post<ApiTemplateRead>(`/api/v1/templates/${id}/duplicate`, payload ?? {}, getTemplateHeaders());
    return data;
  },

  async delete(id: string): Promise<void> {
    await http.delete(`/api/v1/templates/${id}`, getTemplateHeaders());
  },
};
