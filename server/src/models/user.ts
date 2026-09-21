import type { ResultSetHeader, RowDataPacket } from 'mysql2'
import { pool } from '../db/pool.js'

export type User = {
  id: number
  username: string
  passwordHash: string
  displayName: string
  createdAt: string
  lastLoginAt: string | null
}

type UserRow = RowDataPacket & {
  id: number
  username: string
  password_hash: string
  display_name: string
  created_at: string
  last_login_at: string | null
}

function toUser(row: UserRow): User {
  return {
    id: row.id,
    username: row.username,
    passwordHash: row.password_hash,
    displayName: row.display_name,
    createdAt: row.created_at,
    lastLoginAt: row.last_login_at,
  }
}

export async function findUserByUsername(username: string): Promise<User | null> {
  const [rows] = await pool.query<UserRow[]>(
    'SELECT id, username, password_hash, display_name, created_at, last_login_at FROM users WHERE username = ? LIMIT 1',
    [username],
  )
  return rows[0] ? toUser(rows[0]) : null
}

export async function createUser(
  username: string,
  passwordHash: string,
  displayName: string,
): Promise<User> {
  await pool.query<ResultSetHeader>(
    'INSERT INTO users (username, password_hash, display_name) VALUES (?, ?, ?)',
    [username, passwordHash, displayName],
  )
  const user = await findUserByUsername(username)
  if (!user) throw new Error('Failed to load user after insert')
  return user
}

export async function touchLastLogin(id: number): Promise<void> {
  await pool.query('UPDATE users SET last_login_at = CURRENT_TIMESTAMP WHERE id = ?', [id])
}
