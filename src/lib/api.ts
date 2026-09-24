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

const API_BASE = (
  import.meta.env.VITE_API_BASE_URL ?? 'https://kosolution.net/happyday'
).replace(/\/+$/, '')

async function getContent(url: string): Promise<DailyContent | null> {
  const res = await fetch(url)
  if (res.status === 404) return null
  if (!res.ok) throw new Error(`Request to ${url} failed: ${res.status}`)
  return (await res.json()) as DailyContent
}

// GET /api/content/group/:groupId — see server/src/routes/content.ts.
// Returns the group's most recently assigned content, or null if it has none.
export function fetchGroupContent(groupId: string): Promise<DailyContent | null> {
  return getContent(`${API_BASE}/api/content/group/${encodeURIComponent(groupId)}`)
}

// GET /api/content/user/:userId — see server/src/routes/content.ts.
// Returns the user's most recently assigned content, or null if they have none.
export function fetchUserContent(userId: number): Promise<DailyContent | null> {
  return getContent(`${API_BASE}/api/content/user/${userId}`)
}

// GET /api/content/user/by-name/:name — see server/src/routes/content.ts.
// The client only has a freely-typed display name (no real account/id), so
// user-specific content is looked up by name instead of a numeric user id.
export function fetchUserContentByName(name: string): Promise<DailyContent | null> {
  return getContent(
    `${API_BASE}/api/content/user/by-name/${encodeURIComponent(name)}`,
  )
}
