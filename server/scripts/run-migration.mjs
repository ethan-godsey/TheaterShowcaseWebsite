#!/usr/bin/env node
// Run one migration file against DATABASE_URL, inside a transaction.
//
//   node scripts/run-migration.mjs migrations/0001-hero-text-and-paper-color.sql
//
// Run from server/. There is no migrations table: files are written to be
// re-runnable (IF NOT EXISTS), and you run each one by hand, once per database.
import 'dotenv/config'
import { readFile } from 'node:fs/promises'
import pg from 'pg'

const file = process.argv[2]
if (!file) {
  console.error('usage: node scripts/run-migration.mjs <file.sql>')
  process.exit(1)
}
if (!process.env.DATABASE_URL) {
  console.error('DATABASE_URL is not set — add it to server/.env')
  process.exit(1)
}

const sql = await readFile(file, 'utf8')
const client = new pg.Client({ connectionString: process.env.DATABASE_URL })
await client.connect()
console.log(`host: ${new URL(process.env.DATABASE_URL).host}`)
console.log(`running ${file} …`)

try {
  await client.query('BEGIN')
  await client.query(sql)
  await client.query('COMMIT')
  console.log('done.')
} catch (err) {
  await client.query('ROLLBACK').catch(() => {})
  console.error('FAILED, rolled back:', err.message)
  process.exitCode = 1
} finally {
  await client.end()
}
