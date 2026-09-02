/**
 * Cognito OAuth 2.0 (Authorization Code + PKCE) — the browser half.
 *
 * Deliberately dependency-free: this is ~80 lines of Web Crypto and fetch,
 * and writing it once is worth more than a library that hides it.
 *
 * PKCE in one sentence: we send a HASH of a secret when we ask for a code,
 * and the secret itself only when we redeem it — so an authorization code
 * stolen from a URL, browser history, or a referer header is useless.
 */

const DOMAIN = import.meta.env.VITE_COGNITO_DOMAIN
const CLIENT_ID = import.meta.env.VITE_COGNITO_CLIENT_ID

/** Derived, not configured — so localhost and production both just work. */
export const redirectUri = (): string => `${window.location.origin}/callback`

const VERIFIER_KEY = 'ee.pkce.verifier'

function base64url(bytes: ArrayBuffer): string {
  const binary = String.fromCharCode(...new Uint8Array(bytes))
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

/** 43-character verifier plus its SHA-256 challenge, per RFC 7636. */
async function createPkcePair(): Promise<{ verifier: string; challenge: string }> {
  const verifier = base64url(crypto.getRandomValues(new Uint8Array(32)).buffer)
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(verifier))
  return { verifier, challenge: base64url(digest) }
}

/** Sends the browser to Cognito's hosted login page. Does not return. */
export async function beginLogin(): Promise<void> {
  const { verifier, challenge } = await createPkcePair()

  // Survives the round trip to Cognito: sessionStorage is per-tab and per
  // origin, so navigating away and back leaves it intact.
  sessionStorage.setItem(VERIFIER_KEY, verifier)

  const params = new URLSearchParams({
    response_type: 'code',
    client_id: CLIENT_ID,
    redirect_uri: redirectUri(),
    scope: 'openid email',
    code_challenge: challenge,
    code_challenge_method: 'S256',
  })

  window.location.assign(`${DOMAIN}/oauth2/authorize?${params}`)
}

interface TokenResponse {
  access_token: string
  id_token: string
  refresh_token: string
  expires_in: number
  token_type: string
}

/** Trades the one-time code for tokens. Codes expire in ~60s and are single-use. */
export async function exchangeCode(code: string): Promise<TokenResponse> {
  const verifier = sessionStorage.getItem(VERIFIER_KEY)
  if (!verifier) {
    throw new Error('Login session expired. Please try signing in again.')
  }
  sessionStorage.removeItem(VERIFIER_KEY)

  const res = await fetch(`${DOMAIN}/oauth2/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      client_id: CLIENT_ID,
      code,
      redirect_uri: redirectUri(),
      code_verifier: verifier,
    }),
  })

  if (!res.ok) {
    const detail = (await res.json().catch(() => null)) as { error?: string } | null
    throw new Error(detail?.error ?? `Sign-in failed (${res.status})`)
  }

  return (await res.json()) as TokenResponse
}

/** Reads a claim out of a JWT payload. Display only — never a security check. */
export function readClaim(token: string, claim: string): string | undefined {
  try {
    const payload = token.split('.')[1]
    if (!payload) return undefined
    const json = atob(payload.replace(/-/g, '+').replace(/_/g, '/'))
    const value = (JSON.parse(json) as Record<string, unknown>)[claim]
    return typeof value === 'string' ? value : undefined
  } catch {
    return undefined
  }
}

/** Ends the Cognito session too — clearing local tokens alone leaves it live. */
export function logoutUrl(): string {
  const params = new URLSearchParams({
    client_id: CLIENT_ID,
    logout_uri: `${window.location.origin}/`,
  })
  return `${DOMAIN}/logout?${params}`
}
