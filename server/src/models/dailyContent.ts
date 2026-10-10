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

// The admin editor (server/src/routes/adminContent.ts) edits one exact day at
// a time — including future dates staged in advance — so these look up a
// specific content_date instead of "most recent on or before today".
export async function findContentForGroupOnDate(
  groupId: string,
  date: string,
): Promise<DailyContent | null> {
  const [rows] = await pool.query<DailyContentRow[]>(
    `SELECT ${SELECT_COLUMNS} FROM daily_content WHERE group_id = ? AND content_date = ? LIMIT 1`,
    [groupId, date],
  )
  return rows[0] ? toDailyContent(rows[0]) : null
}

export async function findContentForUserOnDate(
  userId: number,
  date: string,
): Promise<DailyContent | null> {
  const [rows] = await pool.query<DailyContentRow[]>(
    `SELECT ${SELECT_COLUMNS} FROM daily_content WHERE user_id = ? AND content_date = ? LIMIT 1`,
    [userId, date],
  )
  return rows[0] ? toDailyContent(rows[0]) : null
}

// Content staged for today or later, soonest first, for the admin editor's
// "upcoming" list. DATE_FORMAT keeps content_date a plain YYYY-MM-DD string
// instead of a JS Date that would shift with the server's timezone.
const UPCOMING_COLUMNS = SELECT_COLUMNS.replace(
  'content_date',
  "DATE_FORMAT(content_date, '%Y-%m-%d') AS content_date",
)

export async function findUpcomingContentForGroup(
  groupId: string,
): Promise<DailyContent[]> {
  const [rows] = await pool.query<DailyContentRow[]>(
    `SELECT ${UPCOMING_COLUMNS} FROM daily_content WHERE group_id = ? AND content_date >= CURDATE() ORDER BY content_date ASC LIMIT 90`,
    [groupId],
  )
  return rows.map(toDailyContent)
}

export async function findUpcomingContentForUser(
  userId: number,
): Promise<DailyContent[]> {
  const [rows] = await pool.query<DailyContentRow[]>(
    `SELECT ${UPCOMING_COLUMNS} FROM daily_content WHERE user_id = ? AND content_date >= CURDATE() ORDER BY content_date ASC LIMIT 90`,
    [userId],
  )
  return rows.map(toDailyContent)
}

// The most recently dated row for a target, including future dates. The admin
// editor uses it to pre-fill the hymn when adding content for an empty day.
export async function findLatestContentForGroup(
  groupId: string,
): Promise<DailyContent | null> {
  const [rows] = await pool.query<DailyContentRow[]>(
    `SELECT ${UPCOMING_COLUMNS} FROM daily_content WHERE group_id = ? ORDER BY content_date DESC LIMIT 1`,
    [groupId],
  )
  return rows[0] ? toDailyContent(rows[0]) : null
}

export async function findLatestContentForUser(
  userId: number,
): Promise<DailyContent | null> {
  const [rows] = await pool.query<DailyContentRow[]>(
    `SELECT ${UPCOMING_COLUMNS} FROM daily_content WHERE user_id = ? ORDER BY content_date DESC LIMIT 1`,
    [userId],
  )
  return rows[0] ? toDailyContent(rows[0]) : null
}

export type ContentFields = {
  passage: string
  song: string | null
  songUrl: string | null
  supplementary: string | null
}

// Relies on daily_content's uq_daily_content_group_date unique key to upsert:
// a second save for the same group+date updates the existing row in place.
export async function upsertContentForGroup(
  groupId: string,
  date: string,
  fields: ContentFields,
): Promise<void> {
  await pool.query(
    `INSERT INTO daily_content (group_id, content_date, passage, song, song_url, supplementary)
     VALUES (?, ?, ?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE
       passage = VALUES(passage),
       song = VALUES(song),
       song_url = VALUES(song_url),
       supplementary = VALUES(supplementary)`,
    [groupId, date, fields.passage, fields.song, fields.songUrl, fields.supplementary],
  )
}

// Relies on daily_content's uq_daily_content_user_date unique key; see
// upsertContentForGroup.
export async function upsertContentForUser(
  userId: number,
  date: string,
  fields: ContentFields,
): Promise<void> {
  await pool.query(
    `INSERT INTO daily_content (user_id, content_date, passage, song, song_url, supplementary)
     VALUES (?, ?, ?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE
       passage = VALUES(passage),
       song = VALUES(song),
       song_url = VALUES(song_url),
       supplementary = VALUES(supplementary)`,
    [userId, date, fields.passage, fields.song, fields.songUrl, fields.supplementary],
  )
}
