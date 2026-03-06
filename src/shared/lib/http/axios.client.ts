import axios, { type AxiosInstance, type AxiosError } from "axios";
import { env } from "@/shared/lib/env";
import { ApiError } from "./http.types";

export const createHttpClient = (): AxiosInstance => {
  const client = axios.create({
    baseURL: env.NEXT_PUBLIC_API_BASE_URL,
    timeout: 30_000,
    headers: { Accept: "application/json" },
    withCredentials: true, // important if using cookies
  });

  client.interceptors.response.use(
    (response) => response,
    (error: AxiosError<{
      message?: string;
      detail?: string;
      code?: string;
      details?: unknown;
    }>) => {
      const status = error.response?.status;
      const data = error.response?.data;

      const message =
        data?.message ||
        data?.detail ||
        error.message ||
        "Unexpected error occurred";

      return Promise.reject(
        new ApiError(message, {
          status,
          code: data?.code,
          details: data?.details ?? data,
        }),
      );
    },
  );

  return client;
};

export const http = createHttpClient();
