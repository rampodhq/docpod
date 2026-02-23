"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import type { User, SignupData, LoginData, AuthContextType } from "@/types/auth.types";
import { http } from "@/shared/lib/http/axios.client";
import {
  clearStoredSession,
  getStoredToken,
  setStoredToken,
  setStoredWorkspaceId,
  TOKEN_KEY,
  WORKSPACE_ID_KEY,
} from "@/shared/lib/auth/session";

const AuthContext = createContext<AuthContextType | undefined>(undefined);

type ApiAuthUser = {
  id: string;
  full_name: string;
  email: string;
  account_type: "individual" | "personal" | "organization";
  organization_name?: string | null;
  image_url?: string | null;
  created_at: string;
};

const authHeader = (token: string) => ({
  headers: {
    Authorization: `Bearer ${token}`,
  },
});

type ApiWorkspace = {
  id: string;
  name: string;
  type: string;
  owner_user_id: string;
  created_at: string;
};

const toFrontendUser = (apiUser: ApiAuthUser): User => ({
  id: apiUser.id,
  name: apiUser.full_name,
  email: apiUser.email,
  image: apiUser.image_url ?? undefined,
  accountType: apiUser.account_type === "organization" ? "organization" : "personal",
  organizationName: apiUser.organization_name ?? undefined,
  createdAt: apiUser.created_at,
});

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const syncWorkspace = async (token: string): Promise<void> => {
    const { data } = await http.get<ApiWorkspace[]>("/api/v1/workspaces", authHeader(token));
    if (data.length > 0) {
      setStoredWorkspaceId(data[0].id);
      return;
    }
    localStorage.removeItem(WORKSPACE_ID_KEY);
  };

  useEffect(() => {
    const bootstrap = async () => {
      const token = getStoredToken();
      if (!token) {
        setIsLoading(false);
        return;
      }

      try {
        const { data } = await http.get<ApiAuthUser>("/api/v1/auth/me", authHeader(token));
        const mapped = toFrontendUser(data);
        setUser(mapped);
        localStorage.setItem("docpod_user", JSON.stringify(mapped));
        await syncWorkspace(token);
      } catch {
        clearStoredSession();
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    bootstrap();
  }, []);

  const login = async (data: LoginData) => {
    const loginRes = await http.post<{ access_token: string }>(
      "/api/v1/auth/login",
      {
        email: data.email,
        password: data.password,
      },
    );
    const token = loginRes.data.access_token;
    setStoredToken(token);

    const meRes = await http.get<ApiAuthUser>("/api/v1/auth/me", authHeader(token));
    const mapped = toFrontendUser(meRes.data);
    setUser(mapped);
    localStorage.setItem("docpod_user", JSON.stringify(mapped));
    await syncWorkspace(token);
  };

  const signup = async (data: SignupData) => {
    const accountType = data.accountType === "organization" ? "organization" : "personal";
    const formData = new FormData();
    formData.append("name", data.name);
    formData.append("email", data.email);
    formData.append("password", data.password);
    formData.append("account_type", accountType);
    if (data.organizationName) {
      formData.append("organization_name", data.organizationName);
    }
    if (data.image) {
      formData.append("image", data.image);
    }
    const signupRes = await http.post<{ access_token: string }>("/api/v1/auth/signup", formData);

    const token = signupRes.data.access_token;
    setStoredToken(token);

    const meRes = await http.get<ApiAuthUser>("/api/v1/auth/me", authHeader(token));
    const mapped = toFrontendUser(meRes.data);
    setUser(mapped);
    localStorage.setItem("docpod_user", JSON.stringify(mapped));
    await syncWorkspace(token);
  };

  const logout = () => {
    setUser(null);
    clearStoredSession();
  };

  const updateProfileImage = async (image: File) => {
    if (!user) return;
    const token = localStorage.getItem(TOKEN_KEY);
    if (!token) {
      throw new Error("Not authenticated");
    }

    const formData = new FormData();
    formData.append("image", image);
    const { data } = await http.post<ApiAuthUser>("/api/v1/auth/me/image", formData, authHeader(token));
    const mapped = toFrontendUser(data);
    setUser(mapped);
    localStorage.setItem("docpod_user", JSON.stringify(mapped));
  };

  if (isLoading) {
    return null; // Or a loading spinner
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        login,
        signup,
        logout,
        updateProfileImage,
        isAuthenticated: !!user,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
