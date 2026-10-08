import type { RowDataPacket } from 'mysql2'
import { pool } from '../db/pool.js'
import { resolveSongBySlug } from './songCatalog.js'

export type Resource = {
  id: number
  no: string
  title: string
  meta: string
  verses: string[]
  songUrl: string | null
}

type ResourceRow = RowDataPacket & {
  id: number
  song_slug: string
}

function toResource(row: ResourceRow): Resource | null {
  const song = resolveSongBySlug(row.song_slug)
  if (!song) {
    console.warn(`resources.id=${row.id}: no catalog entry for slug "${row.song_slug}"`)
    return null
  }
  return {
    id: row.id,
    no: row.song_slug,
    title: song.title,
    meta: song.meta,
    verses: song.verses,
    songUrl: song.songUrl,
  }
}

export async function findResourcesForGroup(
  groupId: string,
): Promise<Resource[]> {
  const [rows] = await pool.query<ResourceRow[]>(
    'SELECT id, song_slug FROM resources WHERE group_id = ? ORDER BY sort_order, id',
    [groupId],
  )
  return rows.map(toResource).filter((r): r is Resource => r !== null)
}

export async function findResourcesForUser(
  userId: number,
): Promise<Resource[]> {
  const [rows] = await pool.query<ResourceRow[]>(
    'SELECT id, song_slug FROM resources WHERE user_id = ? ORDER BY sort_order, id',
    [userId],
  )
  return rows.map(toResource).filter((r): r is Resource => r !== null)
}
