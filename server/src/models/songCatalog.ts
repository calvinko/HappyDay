import { readFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

// resources rows store a bare song_slug (e.g. "GFH2_1"); this is what
// resolves that reference to the actual title/lyrics/audio. See
// server/data/songs.json (not a server/sql table — it's a large, mostly
// static catalog, so it's loaded from disk rather than migrated into MySQL).
type CatalogSong = {
  name: string
  content: string
  mp3: string | null
  hymn: string
  pageNumber: string
}

type HymnBook = {
  bookFullName: string
}

type Catalog = {
  songs: Record<string, CatalogSong>
  hymnBooks: Record<string, HymnBook>
}

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const catalogPath = path.join(__dirname, '../../data/songs.json')
const catalog = JSON.parse(readFileSync(catalogPath, 'utf-8')) as Catalog

// Some catalog entries store `mp3` as a root-relative path instead of a full
// URL (e.g. "/song-audio/english/GFH2_1.mp3") — those are relative to this
// origin, not ours, so they need the prefix joined back on.
const MP3_BASE_URL = 'http://songapp.vercel.app/'

function resolveMp3Url(mp3: string | null): string | null {
  if (!mp3) return null
  if (/^https?:\/\//.test(mp3)) return mp3
  return MP3_BASE_URL + mp3.replace(/^\/+/, '')
}

export type ResolvedSong = {
  title: string
  meta: string
  verses: string[]
  songUrl: string | null
}

// The catalog's `content` is one blob with verses separated by a blank line
// and numbered inline (e.g. "1. ...\n\n2. ..."), matching how the app's
// static Hymn.verses are already written (one full verse per array entry).
function splitVerses(content: string): string[] {
  return content
    .split(/\n\s*\n/)
    .map((v) => v.trim())
    .filter(Boolean)
}

export function resolveSongBySlug(slug: string): ResolvedSong | null {
  const song = catalog.songs[slug]
  if (!song) return null

  const book = catalog.hymnBooks[song.hymn]
  const bookLabel = book?.bookFullName ?? song.hymn
  return {
    title: song.name,
    meta: `${bookLabel} · p.${song.pageNumber}`,
    verses: splitVerses(song.content ?? ''),
    songUrl: resolveMp3Url(song.mp3),
  }
}
