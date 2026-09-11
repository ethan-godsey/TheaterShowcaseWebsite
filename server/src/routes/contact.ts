import { Router } from 'express'
import rateLimit from 'express-rate-limit'
import { pool } from '../db/pool'
import { sendContactNotification } from '../services/email'

const router = Router()

// prevents spam requests
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

    // Respond as soon as the row is safe. The notification is a side effect of
    // a message we have already stored, so the visitor never waits on SES and
    // never sees an error caused by it.
    res.status(204).end()

    void sendContactNotification({
      name: String(name).slice(0, 200),
      email: String(email),
      message: String(message),
    })
  } catch (err) {
    console.error('[contact:create]', err)
    res.status(500).json({ message: 'Could not send your message' })
  }
})

export default router
