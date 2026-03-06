export type DocumentStatus =
  | "QUEUED"
  | "GENERATING"
  | "COMPLETED"
  | "FAILED"
  | "CANCELLED";

export interface Document {
  id: string;
  title: string;
  workspace_id: string;
  template_id: string;
  created_by_user_id: string;
  status: DocumentStatus;
  latest_generation_job_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface DocumentListResponse {
  items: Document[];
  total: number;
  limit: number;
  offset: number;
}

export interface DocumentContent {
  document_id: string;
  job_id: string | null;
  status: DocumentStatus;
  content_markdown: string | null;
}
