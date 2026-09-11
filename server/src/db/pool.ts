import 'dotenv/config'
import { Pool, types } from 'pg'


types.setTypeParser(1082, (value) => value)

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL is not set — add it to server/.env')
}

// connect to DB
export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 5,
})
