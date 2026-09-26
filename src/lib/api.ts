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

export type AuthUser = {
  id: number
  username: string
  displayName: string
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

// GET /api/users/:userId — see server/src/routes/users.ts.
// Returns the user's saved font size, or null if the request fails.
export async function fetchUserFontSize(userId: number): Promise<number | null> {
  const res = await fetch(`${API_BASE}/api/users/${userId}`)
  if (!res.ok) return null
  const data = (await res.json()) as { defaultFontSize: number }
  return data.defaultFontSize
}

// PATCH /api/users/:userId/font-size — see server/src/routes/users.ts.
export async function saveUserFontSize(userId: number, fontSize: number): Promise<void> {
  await fetch(`${API_BASE}/api/users/${userId}/font-size`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ fontSize }),
  })
}
