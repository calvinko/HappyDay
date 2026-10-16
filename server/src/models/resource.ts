import type { RowDataPacket } from 'mysql2'
import { pool } from '../db/pool.js'
import { resolveSongBySlug } from './songCatalog.js'

export type Song = {
  id: number
  no: string
  title: string
  meta: string
  verses: string[]
  songUrl: string | null
}

export type Message = {
  id: number
  title: string
  url: string
  type: 'audio' | 'youtube'
}

export type PresetText = {
  id: number
  title: string
  body: string
}

export type Resources = {
  songs: Song[]
  messages: Message[]
  texts: PresetText[]
}

type ResourceRow = RowDataPacket & {
  id: number
  kind: 'song' | 'message' | 'text'
  song_slug: string | null
  title: string | null
  url: string | null
  body: string | null
}

// The media type is derived from the url, not stored, so it can't disagree
// with the link it describes.
function mediaType(url: string): Message['type'] {
  return /(?:youtube\.com|youtu\.be)\//i.test(url) ? 'youtube' : 'audio'
}

function buildResources(rows: ResourceRow[]): Resources {
  const out: Resources = { songs: [], messages: [], texts: [] }
  for (const row of rows) {
    if (row.kind === 'song') {
      const song = row.song_slug ? resolveSongBySlug(row.song_slug) : null
      if (!song) {
        console.warn(`resources.id=${row.id}: no catalog entry for slug "${row.song_slug}"`)
        continue
      }
      out.songs.push({
        id: row.id,
        no: row.song_slug!,
        title: song.title,
        meta: song.meta,
        verses: song.verses,
        songUrl: song.songUrl,
      })
    } else if (row.kind === 'message') {
      out.messages.push({
        id: row.id,
        title: row.title ?? '',
        url: row.url ?? '',
        type: mediaType(row.url ?? ''),
      })
    } else {
      out.texts.push({ id: row.id, title: row.title ?? '', body: row.body ?? '' })
    }
  }
  return out
}

// Shown when a group has no resources rows of its own (and, through the
// client's user-then-group lookup, to users whose group has none either).
// Same row shape as the table, so they resolve through buildResources.
const DEFAULT_RESOURCE_ROWS: ResourceRow[] = [
  { id: -1, kind: 'song', song_slug: 'S1_222', title: null, url: null, body: null },
  { id: -2, kind: 'song', song_slug: 'H2_45', title: null, url: null, body: null },
] as ResourceRow[]

const COLUMNS = 'id, kind, song_slug, title, url, body'

export async function findResourcesForGroup(groupId: string): Promise<Resources> {
  const [rows] = await pool.query<ResourceRow[]>(
    `SELECT ${COLUMNS} FROM resources WHERE group_id = ? ORDER BY sort_order, id`,
    [groupId],
  )
  return buildResources(rows.length ? rows : DEFAULT_RESOURCE_ROWS)
}

export async function findResourcesForUser(userId: number): Promise<Resources> {
  const [rows] = await pool.query<ResourceRow[]>(
    `SELECT ${COLUMNS} FROM resources WHERE user_id = ? ORDER BY sort_order, id`,
    [userId],
  )
  return buildResources(rows)
}
