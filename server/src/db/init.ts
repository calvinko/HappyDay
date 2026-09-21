import { readFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { pool } from './pool.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const schemaPath = path.join(__dirname, '../../sql/schema.sql')

export async function initDb(): Promise<void> {
  const schema = readFileSync(schemaPath, 'utf8')
  const statements = schema
    .split(';')
    .map((statement) => statement.trim())
    .filter(Boolean)

  for (const statement of statements) {
    await pool.query(statement)
  }
}

const isMain = process.argv[1] === fileURLToPath(import.meta.url)
if (isMain) {
  initDb()
    .then(() => {
      console.log('Database schema initialized.')
      return pool.end()
    })
    .catch((err: unknown) => {
      console.error('Failed to initialize database schema:', err)
      process.exitCode = 1
    })
}
