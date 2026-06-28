import 'dotenv/config'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'
import mysql, { type RowDataPacket } from 'mysql2/promise'

const main = async () => {
  const DATABASE_URL = process.env.DATABASE_URL
  if (!DATABASE_URL) throw new Error('DATABASE_URL is not set.')

  const here = dirname(fileURLToPath(import.meta.url))
  const sqlPath = resolve(here, '../../sql/wyze.sql')
  const sql = readFileSync(sqlPath, 'utf8')

  const connection = await mysql.createConnection({
    uri: DATABASE_URL,
    multipleStatements: true,
  })

  console.log('Seeding database from', sqlPath)
  await connection.query(sql)

  const [products] = await connection.query<RowDataPacket[]>(
    'SELECT category, COUNT(*) AS count FROM products GROUP BY category ORDER BY category',
  )
  console.table(products)

  const [variants] = await connection.query<RowDataPacket[]>(
    'SELECT COUNT(*) AS variants FROM product_variants',
  )
  console.log('variants:', variants[0].variants)

  await connection.end()
  console.log('Done.')
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
