export type ApiErrorPayload = {
  message: string;
  code?: string;
  details?: unknown;
};

export class ApiError extends Error {
  public readonly code?: string;
  public readonly details?: unknown;
  public readonly status?: number;

  constructor(message: string, opts?: { code?: string; details?: unknown; status?: number }) {
    super(message);
    this.name = "ApiError";
    this.code = opts?.code;
    this.details = opts?.details;
    this.status = opts?.status;
  }
}
