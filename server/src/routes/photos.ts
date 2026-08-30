import { Router } from 'express'
import { pool } from '../db/pool'

const router = Router()

/**
 * Read-only for now. The write side (presign → browser PUTs to S3 → confirm)
 * is deliberately absent: it needs the AWS SDK, the bucket wiring, and real
 * auth in front of it — that's the next chapter, built as one piece.
 *
 * Rows store S3 keys; the public URL is composed here, at read time, from
 * ASSET_BASE_URL (the future CloudFront domain). Change the CDN, change one
 * env var, zero rows rewritten.
 */
const ASSET_BASE_URL = process.env.ASSET_BASE_URL ?? ''

router.get('/', async (_req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT s3_key AS key, caption, tags, show_id AS "showId"
         FROM photos
        ORDER BY sort_order, created_at DESC`,
    )
    res.json(rows.map((row) => ({ ...row, url: `${ASSET_BASE_URL}/${row.key}` })))
  } catch (err) {
    console.error('[photos:list]', err)
    res.status(500).json({ message: 'Could not load photos' })
  }
})

export default router
