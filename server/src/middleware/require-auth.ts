import type { RequestHandler } from 'express'

/**
 * AUTH PLACEHOLDER — fail-closed.
 *
 * Until Cognito lands, write routes are REJECTED unless AUTH_DEV_BYPASS=true
 * is set (local dev only — it lives in server/.env, which never deploys).
 * If this server ever reaches production early, the write surface is locked
 * by default instead of relying on nobody forgetting.
 *
 * The real implementation replaces the body with: verify the Bearer JWT
 * against the Cognito pool's JWKS (aws-jwt-verify), 401 on failure.
 */
const devBypass = process.env.AUTH_DEV_BYPASS === 'true'

export const requireAuth: RequestHandler = (_req, res, next) => {
  if (devBypass) return next()
  res.status(401).json({ message: 'Authentication required' })
}

if (devBypass) {
  console.warn('[auth] AUTH_DEV_BYPASS is on — write routes are open (dev only)')
}
