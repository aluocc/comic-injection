import axios, { AxiosError, type AxiosInstance } from "axios";

/**
 * Shape of the unified API envelope returned by the NestJS backend.
 * Success: { code: 0, message: 'success', data: T }
 * Error:   { code: number, message: string, data: null }
 */
export interface ApiResponse<T = unknown> {
  code: number;
  message: string;
  data: T;
}

/**
 * Error thrown after unwrapping a non-success envelope.
 */
export class ApiError extends Error {
  code: number;
  constructor(code: number, message: string) {
    super(message);
    this.code = code;
    this.name = "ApiError";
  }
}

const baseURL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:3001";

const TOKEN_KEY = "auth_token";

function readToken(): string | null {
  try {
    return typeof window === "undefined"
      ? null
      : localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

function clearAuthAndRedirect() {
  try {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem("auth_user");
  } catch {
    // ignore
  }
  // Trigger a hard navigation so all client state is reset.
  if (typeof window !== "undefined" && window.location.pathname !== "/login") {
    window.location.assign("/login?expired=1");
  }
}

/**
 * Shared axios instance. The response interceptor strips the unified envelope
 * so callers receive `data` directly; non-zero codes reject with ApiError.
 */
export const api: AxiosInstance = axios.create({
  baseURL,
  timeout: 15000,
  headers: { "Content-Type": "application/json" },
});

// Request interceptor: attach Authorization: Bearer <token> when present.
api.interceptors.request.use((config) => {
  const token = readToken();
  if (token) {
    config.headers = config.headers ?? {};
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor: unwrap envelope on success, normalize errors.
// On 401 we clear local auth and bounce to /login.
api.interceptors.response.use(
  (response) => {
    const payload = response.data as ApiResponse;
    if (payload && typeof payload.code === "number") {
      if (payload.code === 0) {
        return { ...response, data: payload.data };
      }
      throw new ApiError(payload.code, payload.message || "Request failed");
    }
    return response;
  },
  (error: AxiosError<ApiResponse>) => {
    const status = error.response?.status;
    const payload = error.response?.data;
    if (payload && typeof payload.code === "number") {
      if (status === 401) {
        clearAuthAndRedirect();
      }
      return Promise.reject(new ApiError(payload.code, payload.message));
    }
    if (status === 401) {
      clearAuthAndRedirect();
    }
    return Promise.reject(
      new ApiError(-1, error.message || "Network error"),
    );
  },
);

/** Convenience GET that returns unwrapped data. */
export async function apiGet<T>(url: string): Promise<T> {
  const res = await api.get<T>(url);
  return res.data;
}

/** Convenience POST that accepts a body and returns unwrapped data. */
export async function apiPost<T>(url: string, body?: unknown): Promise<T> {
  const res = await api.post<T>(url, body);
  return res.data;
}

/** Convenience DELETE that returns unwrapped data. */
export async function apiDelete<T>(url: string): Promise<T> {
  const res = await api.delete<T>(url);
  return res.data;
}
