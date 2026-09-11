// MUST be first: modules below read process.env in their bodies, and imports
// evaluate top-to-bottom. Loading dotenv anywhere later means whichever module
// happens to be imported first sees an empty environment.
import 'dotenv/config'

import express from 'express'
import cors from 'cors'

import { requireAuth } from './middleware/require-auth'
import showsRouter from './routes/shows'
import photosRouter from './routes/photos'
import mediaRouter from './routes/media'
import contactRouter from './routes/contact'
import profileRouter from './routes/profile'

const app = express()

// The host assigns the port in production; 3000 is only the local default.
const PORT = Number(process.env.PORT) || 3000

/*
 * Behind CloudFront (and the platform's own load balancer) every request
 * arrives from a proxy IP. Without this, req.ip is the proxy for ALL traffic
 * and the contact-form rate limiter throttles the entire internet as one user.
 * Set TRUST_PROXY_HOPS in production to the number of proxies in front of us.
 */
app.set('trust proxy', Number(process.env.TRUST_PROXY_HOPS ?? 0))

app.use(cors())
app.use(express.json())

app.get('/health', (_req, res) => {
  res.json({ ok: true })
})

// Cheap authenticated echo — the fastest way to prove a token end to end
// without creating a row you then have to clean up.
app.get('/api/auth/me', requireAuth, (_req, res) => {
  res.json(res.locals.auth)
})

app.use('/api/shows', showsRouter)
app.use('/api/gallery', photosRouter)
app.use('/api/media', mediaRouter)
app.use('/api/contact', contactRouter)
app.use('/api/profile', profileRouter)

app.listen(PORT, () => {
  console.log(`API listening on port ${PORT}`)
})
