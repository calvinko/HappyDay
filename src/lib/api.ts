import type { Hymn } from './data'

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

async function getResources(url: string): Promise<Hymn[]> {
  const res = await fetch(url)
  if (!res.ok) return []
  return (await res.json()) as Hymn[]
}

// GET /api/resources/group/:groupId — see server/src/routes/resources.ts.
// A group's standing hymn list (not date-scoped, unlike daily content).
export function fetchGroupResources(groupId: string): Promise<Hymn[]> {
  return getResources(`${API_BASE}/api/resources/group/${encodeURIComponent(groupId)}`)
}

// GET /api/resources/user/:userId — see server/src/routes/resources.ts.
export function fetchUserResources(userId: number): Promise<Hymn[]> {
  return getResources(`${API_BASE}/api/resources/user/${userId}`)
}

export type UserRole = 'user' | 'groupadmin' | 'appadmin'

export type AuthUser = {
  id: number
  username: string
  displayName: string
  groupId: string
  role: UserRole
  defaultFontSize: number
}
export type AuthResult = { token: string; user: AuthUser }

async function postAuth(
  path: 'login' | 'register',
  body: Record<string, string>,
): Promise<{ ok: true; data: AuthResult } | { ok: false; status: number }> {
  const res = await fetch(`${API_BASE}/api/auth/${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  if (!res.ok) return { ok: false, status: res.status }
  return { ok: true, data: (await res.json()) as AuthResult }
}

// Logs in with username/password, registering a new account first if none
// exists yet (see server/src/routes/auth.ts). Throws if both calls fail.
export async function loginOrRegister(
  username: string,
  password: string,
  displayName: string,
  groupId: string,
): Promise<AuthResult> {
  const login = await postAuth('login', { username, password })
  if (login.ok) return login.data
  if (login.status !== 401) {
    throw new Error(`Login failed: ${login.status}`)
  }

  const register = await postAuth('register', {
    username,
    password,
    displayName,
    groupId,
  })
  if (!register.ok) {
    throw new Error(`Registration failed: ${register.status}`)
  }
  return register.data
}

export type UserProfile = {
  displayName: string
  groupId: string
  role: UserRole
  defaultFontSize: number
}

// GET /api/users/:userId — see server/src/routes/users.ts.
// Returns null if the request fails (e.g. offline, or the account was removed).
export async function fetchUserProfile(userId: number): Promise<UserProfile | null> {
  const res = await fetch(`${API_BASE}/api/users/${userId}`)
  if (!res.ok) return null
  return (await res.json()) as UserProfile
}

// PATCH /api/users/:userId/font-size — see server/src/routes/users.ts.
export async function saveUserFontSize(userId: number, fontSize: number): Promise<void> {
  await fetch(`${API_BASE}/api/users/${userId}/font-size`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ fontSize }),
  })
}

export type AdminTarget =
  | { type: 'group'; id: string }
  | { type: 'user'; id: number }

function adminTargetParams(target: AdminTarget): URLSearchParams {
  return new URLSearchParams({
    targetType: target.type,
    targetId: String(target.id),
  })
}

export type AdminContentFields = {
  passage: string
  song: string | null
  songUrl: string | null
  supplementary: string | null
}

// GET /api/admin/content — see server/src/routes/adminContent.ts. Requires an
// admin (groupadmin/appadmin) bearer token; throws on any non-2xx response
// (including 403 for a groupadmin targeting a group that isn't theirs).
export async function fetchAdminContent(
  token: string,
  target: AdminTarget,
  date: string,
): Promise<DailyContent | null> {
  const params = adminTargetParams(target)
  params.set('date', date)
  const res = await fetch(`${API_BASE}/api/admin/content?${params}`, {
    headers: { Authorization: `Bearer ${token}` },
  })
  if (!res.ok) {
    const body = await res.json().catch(() => null)
    throw new Error(body?.error ?? `Request failed: ${res.status}`)
  }
  return (await res.json()) as DailyContent | null
}

// GET /api/admin/content/upcoming — content staged for today or later, soonest first.
export async function fetchUpcomingAdminContent(
  token: string,
  target: AdminTarget,
): Promise<DailyContent[]> {
  const res = await fetch(
    `${API_BASE}/api/admin/content/upcoming?${adminTargetParams(target)}`,
    { headers: { Authorization: `Bearer ${token}` } },
  )
  if (!res.ok) {
    const body = await res.json().catch(() => null)
    throw new Error(body?.error ?? `Request failed: ${res.status}`)
  }
  return (await res.json()) as DailyContent[]
}

// PUT /api/admin/content — upserts a day's content for a group or user.
export async function saveAdminContent(
  token: string,
  target: AdminTarget,
  date: string,
  fields: AdminContentFields,
): Promise<void> {
  const res = await fetch(`${API_BASE}/api/admin/content`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      targetType: target.type,
      targetId: target.id,
      date,
      ...fields,
    }),
  })
  if (!res.ok) {
    const body = await res.json().catch(() => null)
    throw new Error(body?.error ?? `Save failed: ${res.status}`)
  }
}
