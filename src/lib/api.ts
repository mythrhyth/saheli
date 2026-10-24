/**
 * Reusable API client for Saheli backend.
 * Base URL: VITE_API_URL env variable, fallback to http://localhost:5000/api/v1
 * Auth: JWT stored in localStorage under "auth_token"
 */

const BASE_URL = import.meta.env.VITE_API_URL ?? "http://localhost:5000/api/v1"
const TOKEN_KEY = "auth_token"
const TIMEOUT_MS = 15_000

/** Structured error from the API layer. */
export class ApiError extends Error {
  code: string
  status: number
  details?: Record<string, unknown>

  constructor(message: string, code: string, status: number, details?: Record<string, unknown>) {
    super(message)
    this.name = "ApiError"
    this.code = code
    this.status = status
    this.details = details
  }

  get cooldownRemaining(): number | undefined {
    return typeof this.details?.cooldownRemaining === "number" ? this.details.cooldownRemaining : undefined
  }
}

/** Shape of every backend response envelope. */
type SuccessEnvelope<T> = { success: true; data: T }
type FailureEnvelope = { success: false; error: { code: string; message: string; [key: string]: unknown } }
type ApiEnvelope<T> = SuccessEnvelope<T> | FailureEnvelope

/** Build headers, optionally including the Authorization header. */
function buildHeaders(includeAuth: boolean): HeadersInit {
  const headers: Record<string, string> = { "Content-Type": "application/json" }
  if (includeAuth) {
    const token = localStorage.getItem(TOKEN_KEY)
    if (token) {
      headers["Authorization"] = `Bearer ${token}`
    }
  }
  return headers
}

/** Perform a fetch with a timeout and parse the envelope. */
async function request<T>(path: string, init: RequestInit, includeAuth: boolean): Promise<T> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS)

  let response: Response
  try {
    response = await fetch(`${BASE_URL}${path}`, {
      ...init,
      headers: { ...buildHeaders(includeAuth), ...(init.headers ?? {}) },
      signal: controller.signal,
    })
  } catch (err) {
    clearTimeout(timer)
    if ((err as Error).name === "AbortError") {
      throw new ApiError("Request timed out", "TIMEOUT", 0)
    }
    throw new ApiError("Network error — check your connection", "NETWORK_ERROR", 0)
  } finally {
    clearTimeout(timer)
  }

  let envelope: ApiEnvelope<T>
  try {
    envelope = (await response.json()) as ApiEnvelope<T>
  } catch {
    throw new ApiError(`Unexpected response (status ${response.status})`, "PARSE_ERROR", response.status)
  }

  if (!response.ok || !envelope.success) {
    if (response.status === 401) {
      localStorage.removeItem(TOKEN_KEY)
      window.dispatchEvent(new CustomEvent("saheli:unauthorized"))
    }
    const failure = envelope as FailureEnvelope
    const errObj = failure.error as Record<string, unknown> | undefined
    const code = (errObj?.code as string) ?? "UNKNOWN"
    const message = (errObj?.message as string) ?? `Request failed with status ${response.status}`
    throw new ApiError(message, code, response.status, errObj)
  }

  return (envelope as SuccessEnvelope<T>).data
}

/** Public API client object. */
export const api = {
  /** GET with auth header. */
  get<T>(path: string): Promise<T> {
    return request<T>(path, { method: "GET" }, true)
  },

  /** POST with auth header. */
  post<T>(path: string, body?: unknown): Promise<T> {
    return request<T>(path, { method: "POST", body: body !== undefined ? JSON.stringify(body) : undefined }, true)
  },

  /** PUT with auth header. */
  put<T>(path: string, body?: unknown): Promise<T> {
    return request<T>(path, { method: "PUT", body: body !== undefined ? JSON.stringify(body) : undefined }, true)
  },

  /** PATCH with auth header. */
  patch<T>(path: string, body?: unknown): Promise<T> {
    return request<T>(path, { method: "PATCH", body: body !== undefined ? JSON.stringify(body) : undefined }, true)
  },

  /** DELETE with auth header. */
  del<T>(path: string): Promise<T> {
    return request<T>(path, { method: "DELETE" }, true)
  },

  /** GET without auth header — for public endpoints. */
  getPublic<T>(path: string): Promise<T> {
    return request<T>(path, { method: "GET" }, false)
  },

  /** Persist the JWT token in localStorage and future requests will include it. */
  setToken(token: string): void {
    localStorage.setItem(TOKEN_KEY, token)
  },

  /** Remove the JWT token from localStorage. */
  clearToken(): void {
    localStorage.removeItem(TOKEN_KEY)
  },

  /** Read the current JWT token (or null if not set). */
  getToken(): string | null {
    return localStorage.getItem(TOKEN_KEY)
  },
}
