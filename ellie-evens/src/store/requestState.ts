import type { Commit } from 'vuex'

/**
 * Shared async-request bookkeeping.
 *
 * Every module tracks in-flight work in `state.requests`, keyed by a name the
 * module chooses. One slot per request means two concurrent calls can never
 * stomp each other's status.
 */

export const Status = {
  IDLE: 'idle',
  LOADING: 'loading',
  SUCCESS: 'success',
  ERROR: 'error',
} as const

/**
 * `as const` above makes the values literal types rather than `string`, so this
 * resolves to 'idle' | 'loading' | 'success' | 'error'. That union is what makes
 * an impossible state (loading AND errored) unrepresentable.
 */
export type Status = (typeof Status)[keyof typeof Status]

export interface RequestState {
  status: Status
  error: string | null
}

/** A module's request slots, keyed by the literal names it declared. */
export type Requests<K extends string> = Record<K, RequestState>

/** Any module state that carries request slots. */
export interface HasRequests {
  requests: Requests<string>
}

/**
 * createRequests('fetch', 'save') is typed Requests<'fetch' | 'save'> — the
 * generic captures the literal argument names, so a typo'd slot name is a
 * compile error at the call site rather than an undefined at runtime.
 */
export function createRequests<const K extends string>(...names: K[]): Requests<K> {
  return names.reduce((acc, name) => {
    acc[name] = { status: Status.IDLE, error: null }
    return acc
  }, {} as Requests<K>)
}

/** Spread into a module's `mutations`. The only things that write request state. */
export const requestMutations = {
  REQUEST_PENDING(state: HasRequests, name: string): void {
    state.requests[name] = { status: Status.LOADING, error: null }
  },
  REQUEST_SUCCESS(state: HasRequests, name: string): void {
    state.requests[name] = { status: Status.SUCCESS, error: null }
  },
  REQUEST_FAILURE(state: HasRequests, payload: { name: string; error: string }): void {
    state.requests[payload.name] = { status: Status.ERROR, error: payload.error }
  },
}

/** Spread into a module's `getters`. Each returns a lookup function by name. */
export const requestGetters = {
  requestStatus:
    (state: HasRequests) =>
    (name: string): Status =>
      state.requests[name]?.status ?? Status.IDLE,

  isLoading:
    (state: HasRequests) =>
    (name: string): boolean =>
      state.requests[name]?.status === Status.LOADING,

  requestError:
    (state: HasRequests) =>
    (name: string): string | null =>
      state.requests[name]?.error ?? null,
}

/**
 * Wrap an async call in pending/success/failure commits.
 *
 * Resolves to the callback's value, or `undefined` if it failed — the error is
 * in state, so components read it from a getter rather than catching. Aborts
 * are intentional, not failures, so they leave status untouched.
 *
 * The `T | undefined` return type is the useful part: callers are forced by the
 * compiler to handle the failure case they'd otherwise forget.
 */
export async function runRequest<T>(
  commit: Commit,
  name: string,
  fn: () => Promise<T>,
): Promise<T | undefined> {
  commit('REQUEST_PENDING', name)
  try {
    const result = await fn()
    commit('REQUEST_SUCCESS', name)
    return result
  } catch (err) {
    if (err instanceof DOMException && err.name === 'AbortError') return undefined
    const error = err instanceof Error ? err.message : String(err)
    commit('REQUEST_FAILURE', { name, error })
    return undefined
  }
}
