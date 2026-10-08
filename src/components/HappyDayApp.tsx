import { useEffect, useState, type ReactNode } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkBreaks from 'remark-breaks'
import {
  fetchAdminContent,
  fetchGroupContent,
  fetchGroupResources,
  fetchUserContent,
  fetchUserProfile,
  fetchUserResources,
  loginOrRegister,
  saveAdminContent,
  saveUserFontSize,
  type AdminTarget,
  type DailyContent,
  type UserRole,
} from '../lib/api'
import {
  BUILTIN_GROUPS,
  GROUP_CONTENT,
  HYMNS,
  TODAY,
  VERSES,
  type Hymn,
} from '../lib/data'

// Passage and song content support markdown (bold/italic/links, single
// newlines as line breaks). Paragraphs render as fragments so this can be
// dropped into any inline or block container without invalid nesting.
const MARKDOWN_COMPONENTS = {
  p: ({ children }: { children?: ReactNode }) => <>{children}</>,
}

function Markdown({ children }: { children: string }) {
  return (
    <ReactMarkdown remarkPlugins={[remarkBreaks]} components={MARKDOWN_COMPONENTS}>
      {children}
    </ReactMarkdown>
  )
}

// Song content may lead with a "T:<title>" line — if so, that's the hymn
// title and the rest of the lines are the lyrics; otherwise the whole string
// is lyrics with no separate title.
function parseSongTitle(song: string): { title: string; body: string } {
  const [firstLine, ...rest] = song.split('\n')
  const trimmedFirst = firstLine?.trim() ?? ''
  if (!trimmedFirst.startsWith('T:')) {
    return { title: '', body: song }
  }
  return { title: trimmedFirst.slice(2).trim(), body: rest.join('\n').trim() }
}

// Server-backed resources have a stable numeric id; the static/legacy
// single-song fallback doesn't, so its hymn number stands in as the key.
function hymnKey(h: Hymn): string | number {
  return h.id ?? h.no
}

function timeOfDayGreeting(): string {
  const hour = new Date().getHours()
  if (hour < 12) return 'Good morning'
  if (hour < 17) return 'Good afternoon'
  return 'Good evening'
}

// Local calendar date (not UTC — Date#toISOString would roll over a day early
// or late depending on timezone), formatted for a native <input type="date">.
function todayISODate(): string {
  const d = new Date()
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  return `${d.getFullYear()}-${mm}-${dd}`
}

type Screen = 'home' | 'passage' | 'resources' | 'hymn' | 'profile' | 'admin'

export type Group = { id: string; label: string }

type Props = {
  navModel?: 'tabs' | 'top'
  groups?: Group[]
}

const KICKER = 'text-[11px] font-bold tracking-[0.14em] text-accent-700'
const ICON_BTN =
  'flex h-[30px] w-[30px] items-center justify-center border-2 border-ink font-bold hover:bg-surface'

const DEFAULT_GROUPS: Group[] = [
  { id: 'sj_senior', label: 'SJ 長者' },
  { id: 'sf_senior', label: 'SF 長者' },
  { id: 'bra_senior', label: '巴西長者' },
]

const NAME_KEY = 'happyday.name'
const GROUP_KEY = 'happyday.group'
const USER_ID_KEY = 'happyday.userId'
const TOKEN_KEY = 'happyday.token'
const INVITE_CODE = '43236'

// The sign-in flow never shows a password field. Username is the display
// name with spaces stripped, and password is derived from that username plus
// the shared invite code (server still requires one) — matching the scheme
// server/sql/seed_users.sql pre-seeds accounts with.
function usernameFor(name: string): string {
  return name.replace(/\s+/g, '')
}

function passwordFor(username: string): string {
  return `${username}-${INVITE_CODE}`
}

function readName(): string {
  try {
    return localStorage.getItem(NAME_KEY) ?? ''
  } catch {
    return ''
  }
}

function writeName(value: string) {
  try {
    if (value) localStorage.setItem(NAME_KEY, value)
    else localStorage.removeItem(NAME_KEY)
  } catch {
    /* private mode or blocked storage — the name just won't persist */
  }
}

function readGroup(): string {
  try {
    return localStorage.getItem(GROUP_KEY) ?? ''
  } catch {
    return ''
  }
}

function writeGroup(value: string) {
  try {
    if (value) localStorage.setItem(GROUP_KEY, value)
    else localStorage.removeItem(GROUP_KEY)
  } catch {
    /* private mode or blocked storage — the group just won't persist */
  }
}

function readUserId(): number | null {
  try {
    const raw = localStorage.getItem(USER_ID_KEY)
    return raw ? Number(raw) : null
  } catch {
    return null
  }
}

function writeAuth(userId: number | null, token: string) {
  try {
    if (userId) {
      localStorage.setItem(USER_ID_KEY, String(userId))
      localStorage.setItem(TOKEN_KEY, token)
    } else {
      localStorage.removeItem(USER_ID_KEY)
      localStorage.removeItem(TOKEN_KEY)
    }
  } catch {
    /* private mode or blocked storage — auth just won't persist */
  }
}

function readToken(): string {
  try {
    return localStorage.getItem(TOKEN_KEY) ?? ''
  } catch {
    return ''
  }
}

