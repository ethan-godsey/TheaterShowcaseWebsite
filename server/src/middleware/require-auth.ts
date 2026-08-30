import type { RequestHandler } from 'express'

/**
 * AUTH STUB — deliberately a pass-through.
 *
 * Every write route is already wrapped in this so the insertion point exists
 * and is greppable. When Cognito lands, this becomes: verify the Bearer JWT
 * against the user pool's JWKS (aws-jwt-verify), 401 on failure.
 *
 * THE RULE THIS ENCODES: none of the routes behind this middleware get
 * deployed anywhere public until this stub is replaced with the real check.
 */
export const requireAuth: RequestHandler = (_req, _res, next) => {
  next()
}

console.warn('[auth] requireAuth is a STUB — do not deploy write routes until it verifies JWTs')
