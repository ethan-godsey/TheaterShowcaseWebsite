import { ref, readonly } from 'vue'

/**
 * App-wide toasts. The list lives at module scope, so every component that
 * calls useToast() shares it — one host renders them, anything can raise one.
 * Fine for a client-only SPA; with SSR this would leak between requests.
 */
export interface Toast {
  id: number
  message: string
  tone: 'error' | 'info'
}

const DEFAULT_MS = 5000

const toasts = ref<Toast[]>([])
let nextId = 1

function dismiss(id: number): void {
  toasts.value = toasts.value.filter((t) => t.id !== id)
}

function show(message: string, opts: { tone?: Toast['tone']; ms?: number } = {}): void {
  const id = nextId++
  toasts.value = [...toasts.value, { id, message, tone: opts.tone ?? 'info' }]
  setTimeout(() => dismiss(id), opts.ms ?? DEFAULT_MS)
}

export function useToast() {
  return {
    toasts: readonly(toasts),
    show,
    error: (message: string) => show(message, { tone: 'error' }),
    dismiss,
  }
}
