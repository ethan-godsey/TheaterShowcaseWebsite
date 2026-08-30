import 'dotenv/config'
import { Pool, types } from 'pg'

/**
 * One shared pool for the whole process. Neon's connection string is the
 * *pooled* endpoint (pgbouncer on their side), so this also stays safe if
 * this server ever runs on Lambda.
 */

/*
 * THE gotcha of node-postgres: by default it parses SQL DATE (type OID 1082)
 * into a JS Date at local midnight. res.json() then serializes that as a UTC
 * ISO timestamp — "2026-11-04" becomes "2026-11-04T04:00:00.000Z" and the
 * frontend's `date: string` contract breaks. A calendar date should stay a
 * string; this parser override keeps it one.
 */
types.setTypeParser(1082, (value) => value)

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL is not set — add it to server/.env')
}

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 5,
})
