import { Router } from 'express'
import { pool } from '../db/pool'
import { requireAuth } from '../middleware/require-auth'
import { buildKey, createUploadUrl, deleteObject, isAllowedType } from '../services/storage'

const router = Router()

/*
 * Rows store the S3 KEY; the public URL is composed here, at read time, from
 * ASSET_BASE_URL. Change the CDN domain and you change one env var — not
 * every row in the table.
 */
const ASSET_BASE_URL = process.env.ASSET_BASE_URL ?? 'https://ellieevens.com'

interface PhotoRow {
  id: string
  key: string
  caption: string
  altText: string
  tags: string[]
  sortOrder: number
}

const withUrl = (row: PhotoRow) => ({ ...row, url: `${ASSET_BASE_URL}/${row.key}` })

const COLUMNS = `id, s3_key AS key, caption, alt_text AS "altText",
                 tags, sort_order AS "sortOrder"`

router.get('/', async (_req, res) => {
  try {
    const { rows } = await pool.query<PhotoRow>(
      `SELECT ${COLUMNS} FROM photos ORDER BY sort_order, created_at DESC`,
    )
    res.json(rows.map(withUrl))
  } catch (err) {
    console.error('[photos:list]', err)
    res.status(500).json({ message: 'Could not load photos' })
  }
})

/**
 * Step 1 of the upload: hand back a URL the browser can PUT to.
 * No database row yet — an abandoned upload should leave nothing behind.
 */
router.post('/presign', requireAuth, async (req, res) => {
  const { contentType, folder } = req.body ?? {}

  if (typeof contentType !== 'string' || !isAllowedType(contentType)) {
    return res.status(400).json({ message: 'Unsupported file type' })
  }
  const safeFolder = folder === 'doc' ? 'doc' : 'gallery'

  try {
    const key = buildKey(contentType, safeFolder)
    const uploadUrl = await createUploadUrl(key, contentType)
    res.json({ key, uploadUrl })
  } catch (err) {
    console.error('[photos:presign]', err)
    res.status(500).json({ message: 'Could not prepare the upload' })
  }
})

/**
 * Step 3: the browser confirms the PUT succeeded, and only now does a row
 * exist. Rows therefore never point at objects that aren't in the bucket.
 */
router.post('/', requireAuth, async (req, res) => {
  const { key, caption, altText, tags } = req.body ?? {}
  if (typeof key !== 'string' || !key.startsWith('media/')) {
    return res.status(400).json({ message: 'A valid upload key is required' })
  }

  try {
    const { rows } = await pool.query<PhotoRow>(
      `INSERT INTO photos (s3_key, caption, alt_text, tags)
       VALUES ($1, $2, $3, $4)
       RETURNING ${COLUMNS}`,
      [key, caption ?? '', altText ?? '', Array.isArray(tags) ? tags : []],
    )
    res.status(201).json(withUrl(rows[0]!))
  } catch (err) {
    console.error('[photos:create]', err)
    res.status(500).json({ message: 'Could not save the photo' })
  }
})

router.delete('/:id', requireAuth, async (req, res) => {
  try {
    const { rows } = await pool.query<{ key: string }>(
      `DELETE FROM photos WHERE id = $1 RETURNING s3_key AS key`,
      [req.params.id],
    )
    if (rows.length === 0) return res.status(404).json({ message: 'Photo not found' })

    /*
     * Row first, object second. If the S3 delete fails we're left with an
     * orphaned object — invisible, costs a fraction of a cent. The reverse
     * order risks a row pointing at a file that no longer exists, which is a
     * broken image on her site.
     */
    try {
      await deleteObject(rows[0]!.key)
    } catch (err) {
      console.warn('[photos:delete] row removed but object remains:', rows[0]!.key, err)
    }

    res.status(204).end()
  } catch (err) {
    console.error('[photos:delete]', err)
    res.status(500).json({ message: 'Could not delete the photo' })
  }
})

export default router
