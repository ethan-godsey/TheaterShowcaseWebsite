import { Router } from 'express'
import { pool } from '../db/pool'
import { requireAuth } from '../middleware/require-auth'
import { isAllowedPaperColor } from '../lib/paper-color'

const router = Router()

const PROFILE_COLUMNS = `bio, headline,
  voice_type AS "voiceType", range_low AS "rangeLow", range_high AS "rangeHigh",
  height_inches AS "heightInches", headshot_key AS "headshotKey",
  resume_key AS "resumeKey",
  COALESCE(hero_lede, '')    AS "heroLede",
  COALESCE(hero_billing, '') AS "heroBilling",
  COALESCE(paper_color, '')  AS "paperColor",
  updated_at AS "updatedAt"`

// Generous for a one-line lede, and stops a paste accident becoming the hero.
const MAX_HERO_TEXT = 300

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
  const {
    bio, headline, voiceType, rangeLow, rangeHigh, heightInches, headshotKey, resumeKey,
    heroLede, heroBilling, paperColor,
  } = req.body ?? {}

  // Hero text: '' is a real value here (it means "use the default"), so
  // validate it as a string rather than truthiness.
  for (const [name, value] of [['heroLede', heroLede], ['heroBilling', heroBilling]] as const) {
    if (value !== undefined && (typeof value !== 'string' || value.length > MAX_HERO_TEXT)) {
      return res.status(400).json({ message: `${name} must be text, ${MAX_HERO_TEXT} characters at most` })
    }
  }
  if (paperColor !== undefined && !isAllowedPaperColor(paperColor)) {
    return res.status(400).json({ message: 'That colour is outside the allowed range' })
  }

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
              hero_lede     = COALESCE($9, hero_lede),
              hero_billing  = COALESCE($10, hero_billing),
              paper_color   = COALESCE($11, paper_color),
              updated_at    = now()
        WHERE id = TRUE
       RETURNING ${PROFILE_COLUMNS}`,
      [bio ?? null, headline ?? null, voiceType ?? null, rangeLow ?? null,
       rangeHigh ?? null, heightInches ?? null, headshotKey ?? null, resumeKey ?? null,
       heroLede ?? null, heroBilling ?? null, paperColor ?? null],
    )
    res.json(rows[0])
  } catch (err) {
    console.error('[profile:update]', err)
    res.status(500).json({ message: 'Could not update profile' })
  }
})

export default router
