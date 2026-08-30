import { Router } from 'express'
import { pool } from '../db/pool'
import { requireAuth } from '../middleware/require-auth'

const router = Router()

// Double-quoted aliases because Postgres lowercases identifiers otherwise.
const MEDIA_COLUMNS = `id, kind, title,
  embed_url AS "embedUrl", s3_key AS "s3Key",
  category, duration_seconds AS "durationSeconds", sort_order AS "sortOrder"`

router.get('/', async (_req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT ${MEDIA_COLUMNS} FROM media ORDER BY kind, sort_order, created_at`,
    )
    res.json(rows)
  } catch (err) {
    console.error('[media:list]', err)
    res.status(500).json({ message: 'Could not load media' })
  }
})

router.post('/', requireAuth, async (req, res) => {
  const { kind, title, embedUrl, s3Key, category, durationSeconds } = req.body ?? {}

  if (!title || !kind) return res.status(400).json({ message: 'kind and title are required' })
  // Mirror the table's CHECK constraints so bad input is a 400, not a 500.
  if (kind !== 'reel' && kind !== 'song') {
    return res.status(400).json({ message: `kind must be 'reel' or 'song'` })
  }
  if (kind === 'reel' && !embedUrl) {
    return res.status(400).json({ message: 'a reel needs an embedUrl (Vimeo/YouTube embed link)' })
  }
  if (kind === 'song' && !s3Key) {
    return res.status(400).json({ message: 'a song needs an s3Key' })
  }

  try {
    await pool.query(
      `INSERT INTO media (kind, title, embed_url, s3_key, category, duration_seconds)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING ${MEDIA_COLUMNS}`,
      [kind, title, embedUrl ?? null, s3Key ?? null, category ?? null, durationSeconds ?? null],
    )
    res.status(201).json({ kind, title, embedUrl, s3Key, category, durationSeconds })
  } catch (err) {
    console.error('[media:create]', err)
    res.status(500).json({ message: 'Could not create media item' })
  }
})

router.put('/:id', requireAuth, async (req, res) => {
  const { title, embedUrl, s3Key, category, durationSeconds, sortOrder } = req.body ?? {}
  if (!title) return res.status(400).json({ message: 'title is required' })

  try {
    const { rows } = await pool.query(
      `UPDATE media
          SET title = $1, embed_url = $2, s3_key = $3, category = $4,
              duration_seconds = $5, sort_order = COALESCE($6, sort_order)
        WHERE id = $7
       RETURNING ${MEDIA_COLUMNS}`,
      [title, embedUrl ?? null, s3Key ?? null, category ?? null, durationSeconds ?? null, sortOrder ?? null, req.params.id],
    )
    if (rows.length === 0) return res.status(404).json({ message: 'Media item not found' })
    res.json(rows[0])
  } catch (err) {
    console.error('[media:update]', err)
    res.status(500).json({ message: 'Could not update media item' })
  }
})

router.delete('/:id', requireAuth, async (req, res) => {
  try {
    const { rowCount } = await pool.query(`DELETE FROM media WHERE id = $1`, [req.params.id])
    if (rowCount === 0) return res.status(404).json({ message: 'Media item not found' })
    res.status(204).end()
  } catch (err) {
    console.error('[media:delete]', err)
    res.status(500).json({ message: 'Could not delete media item' })
  }
})

export default router
