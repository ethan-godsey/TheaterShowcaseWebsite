import type { RequestHandler } from 'express'
import { CognitoJwtVerifier } from 'aws-jwt-verify'

/**
 * Verifies a Cognito-issued JWT on every write route.
 *
 * Cognito authenticates (proves the user is Ellie); this authorizes (decides
 * the request may write). Cognito is never contacted per-request — the token
 * carries a signature we check against the pool's published public keys
 * (JWKS), which is what makes this stateless.
 *
 * Decoding a JWT is NOT verifying it: the payload is plain base64 and anyone
 * can forge one. Only the signature check proves Cognito minted it.
 */

const userPoolId = process.env.COGNITO_USER_POOL_ID
const clientId = process.env.COGNITO_CLIENT_ID

// Fail at boot, not at the first request. A server that starts and then
// rejects everything is far harder to diagnose than one that refuses to start.
if (!userPoolId || !clientId) {
  throw new Error(
    'COGNITO_USER_POOL_ID and COGNITO_CLIENT_ID must be set (server/.env locally, /etc/ellie-api.env on the box)',
  )
}

/*
 * tokenUse: 'access' matters. Cognito issues both an ID token and an access
 * token; only the access token is meant for authorizing API calls. They also
 * carry the client id in different claims — `aud` on the ID token, `client_id`
 * on the access token — so verifying one as the other fails confusingly.
 */
const verifier = CognitoJwtVerifier.create({
  userPoolId,
  tokenUse: 'access',
  clientId,
})

// Pre-fetch the JWKS so the first authenticated request doesn't pay for it.
void verifier.hydrate().catch((err: unknown) => {
  console.error('[auth] could not pre-fetch JWKS:', err)
})

/** What a verified request carries, stored on res.locals. */
export interface AuthContext {
  sub: string
  username?: string
}

export const requireAuth: RequestHandler = async (req, res, next) => {
  const header = req.headers.authorization
  if (!header?.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Authentication required' })
  }

  const token = header.slice('Bearer '.length).trim()

  try {
    // Checks signature, expiry, issuer, token_use and client_id in one call.
    const payload = await verifier.verify(token)
    // res.locals is Express's request-scoped bag, already loosely typed — so
    // handlers read it without augmenting Request (which differs between
    // Express 4 and 5).
    const auth: AuthContext = {
      sub: payload.sub,
      username: typeof payload.username === 'string' ? payload.username : undefined,
    }
    res.locals.auth = auth
    next()
  } catch (err) {
    // Log the reason server-side; tell the client nothing useful for probing.
    console.warn('[auth] rejected:', err instanceof Error ? err.message : err)
    res.status(401).json({ message: 'Invalid or expired session' })
  }
}
