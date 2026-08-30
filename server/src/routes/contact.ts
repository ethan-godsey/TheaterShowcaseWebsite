import { Router } from 'express'
import rateLimit from 'express-rate-limit'
import { pool } from '../db/pool'

const router = Router()

/**
 * Public write — the one endpoint that stays unauthenticated by design, so it
 * gets its own defenses: a rate limit here, plus the honeypot on the form.
 * NOTE: once this runs behind CloudFront, req.ip is the proxy's address until
 * `app.set('trust proxy', ...)` is configured — revisit at deploy time.
 */
const contactLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many messages — please try again later' },
})

router.post('/', contactLimiter, async (req, res) => {
  const { name, email, message } = req.body ?? {}

  if (!name || !email || !message) {
    return res.status(400).json({ message: 'name, email, and message are required' })
  }
  // Light-touch checks: real validation of an email is delivery, not regex.
  if (typeof email !== 'string' || !email.includes('@') || email.length > 254) {
    return res.status(400).json({ message: 'That email address does not look right' })
  }
  if (String(message).length > 5000) {
    return res.status(400).json({ message: 'Message is too long (5000 characters max)' })
  }

  try {
    // The DB row is the source of truth; email (SES) becomes a side effect
    // of this insert later. If email delivery ever fails, the message still
    // exists here — that's the whole reason this table exists.
    await pool.query(
      `INSERT INTO contact_messages (name, email, message, ip, user_agent)
       VALUES ($1, $2, $3, $4, $5)`,
      [String(name).slice(0, 200), email, String(message), req.ip ?? null, req.get('user-agent') ?? null],
    )
    res.status(204).end()
  } catch (err) {
    console.error('[contact:create]', err)
    res.status(500).json({ message: 'Could not send your message' })
  }
})

export default router
