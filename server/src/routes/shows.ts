import { Router } from 'express'
import { pool } from '../db/pool'
import { isIdList, reorder } from '../db/reorder'
import { requireAuth } from '../middleware/require-auth'

const router = Router()

// One place for the API's row shape. snake_case is Postgres convention,
// camelCase is the API contract; the aliases are the translation layer.
const SHOW_COLUMNS = `id, title, role, venue, date, poster_key AS poster`

router.get('/', async (_req, res) => {
  try {
    const { rows } = await pool.query(
      // Ellie's own order first. date DESC only breaks ties, which matters
      // until her first reorder: every row starts at sort_order 0.
      `SELECT ${SHOW_COLUMNS} FROM shows ORDER BY sort_order, date DESC`,
    )
    res.json(rows)
  } catch (err) {
    console.error('[shows:list]', err)
    res.status(500).json({ message: 'Could not load shows' })
  }
})

router.post('/', requireAuth, async (req, res) => {
  const { title, role, venue, date } = req.body ?? {}
  if (!title || !role || !venue || !date) {
    return res.status(400).json({ message: 'title, role, venue, and date are required' })
  }

  try {
    const { rows } = await pool.query(
      // New credits go to the end of her order (where the admin list, which
      // appends, already shows them); she drags them up if they matter more.
      `INSERT INTO shows (title, role, venue, date, sort_order)
       VALUES ($1, $2, $3, $4,
               (SELECT COALESCE(MAX(sort_order), 0) + 1 FROM shows))
       RETURNING ${SHOW_COLUMNS}`,
      [title, role, venue, date],
    )
    res.status(201).json(rows[0])
  } catch (err) {
    console.error('[shows:create]', err)
    res.status(500).json({ message: 'Could not create show' })
  }
})

/**
 * Reorder all credits from the complete list of ids in their new order.
 *
 * MUST stay above PUT /:id. Express tries routes in registration order, and
 * /:id matches "/order" too — it would run the edit handler with
 * id = "order" and fail with "title, role, venue, and date are required".
 */
router.put('/order', requireAuth, async (req, res) => {
  const { ids } = req.body ?? {}
  if (!isIdList(ids)) {
    return res.status(400).json({ message: 'Expected a list of unique show ids' })
  }

  try {
    const result = await reorder('shows', ids)
    if (result === 'stale') {
      return res
        .status(409)
        .json({ message: 'The credits changed since this page loaded. Refreshing.' })
    }
    res.status(204).end()
  } catch (err) {
    console.error('[shows:reorder]', err)
    res.status(500).json({ message: 'Could not save the new order' })
  }
})

router.put('/:id', requireAuth, async (req, res) => {
  const { title, role, venue, date } = req.body ?? {}
  if (!title || !role || !venue || !date) {
    return res.status(400).json({ message: 'title, role, venue, and date are required' })
  }

  try {
    const { rows } = await pool.query(
      `UPDATE shows
          SET title = $1, role = $2, venue = $3, date = $4
        WHERE id = $5
       RETURNING ${SHOW_COLUMNS}`,
      [title, role, venue, date, req.params.id],
    )
    // If no rows
    if (rows.length === 0) return res.status(404).json({ message: 'Show not found' })
    res.json(rows[0])
  } catch (err) {
    console.error('[shows:update]', err)
    res.status(500).json({ message: 'Could not update show' })
  }
})

router.delete('/:id', requireAuth, async (req, res) => {
  try {
    const { rowCount } = await pool.query(`DELETE FROM shows WHERE id = $1`, [req.params.id])
    if (rowCount === 0) return res.status(404).json({ message: 'Show not found' })
    res.status(204).end()
  } catch (err) {
    console.error('[shows:delete]', err)
    res.status(500).json({ message: 'Could not delete show' })
  }
})

export default router
