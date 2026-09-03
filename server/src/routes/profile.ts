import { Router } from 'express'
import { pool } from '../db/pool'
import { requireAuth } from '../middleware/require-auth'

const router = Router()

const PROFILE_COLUMNS = `bio, headline,
  voice_type AS "voiceType", range_low AS "rangeLow", range_high AS "rangeHigh",
  height_inches AS "heightInches", headshot_key AS "headshotKey",
  resume_key AS "resumeKey", updated_at AS "updatedAt"`

router.get('/', async (_req, res) => {
  try {
    const { rows } = await pool.query(`SELECT ${PROFILE_COLUMNS} FROM profile WHERE id = TRUE`)
    res.json(rows[0] ?? null)
  } catch (err) {
    console.error('[profile:get]', err)
    res.status(500).json({ message: 'Could not load profile' })
  }
})

router.put('/', requireAuth, async (req, res) => {
  const { bio, headline, voiceType, rangeLow, rangeHigh, heightInches, headshotKey, resumeKey } =
    req.body ?? {}

  try {
    // COALESCE makes every field optional: send only what changed, the rest
    // keeps its current value. One endpoint serves every admin form section.
    const { rows } = await pool.query(
      `UPDATE profile
          SET bio           = COALESCE($1, bio),
              headline      = COALESCE($2, headline),
              voice_type    = COALESCE($3, voice_type),
              range_low     = COALESCE($4, range_low),
              range_high    = COALESCE($5, range_high),
              height_inches = COALESCE($6, height_inches),
              headshot_key  = COALESCE($7, headshot_key),
              resume_key    = COALESCE($8, resume_key),
              updated_at    = now()
        WHERE id = TRUE
       RETURNING ${PROFILE_COLUMNS}`,
      [bio ?? null, headline ?? null, voiceType ?? null, rangeLow ?? null,
       rangeHigh ?? null, heightInches ?? null, headshotKey ?? null, resumeKey ?? null],
    )
    res.json(rows[0])
  } catch (err) {
    console.error('[profile:update]', err)
    res.status(500).json({ message: 'Could not update profile' })
  }
})

export default router
