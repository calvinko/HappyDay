import type { RowDataPacket } from 'mysql2'
import { pool } from '../db/pool.js'

export type DailyContent = {
  id: number
  userId: number | null
  groupId: string | null
  contentDate: string
  passage: string
  song: string | null
  songUrl: string | null
  supplementary: string | null
}

type DailyContentRow = RowDataPacket & {
  id: number
  user_id: number | null
  group_id: string | null
  content_date: string
  passage: string
  song: string | null
  song_url: string | null
  supplementary: string | null
}

function toDailyContent(row: DailyContentRow): DailyContent {
  return {
    id: row.id,
    userId: row.user_id,
    groupId: row.group_id,
    contentDate: row.content_date,
    passage: row.passage,
    song: row.song,
    songUrl: row.song_url,
    supplementary: row.supplementary,
  }
}

const SELECT_COLUMNS =
  'id, user_id, group_id, content_date, passage, song, song_url, supplementary'

export async function findContentForGroup(
  groupId: string,
): Promise<DailyContent | null> {
  const [rows] = await pool.query<DailyContentRow[]>(
    `SELECT ${SELECT_COLUMNS} FROM daily_content WHERE group_id = ? AND content_date <= CURDATE() ORDER BY content_date DESC LIMIT 1`,
    [groupId],
  )
  return rows[0] ? toDailyContent(rows[0]) : null
}

export async function findContentForUser(
  userId: number,
): Promise<DailyContent | null> {
  const [rows] = await pool.query<DailyContentRow[]>(
    `SELECT ${SELECT_COLUMNS} FROM daily_content WHERE user_id = ? AND content_date <= CURDATE() ORDER BY content_date DESC LIMIT 1`,
    [userId],
  )
  return rows[0] ? toDailyContent(rows[0]) : null
}

// The client only has a freely-typed display name (see HappyDayApp.tsx's
// sign-in flow), not a registered users.id, so it looks a user's content up
// by name instead.
export async function findContentForUserByName(
  displayName: string,
): Promise<DailyContent | null> {
  const columns = SELECT_COLUMNS.split(', ')
    .map((c) => `dc.${c}`)
    .join(', ')
  const [rows] = await pool.query<DailyContentRow[]>(
    `SELECT ${columns} FROM daily_content dc
     JOIN users u ON u.id = dc.user_id
     WHERE u.display_name = ?
     ORDER BY dc.content_date DESC
     LIMIT 1`,
    [displayName],
  )
  return rows[0] ? toDailyContent(rows[0]) : null
}
