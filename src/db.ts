import 'dotenv/config'
import mysql from 'mysql2/promise'

const DATABASE_URL = process.env.DATABASE_URL

if (!DATABASE_URL) {
  throw new Error('DATABASE_URL is not set. Add it to your .env file.')
}

export const pool = mysql.createPool(DATABASE_URL)
