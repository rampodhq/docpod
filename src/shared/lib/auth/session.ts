export const TOKEN_KEY = "docpod_access_token";
export const WORKSPACE_ID_KEY = "docpod_workspace_id";

export const getStoredToken = (): string | null => {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(TOKEN_KEY);
};

export const getStoredWorkspaceId = (): string | null => {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(WORKSPACE_ID_KEY);
};

export const setStoredToken = (token: string): void => {
  localStorage.setItem(TOKEN_KEY, token);
};

export const setStoredWorkspaceId = (workspaceId: string): void => {
  localStorage.setItem(WORKSPACE_ID_KEY, workspaceId);
};

export const clearStoredSession = (): void => {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(WORKSPACE_ID_KEY);
  localStorage.removeItem("docpod_user");
};