function HappyDayApp({
  navModel = 'tabs',
  groups = DEFAULT_GROUPS,
}: Props) {
  const [screen, setScreen] = useState<Screen>(() =>
    readName() ? 'home' : 'profile',
  )
  const [read, setRead] = useState(false)
  const [size, setSize] = useState(20)
  const [selectedHymnKey, setSelectedHymnKey] = useState<string | number | null>(
    null,
  )
  const [hymnFrom, setHymnFrom] = useState<'home' | 'resources'>('resources')
  const [reminder, setReminder] = useState(true)
  const [name, setName] = useState(() => readName())
  const [group, setGroup] = useState(() => readGroup())
  const [userId, setUserId] = useState(() => readUserId())
  const [role, setRole] = useState<UserRole>('user')
  const [draft, setDraft] = useState('')
  const [draftGroup, setDraftGroup] = useState('')
  const [draftCode, setDraftCode] = useState('')
  const [codeError, setCodeError] = useState(false)
  const [nameError, setNameError] = useState(false)
  const [signingIn, setSigningIn] = useState(false)
  const [showNameSuggestions, setShowNameSuggestions] = useState(false)
  const [signInStep, setSignInStep] = useState<'code' | 'group' | 'name'>(
    'code',
  )

  const [adminTargetType, setAdminTargetType] = useState<'group' | 'user'>('group')
  const [adminGroupId, setAdminGroupId] = useState('')
  const [adminUserId, setAdminUserId] = useState('')
  const [adminDate, setAdminDate] = useState(() => todayISODate())
  const [adminPassage, setAdminPassage] = useState('')
  const [adminSong, setAdminSong] = useState('')
  const [adminSongUrl, setAdminSongUrl] = useState('')
  const [adminSupplementary, setAdminSupplementary] = useState('')
  const [adminStatus, setAdminStatus] = useState<
    'idle' | 'saving' | 'saved' | 'error'
  >('idle')
  const [adminError, setAdminError] = useState('')

  const [remoteContent, setRemoteContent] = useState<{
    name: string
    group: string
    data: DailyContent | null
  } | null>(null)

  const [remoteResources, setRemoteResources] = useState<{
    name: string
    group: string
    data: Hymn[]
  } | null>(null)

  useEffect(() => {
    if (!userId) return
    let cancelled = false
    fetchUserProfile(userId).then((profile) => {
      if (cancelled || !profile) return
      if (Number.isFinite(profile.defaultFontSize)) setSize(profile.defaultFontSize)
      setRole(profile.role)
    })
    return () => {
      cancelled = true
    }
  }, [userId])

  useEffect(() => {
    if (!group) return
    let cancelled = false
    // Checks for content assigned to this person first, then falls back to
    // their group's content (see fetchUserContent/fetchGroupContent).
    const userContent = userId ? fetchUserContent(userId) : Promise.resolve(null)
    userContent
      .catch(() => null)
      .then((data) => data ?? fetchGroupContent(group).catch(() => null))
      .then((data) => {
        if (!cancelled) setRemoteContent({ name, group, data })
      })
    return () => {
      cancelled = true
    }
  }, [name, group, userId])

  useEffect(() => {
    if (!group) return
    let cancelled = false
    // Resources are a standing per-user/per-group list, not date-scoped like
    // daily_content, so they're fetched independently (see
    // fetchUserResources/fetchGroupResources).
    const userResources = userId ? fetchUserResources(userId) : Promise.resolve([])
    userResources
      .catch(() => [])
      .then((data) => (data.length ? data : fetchGroupResources(group).catch(() => [])))
      .then((data) => {
        if (!cancelled) setRemoteResources({ name, group, data })
      })
    return () => {
      cancelled = true
    }
  }, [name, group, userId])

  useEffect(() => {
    if (screen !== 'admin') return
    const target: AdminTarget =
      role === 'groupadmin'
        ? { type: 'group', id: group }
        : adminTargetType === 'group'
          ? { type: 'group', id: adminGroupId }
          : { type: 'user', id: Number(adminUserId) }
    const ready =
      target.type === 'group' ? target.id !== '' : Number.isInteger(target.id) && target.id > 0
    if (!ready) return

    let cancelled = false
    fetchAdminContent(readToken(), target, adminDate)
      .then((data) => {
        if (cancelled) return
        setAdminError('')
        setAdminPassage(data?.passage ?? '')
        setAdminSong(data?.song ?? '')
        setAdminSongUrl(data?.songUrl ?? '')
        setAdminSupplementary(data?.supplementary ?? '')
        setAdminStatus('idle')
      })
      .catch((err: unknown) => {
        if (cancelled) return
        setAdminError(err instanceof Error ? err.message : 'Failed to load content')
        setAdminStatus('error')
      })
    return () => {
      cancelled = true
    }
  }, [screen, role, group, adminTargetType, adminGroupId, adminUserId, adminDate])

  const saveAdminForm = async () => {
    if (!adminTargetReady || !adminPassage.trim()) return
    setAdminStatus('saving')
    setAdminError('')
    try {
      await saveAdminContent(readToken(), adminTarget, adminDate, {
        passage: adminPassage.trim(),
        song: adminSong.trim() ? adminSong.trim() : null,
        songUrl: adminSongUrl.trim() ? adminSongUrl.trim() : null,
        supplementary: adminSupplementary.trim() ? adminSupplementary.trim() : null,
      })
      setAdminStatus('saved')
    } catch (err) {
      setAdminError(err instanceof Error ? err.message : 'Failed to save content')
      setAdminStatus('error')
    }
  }

  const fetchedContent =
    remoteContent?.name === name && remoteContent?.group === group
      ? remoteContent.data
      : null

  const fetchedResources =
    remoteResources?.name === name && remoteResources?.group === group
      ? remoteResources.data
      : []

  // Prefers the server's content for today; falls back to the static
  // GROUP_CONTENT placeholder on a fetch error or when nothing's assigned yet,
  // and further to the static HYMNS/TODAY data when the group has neither.
  const groupContent = fetchedContent
    ? {
        passage: fetchedContent.passage,
        song: fetchedContent.song ?? '',
        songUrl: fetchedContent.songUrl,
        supplementary: fetchedContent.supplementary,
      }
    : GROUP_CONTENT[group]
  const song = groupContent ? parseSongTitle(groupContent.song) : null
  // The resources table (see server/sql/schema.sql) is a real, standing list
  // of hymns per user/group; daily_content's single song/songUrl columns only
  // fit one, so they're synthesized into a one-item list as a fallback when
  // no resources are assigned.
  const hymns: Hymn[] = fetchedResources.length
    ? fetchedResources
    : groupContent && song
      ? [
          {
            no: '—',
            title: song.title,
            meta: '',
            verses: song.body ? [song.body] : [],
            songUrl: groupContent.songUrl,
          },
        ]
      : HYMNS
  const content = groupContent ?? {
    passage: TODAY.passageRef,
    song: hymns[0].title,
    supplementary: null,
  }
  const signedIn = name !== ''
  const firstName = name.split(' ')[0]
  const chrome = screen !== 'passage' && screen !== 'hymn' && screen !== 'admin'
  const isAdmin = role === 'groupadmin' || role === 'appadmin'
  // groupadmin is locked to their own group; appadmin can target either a
  // group or a specific user (see server/src/routes/adminContent.ts).
  const adminTarget: AdminTarget =
    role === 'groupadmin'
      ? { type: 'group', id: group }
      : adminTargetType === 'group'
        ? { type: 'group', id: adminGroupId }
        : { type: 'user', id: Number(adminUserId) }
  const adminTargetReady =
    adminTarget.type === 'group'
      ? adminTarget.id !== ''
      : Number.isInteger(adminTarget.id) && adminTarget.id > 0
  const selectedHymn =
    hymns.find((h) => hymnKey(h) === selectedHymnKey) ?? hymns[0]

  const openHymn = (h: Hymn, from: 'home' | 'resources') => {
    setSelectedHymnKey(hymnKey(h))
    setHymnFrom(from)
    setScreen('hymn')
  }

  const labelForGroup = (id: string) =>
    groups.find((g) => g.id === id)?.label ?? id

  const nameSuggestions = (BUILTIN_GROUPS[draftGroup] ?? []).filter((m) =>
    m.toLowerCase().includes(draft.trim().toLowerCase()),
  )

  const submitCode = () => {
    if (draftCode.trim() !== INVITE_CODE) {
      setCodeError(true)
      return
    }
    setCodeError(false)
    setSignInStep('group')
  }

  const chooseGroup = (id: string) => {
    setDraftGroup(id)
    setSignInStep('name')
  }

  const signIn = async () => {
    const clean = draft.trim().replace(/\s+/g, ' ')
    if (!clean || !draftGroup) return
    setNameError(false)
    setSigningIn(true)
    try {
      const username = usernameFor(clean)
      const auth = await loginOrRegister(
        username,
        passwordFor(username),
        clean,
        draftGroup,
      )
      setName(clean)
      writeName(clean)
      setGroup(draftGroup)
      writeGroup(draftGroup)
      setUserId(auth.user.id)
      writeAuth(auth.user.id, auth.token)
      setRole(auth.user.role)
      if (Number.isFinite(auth.user.defaultFontSize)) {
        setSize(auth.user.defaultFontSize)
      }
      setDraft('')
      setDraftGroup('')
      setDraftCode('')
      setCodeError(false)
      setShowNameSuggestions(false)
      setSignInStep('code')
    } catch {
      setNameError(true)
    } finally {
      setSigningIn(false)
    }
  }

  const signOut = () => {
    setName('')
    writeName('')
    setUserId(null)
    writeAuth(null, '')
    setRole('user')
    setDraftGroup('')
    setDraftCode('')
    setCodeError(false)
    setShowNameSuggestions(false)
    setSignInStep('code')
  }

  const grow = () =>
    setSize((s) => {
      const next = Math.min(26, s + 2)
      if (userId) saveUserFontSize(userId, next).catch(() => {})
      return next
    })
  const shrink = () =>
    setSize((s) => {
      const next = Math.max(15, s - 2)
      if (userId) saveUserFontSize(userId, next).catch(() => {})
      return next
    })

  return (
    <div className="relative mx-auto flex h-svh w-full max-w-[760px] flex-col overflow-hidden bg-ground pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)]">
      {navModel === 'top' && chrome && (
        <nav className="flex flex-none gap-5 border-b-2 border-ink px-[18px] pt-2.5 pb-2.5">
          {(
            [
              ['Today', 'home'],
              ['Resources', 'resources'],
              ['Me', 'profile'],
            ] as const
          ).map(([label, target]) => (
            <button
              key={target}
              type="button"
              onClick={() => setScreen(target)}
              className={`py-1 text-[13px] font-bold tracking-[0.08em] uppercase ${
                screen === target ? 'text-accent' : 'text-ink'
              }`}
            >
              {label}
            </button>
          ))}
        </nav>
      )}

      <div className="flex-1 overflow-x-hidden overflow-y-auto [scrollbar-width:none]">
        {screen === 'home' && (
          <div className="animate-hd-in">
            <div className="flex items-baseline justify-between border-b-2 border-ink px-[18px] pt-4 pb-3.5">
              <span className="text-[22px] font-black tracking-[0.14em]">
                快樂每一天 HAPPY DAY
              </span>
              <span className="text-sm font-semibold tracking-wide text-ash-700">
                {TODAY.dateLong}
              </span>
            </div>

            <div className="flex items-center gap-3 px-[18px] pt-3.5">
              <p className="flex-1 text-xl font-extrabold text-ink">
                {signedIn
                  ? `${timeOfDayGreeting()}, ${firstName}.`
                  : `${timeOfDayGreeting()}.`}
              </p>
              <button
                type="button"
                onClick={shrink}
                disabled={size <= 15}
                className={`${ICON_BTN} text-xs disabled:cursor-not-allowed disabled:opacity-40`}
              >
                A-
              </button>
              <button
                type="button"
                onClick={grow}
                disabled={size >= 26}
                className={`${ICON_BTN} text-sm disabled:cursor-not-allowed disabled:opacity-40`}
              >
                A+
              </button>
            </div>

            <section className="border-b-2 border-ink px-[18px] pt-3.5 pb-5">
              <div className={`${KICKER} mb-2.5`}>TODAY&rsquo;S PASSAGE</div>
              <p
                className="mb-[18px] leading-relaxed text-ash-800 [text-wrap:pretty]"
                style={{ fontSize: size }}
              >
                <Markdown>{content.passage}</Markdown>
              </p>
              <button
                type="button"
                onClick={() => setScreen('passage')}
                className="hidden w-full items-center gap-2.5 bg-accent px-4 py-[15px] text-left text-[15px] font-bold tracking-wide text-white hover:bg-accent-600 active:bg-accent-700"
              >
                <span className="flex-1">
                  {read ? 'Read again' : 'Read the whole chapter'}
                </span>
                <span className="text-lg">&rarr;</span>
              </button>
            </section>

            <section className="px-[18px] pt-5 pb-2">
              <div className={`${KICKER} mb-3.5`}>TODAY&rsquo;S HYMNS</div>
              {hymns.map((h) => (
                <div key={hymnKey(h)} className="border-t border-ink/40 py-3.5">
                  <div className="flex items-center gap-3.5">
                    <span className="min-w-[54px] text-[26px] font-extrabold text-ash-400">
                      {h.no}
                    </span>
                    <span className="flex flex-1 flex-col gap-[3px]">
                      <span className="text-[17px] font-bold">{h.title}</span>
                      <span className="text-xs font-medium tracking-wide text-ash-700">
                        {h.meta}
                      </span>
                    </span>
                  </div>
                  {h.verses.map((v, i) => (
                    <span
                      key={i}
                      className="mt-3 block leading-[1.65] [text-wrap:pretty]"
                      style={{ fontSize: size }}
                    >
                      <Markdown>{v}</Markdown>
                    </span>
                  ))}
                  {h.songUrl && (
                    <audio controls className="mt-3 w-full" src={h.songUrl} />
                  )}
                </div>
              ))}
            </section>

          </div>
        )}

        {screen === 'passage' && (
          <div className="animate-hd-in">
            <header className="sticky top-0 z-10 flex items-center gap-3 border-b-2 border-ink bg-ground px-[18px] py-3">
              <button
                type="button"
                onClick={() => setScreen('home')}
                className="text-xl leading-none"
              >
                &larr;
              </button>
              <span className="flex-1 text-[15px] font-bold">
                <Markdown>{content.passage}</Markdown>
              </span>
              <button
                type="button"
                onClick={shrink}
                className={`${ICON_BTN} text-xs`}
              >
                A-
              </button>
              <button
                type="button"
                onClick={grow}
                className={`${ICON_BTN} text-sm`}
              >
                A+
              </button>
            </header>
            <div className="px-[18px] pt-5 pb-2">
              <div className={`${KICKER} mb-1.5`}>{TODAY.translation}</div>
              <h1 className="mb-[18px] text-[28px] leading-tight font-extrabold">
                {TODAY.passageTitle}
              </h1>
              {VERSES.map((t, i) => (
                <p key={i} className="mb-3.5 flex items-start gap-2.5">
                  <span className="min-w-[18px] pt-1 text-[11px] font-bold text-accent">
                    {i + 1}
                  </span>
                  <span
                    className="flex-1 leading-[1.7] [text-wrap:pretty]"
                    style={{ fontSize: size }}
                  >
                    {t}
                  </span>
                </p>
              ))}
            </div>
            <div className="px-[18px] pt-2 pb-7">
              <button
                type="button"
                onClick={() => setRead((r) => !r)}
                className={`flex w-full items-center gap-2.5 border-2 border-ink px-4 py-[15px] text-left text-[15px] font-bold tracking-wide ${
                  read
                    ? 'bg-accent text-white'
                    : 'bg-transparent text-ink hover:bg-surface'
                }`}
              >
                <span className="flex-1">
                  {read ? 'Marked as read' : 'Mark as read'}
                </span>
                <span className="text-base">{read ? '✓' : ''}</span>
              </button>
              <button
                type="button"
                onClick={() => openHymn(hymns[0], 'home')}
                className="mt-5 flex w-full items-center gap-2.5 border-t border-ink/40 pt-3.5 text-left text-sm font-bold"
              >
                <span className="flex-1">
                  Next: hymn {hymns[0].no}, {hymns[0].title}
                </span>
                <span className="text-accent-700">&rarr;</span>
              </button>
            </div>
          </div>
        )}

        {screen === 'resources' && (
          <div className="animate-hd-in px-[18px] pt-[18px] pb-7">
            <h1 className="mb-1 text-3xl leading-tight font-extrabold">
              Resources
            </h1>
            <p className="mb-5 text-[13px] font-medium text-ash-700">
              Hymns designated for {TODAY.dateLong}
            </p>
            {hymns.map((h) => (
              <button
                key={hymnKey(h)}
                type="button"
                onClick={() => openHymn(h, 'resources')}
                className="flex w-full items-center gap-3.5 border-t-2 border-ink py-4 text-left hover:bg-surface"
              >
                <span className="min-w-[58px] text-3xl font-extrabold text-accent">
                  {h.no}
                </span>
                <span className="flex min-w-0 flex-1 flex-col gap-[3px]">
                  <span className="text-lg font-bold">{h.title}</span>
                  <span className="text-xs font-medium text-ash-700">
                    {h.meta ||
                      `${h.verses.length} verse${h.verses.length === 1 ? '' : 's'}`}
                  </span>
                  {h.verses[0] && (
                    <span className="mt-0.5 line-clamp-1 text-[13px] text-ash-700">
                      {h.verses[0].split('\n')[0]}
                    </span>
                  )}
                </span>
                {h.songUrl && (
                  <span
                    aria-label="Recording available"
                    className="text-lg text-accent-700"
                  >
                    &#9835;
                  </span>
                )}
                <span className="text-xl text-ash-400" aria-hidden>
                  &rarr;
                </span>
              </button>
            ))}
          </div>
        )}

        {screen === 'hymn' && selectedHymn && (
          <div className="animate-hd-in">
            <header className="sticky top-0 z-10 flex items-center gap-3 border-b-2 border-ink bg-ground px-[18px] py-3">
              <button
                type="button"
                onClick={() => setScreen(hymnFrom)}
                className="text-xl leading-none"
              >
                &larr;
              </button>
              <span className="flex-1 text-[15px] font-bold">
                {selectedHymn.title}
              </span>
              <button
                type="button"
                onClick={shrink}
                className={`${ICON_BTN} text-xs`}
              >
                A-
              </button>
              <button
                type="button"
                onClick={grow}
                className={`${ICON_BTN} text-sm`}
              >
                A+
              </button>
            </header>
            <div className="px-[18px] pt-5 pb-7">
              <div className={`${KICKER} mb-1.5`}>
                HYMN {selectedHymn.no}
              </div>
              <h1 className="mb-1 text-[28px] leading-tight font-extrabold">
                {selectedHymn.title}
              </h1>
              {selectedHymn.meta && (
                <p className="mb-4 text-[13px] font-medium text-ash-700">
                  {selectedHymn.meta}
                </p>
              )}
              {selectedHymn.songUrl && (
                <audio
                  controls
                  className="mb-5 w-full"
                  src={selectedHymn.songUrl}
                />
              )}
              {selectedHymn.verses.map((v, i) => (
                <p key={i} className="mb-4 flex items-start gap-2.5">
                  <span className="min-w-[18px] pt-1 text-[11px] font-bold text-accent">
                    {i + 1}
                  </span>
                  <span
                    className="flex-1 whitespace-pre-line leading-[1.7] [text-wrap:pretty]"
                    style={{ fontSize: size }}
                  >
                    <Markdown>{v}</Markdown>
                  </span>
                </p>
              ))}
            </div>
          </div>
        )}

        {screen === 'profile' && !signedIn && signInStep === 'code' && (
          <form
            className="animate-hd-in flex min-h-full flex-col px-[18px] pt-[18px] pb-7"
            onSubmit={(e) => {
              e.preventDefault()
              submitCode()
            }}
          >
            <div className={KICKER}>ME</div>
            <h1 className="mt-2.5 text-[40px] leading-[0.98] font-extrabold tracking-[-0.02em]">
              Enter invitation code
            </h1>
            <p className="mt-3.5 text-base leading-relaxed text-ash-800 [text-wrap:pretty]">
              Ask your group leader for the invitation code.
            </p>

            <div className="mt-7 border-t-2 border-ink pt-5">
              <label
                htmlFor="hd-code"
                className="block text-[11px] font-bold tracking-[0.12em] text-ash-700"
              >
                INVITATION CODE
              </label>
              <input
                id="hd-code"
                name="code"
                type="text"
                inputMode="numeric"
                value={draftCode}
                onChange={(e) => {
                  setDraftCode(e.target.value)
                  setCodeError(false)
                }}
                autoComplete="off"
                spellCheck={false}
                maxLength={10}
                placeholder="00000"
                autoFocus
                className="mt-2.5 w-full border-2 border-ink bg-transparent px-3.5 py-3.5 text-[22px] font-bold tracking-[-0.01em] placeholder:font-medium placeholder:text-ash-400 focus:bg-surface"
              />
              {codeError && (
                <p className="mt-2.5 text-[13px] font-semibold text-accent-700">
                  Wrong code. Please try again.
                </p>
              )}
              <button
                type="submit"
                disabled={draftCode.trim() === ''}
                className="mt-3.5 flex w-full items-center gap-2.5 border-2 border-accent bg-accent px-4 py-[13px] text-left text-[15px] font-bold tracking-wide text-white hover:border-accent-600 hover:bg-accent-600 active:border-accent-700 active:bg-accent-700 disabled:cursor-not-allowed disabled:border-ash-400 disabled:bg-transparent disabled:text-ash-500"
              >
                <span className="flex-1">Continue</span>
                <span className="text-lg">&rarr;</span>
              </button>
            </div>

            <div className="mt-auto border-t-2 border-ink pt-3.5">
              <span className="text-[13px] leading-snug font-medium text-ash-800">
                No account and no password. Just the code your group shared.
              </span>
            </div>
          </form>
        )}

        {screen === 'profile' && !signedIn && signInStep === 'group' && (
          <div className="animate-hd-in flex min-h-full flex-col px-[18px] pt-[18px] pb-7">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setSignInStep('code')}
                className="text-xl leading-none"
              >
                &larr;
              </button>
              <span className={KICKER}>ME</span>
            </div>
            <h1 className="mt-2.5 text-[40px] leading-[0.98] font-extrabold tracking-[-0.02em]">
              Who&rsquo;s reading?
            </h1>
            <p className="mt-3.5 text-base leading-relaxed text-ash-800 [text-wrap:pretty]">
              Select your group to get started.
            </p>

            <div className="mt-7 border-t-2 border-ink">
              {groups.map((g) => (
                <button
                  key={g.id}
                  type="button"
                  onClick={() => chooseGroup(g.id)}
                  className="flex w-full items-center gap-3.5 border-b border-ink/40 py-4 text-left hover:bg-surface"
                >
                  <span className="flex-1 text-[17px] font-bold">
                    {g.label}
                  </span>
                  <span className="text-[13px]">&#9654;</span>
                </button>
              ))}
            </div>

            <div className="mt-auto border-t-2 border-ink pt-3.5">
              <span className="text-[13px] leading-snug font-medium text-ash-800">
                Sharing a device at church? Pick the group meeting right now.
              </span>
            </div>
          </div>
        )}

        {screen === 'profile' && !signedIn && signInStep === 'name' && (
          <form
            className="animate-hd-in flex min-h-full flex-col px-[18px] pt-[18px] pb-7"
            onSubmit={(e) => {
              e.preventDefault()
              void signIn()
            }}
          >
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setSignInStep('group')}
                className="text-xl leading-none"
              >
                &larr;
              </button>
              <span className={KICKER}>ME</span>
            </div>
            <h1 className="mt-2.5 text-[40px] leading-[0.98] font-extrabold tracking-[-0.02em]">
              Who&rsquo;s reading?
            </h1>
            <p className="mt-3.5 text-base leading-relaxed text-ash-800 [text-wrap:pretty]">
              Your name keeps your streak and your reading history together on
              this device.
            </p>

            <div className="mt-7 border-t-2 border-ink pt-5">
              <div className="mb-4 flex items-center justify-between">
                <span className="text-[11px] font-bold tracking-[0.12em] text-ash-700">
                  GROUP
                </span>
                <span className="flex items-center gap-2.5">
                  <span className="text-[13px] font-bold">
                    {labelForGroup(draftGroup)}
                  </span>
                  <button
                    type="button"
                    onClick={() => setSignInStep('group')}
                    className="text-xs font-bold tracking-[0.08em] text-accent-700"
                  >
                    CHANGE
                  </button>
                </span>
              </div>
              <label
                htmlFor="hd-name"
                className="block text-[11px] font-bold tracking-[0.12em] text-ash-700"
              >
                YOUR NAME
              </label>
              <div className="relative">
                <input
                  id="hd-name"
                  name="name"
                  type="text"
                  value={draft}
                  onChange={(e) => {
                    setDraft(e.target.value)
                    setShowNameSuggestions(true)
                    setNameError(false)
                  }}
                  onFocus={() => setShowNameSuggestions(true)}
                  onBlur={() => setShowNameSuggestions(false)}
                  autoComplete="off"
                  autoCapitalize="words"
                  spellCheck={false}
                  maxLength={40}
                  placeholder="Grace Lim"
                  autoFocus
                  className="mt-2.5 w-full border-2 border-ink bg-transparent px-3.5 py-3.5 text-[22px] font-bold tracking-[-0.01em] placeholder:font-medium placeholder:text-ash-400 focus:bg-surface"
                />
                {showNameSuggestions && nameSuggestions.length > 0 && (
                  <div className="absolute inset-x-0 top-full z-10 -mt-px max-h-[240px] overflow-y-auto border-2 border-ink bg-ground shadow-frame">
                    {nameSuggestions.map((m) => (
                      <button
                        key={m}
                        type="button"
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => {
                          setDraft(m)
                          setShowNameSuggestions(false)
                        }}
                        className="block w-full border-b border-ink/40 px-3.5 py-3 text-left text-[17px] font-bold last:border-b-0 hover:bg-surface"
                      >
                        {m}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <button
                type="submit"
                disabled={draft.trim() === '' || signingIn}
                className="mt-3.5 flex w-full items-center gap-2.5 border-2 border-accent bg-accent px-4 py-[13px] text-left text-[15px] font-bold tracking-wide text-white hover:border-accent-600 hover:bg-accent-600 active:border-accent-700 active:bg-accent-700 disabled:cursor-not-allowed disabled:border-ash-400 disabled:bg-transparent disabled:text-ash-500"
              >
                <span className="flex-1">
                  {signingIn ? 'Signing in…' : 'Continue'}
                </span>
                <span className="text-lg">&rarr;</span>
              </button>
              {nameError && (
                <p className="mt-3.5 text-[13px] leading-snug font-bold text-accent-700">
                  Couldn&rsquo;t sign you in. Check your connection and try
                  again.
                </p>
              )}
            </div>

            <p className="mt-5 text-[13px] leading-snug font-medium text-ash-700">
              No password to remember. Just your name.
            </p>

            <div className="mt-auto border-t-2 border-ink pt-3.5">
              <span className="text-[13px] leading-snug font-medium text-ash-800">
                Sharing a device at church? Your first name is enough.
              </span>
            </div>
          </form>
        )}

        {screen === 'profile' && signedIn && (
          <div className="animate-hd-in px-[18px] pt-[18px] pb-7">
            <div className={KICKER}>ME</div>
            <h1 className="mt-2.5 text-3xl leading-tight font-extrabold">
              {name}
            </h1>
            {group && (
              <p className="mt-1.5 mb-5 text-[13px] font-medium text-ash-700">
                {labelForGroup(group)}
              </p>
            )}
            <div className="mt-[26px] flex flex-col gap-3.5 border-t-2 border-ink pt-4">
              <button
                type="button"
                onClick={() => setReminder((r) => !r)}
                className="flex items-center gap-3 text-left"
              >
                <span className="flex flex-1 flex-col gap-0.5">
                  <span className="text-[15px] font-semibold">
                    Daily reminder
                  </span>
                  <span className="text-xs text-ash-700">
                    {reminder ? 'Every day at 6:30 AM' : 'Off'}
                  </span>
                </span>
                <span
                  className={`flex h-[26px] w-[46px] items-center border-2 border-ink p-0.5 ${
                    reminder
                      ? 'justify-end bg-accent-300'
                      : 'justify-start bg-transparent'
                  }`}
                >
                  <span className="block h-[18px] w-[18px] bg-ink" />
                </span>
              </button>
              {isAdmin && (
                <button
                  type="button"
                  onClick={() => {
                    if (role === 'appadmin' && !adminGroupId) {
                      setAdminGroupId(groups[0]?.id ?? '')
                    }
                    setAdminStatus('idle')
                    setAdminError('')
                    setScreen('admin')
                  }}
                  className="mt-1.5 flex w-full items-center gap-2.5 border-2 border-ink px-4 py-3 text-left text-[15px] font-bold tracking-wide hover:bg-surface"
                >
                  <span className="flex-1">Edit daily content</span>
                  <span className="text-accent-700">&rarr;</span>
                </button>
              )}
              <button
                type="button"
                onClick={signOut}
                className="mt-1.5 flex w-full items-center gap-2.5 border-2 border-ink px-4 py-3 text-left text-[15px] font-bold tracking-wide hover:bg-surface"
              >
                <span className="flex-1">Sign out</span>
                <span className="text-accent-700">&rarr;</span>
              </button>
            </div>
          </div>
        )}

        {screen === 'admin' && (
          <div className="animate-hd-in">
            <header className="sticky top-0 z-10 flex items-center gap-3 border-b-2 border-ink bg-ground px-[18px] py-3">
              <button
                type="button"
                onClick={() => setScreen('profile')}
                className="text-xl leading-none"
              >
                &larr;
              </button>
              <span className="flex-1 text-[15px] font-bold">
                Edit daily content
              </span>
            </header>
            <form
              className="px-[18px] pt-5 pb-7"
              onSubmit={(e) => {
                e.preventDefault()
                void saveAdminForm()
              }}
            >
              {role === 'groupadmin' ? (
                <p className="mb-5 text-[13px] font-medium text-ash-700">
                  Editing content for <strong>{labelForGroup(group)}</strong>
                </p>
              ) : (
                <div className="mb-5 flex flex-col gap-3">
                  <div className="flex border-2 border-ink">
                    {(['group', 'user'] as const).map((t) => (
                      <button
                        key={t}
                        type="button"
                        onClick={() => setAdminTargetType(t)}
                        className={`flex-1 py-2.5 text-[13px] font-bold tracking-[0.08em] uppercase ${
                          adminTargetType === t
                            ? 'bg-accent text-white'
                            : 'bg-transparent text-ink hover:bg-surface'
                        }`}
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                  {adminTargetType === 'group' ? (
                    <select
                      value={adminGroupId}
                      onChange={(e) => setAdminGroupId(e.target.value)}
                      className="w-full border-2 border-ink bg-transparent px-3.5 py-3 text-[15px] font-bold"
                    >
                      <option value="" disabled>
                        Select a group
                      </option>
                      {groups.map((g) => (
                        <option key={g.id} value={g.id}>
                          {g.label}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type="text"
                      inputMode="numeric"
                      value={adminUserId}
                      onChange={(e) => setAdminUserId(e.target.value)}
                      placeholder="User ID"
                      className="w-full border-2 border-ink bg-transparent px-3.5 py-3 text-[15px] font-bold placeholder:font-medium placeholder:text-ash-400"
                    />
                  )}
                </div>
              )}

              <label
                htmlFor="hd-admin-date"
                className="block text-[11px] font-bold tracking-[0.12em] text-ash-700"
              >
                DATE
              </label>
              <input
                id="hd-admin-date"
                type="date"
                value={adminDate}
                onChange={(e) => setAdminDate(e.target.value)}
                className="mt-2 mb-5 w-full border-2 border-ink bg-transparent px-3.5 py-3 text-[15px] font-bold"
              />

              <label
                htmlFor="hd-admin-passage"
                className="block text-[11px] font-bold tracking-[0.12em] text-ash-700"
              >
                BIBLE PASSAGE
              </label>
              <textarea
                id="hd-admin-passage"
                value={adminPassage}
                onChange={(e) => setAdminPassage(e.target.value)}
                rows={5}
                placeholder="Psalm 103:1–14"
                required
                className="mt-2 mb-5 w-full resize-y border-2 border-ink bg-transparent px-3.5 py-3 text-[15px] leading-relaxed placeholder:text-ash-400"
              />

              <label
                htmlFor="hd-admin-song"
                className="block text-[11px] font-bold tracking-[0.12em] text-ash-700"
              >
                SONG
              </label>
              <textarea
                id="hd-admin-song"
                value={adminSong}
                onChange={(e) => setAdminSong(e.target.value)}
                rows={5}
                placeholder={'T:Hymn title\nLyrics…'}
                className="mt-2 mb-5 w-full resize-y border-2 border-ink bg-transparent px-3.5 py-3 text-[15px] leading-relaxed placeholder:text-ash-400"
              />

              <label
                htmlFor="hd-admin-song-url"
                className="block text-[11px] font-bold tracking-[0.12em] text-ash-700"
              >
                SONG AUDIO URL
              </label>
              <input
                id="hd-admin-song-url"
                type="text"
                value={adminSongUrl}
                onChange={(e) => setAdminSongUrl(e.target.value)}
                placeholder="https://…"
                className="mt-2 mb-5 w-full border-2 border-ink bg-transparent px-3.5 py-3 text-[15px] placeholder:text-ash-400"
              />

              <label
                htmlFor="hd-admin-supplementary"
                className="block text-[11px] font-bold tracking-[0.12em] text-ash-700"
              >
                SUPPLEMENTARY NOTES
              </label>
              <textarea
                id="hd-admin-supplementary"
                value={adminSupplementary}
                onChange={(e) => setAdminSupplementary(e.target.value)}
                rows={3}
                className="mt-2 mb-5 w-full resize-y border-2 border-ink bg-transparent px-3.5 py-3 text-[15px] leading-relaxed"
              />

              {adminStatus === 'error' && (
                <p className="mb-3.5 text-[13px] font-bold text-accent-700">
                  {adminError}
                </p>
              )}
              {adminStatus === 'saved' && (
                <p className="mb-3.5 text-[13px] font-bold text-accent-700">
                  Saved.
                </p>
              )}

              <button
                type="submit"
                disabled={
                  !adminTargetReady ||
                  adminPassage.trim() === '' ||
                  adminStatus === 'saving'
                }
                className="flex w-full items-center gap-2.5 border-2 border-accent bg-accent px-4 py-[13px] text-left text-[15px] font-bold tracking-wide text-white hover:border-accent-600 hover:bg-accent-600 active:border-accent-700 active:bg-accent-700 disabled:cursor-not-allowed disabled:border-ash-400 disabled:bg-transparent disabled:text-ash-500"
              >
                <span className="flex-1">
                  {adminStatus === 'saving' ? 'Saving…' : 'Save content'}
                </span>
              </button>
            </form>
          </div>
        )}
      </div>

      {navModel === 'tabs' && chrome && (
        <nav className="grid flex-none grid-cols-3 border-t-2 border-ink bg-ground">
          {(
            [
              ['TODAY', 'home', '□'],
              ['RESOURCES', 'resources', '♪'],
              ['ME', 'profile', '○'],
            ] as const
          ).map(([label, target, glyph], i) => {
            const active = screen === target
            return (
              <button
                key={target}
                type="button"
                onClick={() => setScreen(target)}
                className={`flex flex-col items-center gap-1.5 pt-3 pb-4 ${
                  active ? 'text-ink' : 'text-ash-600'
                } ${i === 1 ? 'border-x border-ink/40' : ''}`}
              >
                <span className="text-[17px] leading-none">{glyph}</span>
                <span className="text-[11px] font-bold tracking-[0.1em]">
                  {label}
                </span>
                <span
                  className={`block h-0.5 w-[22px] ${
                    active ? 'bg-accent' : 'bg-transparent'
                  }`}
                />
              </button>
            )
          })}
        </nav>
      )}
    </div>
  )
}

export default HappyDayApp
