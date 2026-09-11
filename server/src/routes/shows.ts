import { Router } from 'express'
import { pool } from '../db/pool'
import { requireAuth } from '../middleware/require-auth'

const router = Router()

// One place for the API's row shape. snake_case is Postgres convention,
// camelCase is the API contract; the aliases are the translation layer.
const SHOW_COLUMNS = `id, title, role, venue, date, poster_key AS poster`

router.get('/', async (_req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT ${SHOW_COLUMNS} FROM shows ORDER BY date DESC`,
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
      `INSERT INTO shows (title, role, venue, date)
       VALUES ($1, $2, $3, $4)
       RETURNING ${SHOW_COLUMNS}`,
      [title, role, venue, date],
    )
    res.status(201).json(rows[0])
  } catch (err) {
    console.error('[shows:create]', err)
    res.status(500).json({ message: 'Could not create show' })
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
