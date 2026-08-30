/**
 * Thin HTTP layer. Deliberately knows nothing about Vue or Vuex.
 *
 * Every method is generic in the response type: api.get<Show[]>('/shows')
 * returns Promise<Show[]>. TS cannot verify that against the real server, so
 * the type parameter is a claim about the API contract, not a proof.
 */

const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? '/api'

/** Normalized failure. Actions catch this and commit an error string. */
export class ApiError extends Error {
  readonly status: number
  readonly body: unknown

  constructor(message: string, opts: { status?: number; body?: unknown } = {}) {
    super(message)
    this.name = 'ApiError'
    this.status = opts.status ?? 0
    this.body = opts.body ?? null
  }
}

/** Auth token lives here so the store never hand-rolls an Authorization header. */
let authToken: string | null = null
export function setAuthToken(token: string | null): void {
  authToken = token
}

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE'
  body?: unknown
  signal?: AbortSignal
}

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { method = 'GET', body, signal } = options

  const headers: Record<string, string> = {}
  if (body !== undefined) headers['Content-Type'] = 'application/json'
  if (authToken) headers['Authorization'] = `Bearer ${authToken}`

  let res: Response
  try {
    res = await fetch(`${BASE_URL}${path}`, {
      method,
      headers,
      signal,
      body: body === undefined ? undefined : JSON.stringify(body),
    })
  } catch (cause) {
    // Network-level failure: no response at all. Distinct from a 500.
    if (cause instanceof DOMException && cause.name === 'AbortError') throw cause
    throw new ApiError('Network request failed', { status: 0 })
  }

  // 204 and friends have no body to parse.
  const payload: unknown = res.status === 204 ? null : await res.json().catch(() => null)

  if (!res.ok) {
    const message =
      typeof payload === 'object' && payload !== null && 'message' in payload
        ? String((payload as { message: unknown }).message)
        : `Request failed (${res.status})`
    throw new ApiError(message, { status: res.status, body: payload })
  }

  return payload as T
}

export const api = {
  get: <T>(path: string, opts?: Omit<RequestOptions, 'method' | 'body'>) =>
    request<T>(path, { ...opts, method: 'GET' }),

  post: <T>(path: string, body?: unknown, opts?: Omit<RequestOptions, 'method' | 'body'>) =>
    request<T>(path, { ...opts, method: 'POST', body }),

  put: <T>(path: string, body?: unknown, opts?: Omit<RequestOptions, 'method' | 'body'>) =>
    request<T>(path, { ...opts, method: 'PUT', body }),

  delete: <T>(path: string, opts?: Omit<RequestOptions, 'method' | 'body'>) =>
    request<T>(path, { ...opts, method: 'DELETE' }),
}
