import { useEffect, useState, type ReactNode } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkBreaks from 'remark-breaks'
import {
  fetchGroupContent,
  fetchUserContentByName,
  type DailyContent,
} from '../lib/api'
import {
  GROUP_CONTENT,
  GROUP_MEMBERS,
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

type Screen = 'home' | 'passage' | 'resources' | 'profile'

export type Group = { id: string; label: string }

type Props = {
  homeLayout?: 'poster' | 'cards'
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
const INVITE_CODE = '43236'



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

function HappyDayApp({
  homeLayout = 'poster',
  navModel = 'tabs',
  groups = DEFAULT_GROUPS,
}: Props) {
  const [screen, setScreen] = useState<Screen>(() =>
    readName() ? 'home' : 'profile',
  )
  const [read, setRead] = useState(false)
  const [size, setSize] = useState(15)
  const [reminder, setReminder] = useState(true)
  const [name, setName] = useState(() => readName())
  const [group, setGroup] = useState(() => readGroup())
  const [draft, setDraft] = useState('')
  const [draftGroup, setDraftGroup] = useState('')
  const [draftCode, setDraftCode] = useState('')
  const [codeError, setCodeError] = useState(false)
  const [showNameSuggestions, setShowNameSuggestions] = useState(false)
  const [signInStep, setSignInStep] = useState<'code' | 'group' | 'name'>(
    'code',
  )

  const [remoteContent, setRemoteContent] = useState<{
    name: string
    group: string
    data: DailyContent | null
  } | null>(null)

  useEffect(() => {
    if (!group) return
    let cancelled = false
    // Checks for content assigned to this person first, then falls back to
    // their group's content (see fetchUserContentByName/fetchGroupContent).
    fetchUserContentByName(name)
      .catch(() => null)
      .then((data) => data ?? fetchGroupContent(group).catch(() => null))
      .then((data) => {
        if (!cancelled) setRemoteContent({ name, group, data })
      })
    return () => {
      cancelled = true
    }
  }, [name, group])

  const fetchedContent =
    remoteContent?.name === name && remoteContent?.group === group
      ? remoteContent.data
      : null

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
  const hymns: Hymn[] = groupContent && song
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
  const streak = TODAY.baseStreak + (read ? 1 : 0)
  const signedIn = name !== ''
  const firstName = name.split(' ')[0]
  const chrome = screen !== 'passage'

  const labelForGroup = (id: string) =>
    groups.find((g) => g.id === id)?.label ?? id

  const nameSuggestions = (GROUP_MEMBERS[draftGroup] ?? []).filter((m) =>
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

  const signIn = () => {
    const clean = draft.trim().replace(/\s+/g, ' ')
    if (!clean || !draftGroup) return
    setName(clean)
    writeName(clean)
    setGroup(draftGroup)
    writeGroup(draftGroup)
    setDraft('')
    setDraftGroup('')
    setDraftCode('')
    setCodeError(false)
    setShowNameSuggestions(false)
    setSignInStep('code')
  }

  const signOut = () => {
    setName('')
    writeName('')
    setDraftGroup('')
    setDraftCode('')
    setCodeError(false)
    setShowNameSuggestions(false)
    setSignInStep('code')
  }

  const grow = () => setSize((s) => Math.min(26, s + 2))
  const shrink = () => setSize((s) => Math.max(15, s - 2))

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
        {screen === 'home' && homeLayout === 'poster' && (
          <div className="animate-hd-in">
            <div className="flex items-baseline justify-between border-b-2 border-ink px-[18px] pt-4 pb-3.5">
              <span className="text-[22px] font-black tracking-[0.14em]">
                快樂每一天 HAPPY DAY
              </span>
              <span className="text-xs font-semibold tracking-wide text-ash-700">
                {TODAY.dateLong}
              </span>
            </div>

            <section className="border-b-2 border-ink px-[18px] pt-[22px] pb-5">
              <div className={`${KICKER} mb-2.5`}>TODAY&rsquo;S PASSAGE</div>
              <p className="mb-[18px] text-base leading-relaxed text-ash-800 [text-wrap:pretty]">
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
                <div key={h.no} className="border-t border-ink/40 py-3.5">
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
                      className="mt-3 leading-[1.65] [text-wrap:pretty]"
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

        {screen === 'home' && homeLayout === 'cards' && (
          <div className="animate-hd-in px-4 pt-4 pb-6">
            <div className="mb-1.5 flex items-baseline justify-between">
              <span className="text-[19px] font-black tracking-[0.14em]">
                HAPPY DAY
              </span>
              <span className="text-xs font-semibold text-ash-700">
                {TODAY.dateLong}
              </span>
            </div>
            <h1 className="mt-2.5 mb-1 text-3xl leading-tight font-extrabold">
              {read
                ? 'Good to see you again.'
                : signedIn
                  ? `Good morning, ${firstName}.`
                  : 'Good morning.'}
            </h1>
            <p className="mb-[18px] text-sm font-medium text-ash-700">
              {streak} days in a row.
              {read ? ' Today is done.' : ' Keep it going.'}
            </p>

            <section className="mb-3.5 border-2 border-ink bg-surface p-4">
              <div className={`${KICKER} mb-2`}>PASSAGE</div>
              <h2 className="mb-2 text-[26px] leading-tight font-extrabold">
                <Markdown>{content.passage}</Markdown>
              </h2>
              <p className="mb-4 text-[13px] font-medium text-ash-700">
                14 verses · about 3 minutes
              </p>
              <button
                type="button"
                onClick={() => setScreen('passage')}
                className="hidden w-full items-center gap-2.5 bg-accent px-3.5 py-3 text-left text-sm font-bold tracking-wide text-white hover:bg-accent-600"
              >
                <span className="flex-1">
                  {read ? 'Read again' : 'Read the whole chapter'}
                </span>
                <span>&rarr;</span>
              </button>
            </section>

            {hymns.map((h) => (
              <div
                key={h.no}
                className="mb-3 border-2 border-ink bg-surface p-3.5"
              >
                <div className="flex items-center gap-3.5">
                  <span className="min-w-[48px] text-[22px] font-extrabold text-accent">
                    {h.no}
                  </span>
                  <span className="flex flex-1 flex-col gap-[3px]">
                    <span className="text-[11px] font-bold tracking-[0.12em] text-ash-700">
                      HYMN
                    </span>
                    <span className="text-base font-bold">{h.title}</span>
                  </span>
                </div>
                {h.verses.map((v, i) => (
                  <p
                    key={i}
                    className="mt-3 whitespace-pre-line leading-[1.65] [text-wrap:pretty]"
                  >
                    <Markdown>{v}</Markdown>
                  </p>
                ))}
                {h.songUrl && (
                  <audio controls className="mt-3 w-full" src={h.songUrl} />
                )}
              </div>
            ))}

            <div className="flex items-center justify-between gap-2 border-2 border-ink px-4 py-3.5">
              <span className="text-[13px] font-semibold">This week</span>
              <span className="flex gap-1.5">
                {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => {
                  const on = i < 4 || (i === 4 && read)
                  return (
                    <span
                      key={`${d}-${i}`}
                      className={`flex h-[26px] w-[26px] items-center justify-center border-2 border-ink text-[10px] font-bold ${
                        on ? 'bg-accent text-white' : 'bg-ground text-ash-400'
                      }`}
                    >
                      {d}
                    </span>
                  )
                })}
              </span>
            </div>
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
              <div className={`${KICKER} mb-1.5`}>
                {TODAY.dayLabel} &middot; {TODAY.translation}
              </div>
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
                onClick={() => setScreen('resources')}
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
              <div key={h.no} className="border-t-2 border-ink py-4">
                <div className="flex items-center gap-3.5">
                  <span className="min-w-[58px] text-3xl font-extrabold text-accent">
                    {h.no}
                  </span>
                  <span className="flex flex-1 flex-col gap-[3px]">
                    <span className="text-lg font-bold">{h.title}</span>
                    <span className="text-xs font-medium text-ash-700">
                      {h.meta}
                    </span>
                  </span>
                </div>
                {h.verses.map((v, i) => (
                  <p
                    key={i}
                    className="mt-3 whitespace-pre-line leading-[1.65] [text-wrap:pretty]"
                  >
                    <Markdown>{v}</Markdown>
                  </p>
                ))}
                {h.songUrl && (
                  <audio controls className="mt-3 w-full" src={h.songUrl} />
                )}
              </div>
            ))}
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
              signIn()
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
                disabled={draft.trim() === ''}
                className="mt-3.5 flex w-full items-center gap-2.5 border-2 border-accent bg-accent px-4 py-[13px] text-left text-[15px] font-bold tracking-wide text-white hover:border-accent-600 hover:bg-accent-600 active:border-accent-700 active:bg-accent-700 disabled:cursor-not-allowed disabled:border-ash-400 disabled:bg-transparent disabled:text-ash-500"
              >
                <span className="flex-1">Continue</span>
                <span className="text-lg">&rarr;</span>
              </button>
            </div>

            <p className="mt-5 text-[13px] leading-snug font-medium text-ash-700">
              No account and no password. Your name stays on this device.
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
            <p className="mt-1.5 mb-5 text-[13px] font-medium text-ash-700">
              {TODAY.memberMeta}
              {group && ` · ${labelForGroup(group)}`}
            </p>
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
              <div className="flex items-center gap-3">
                <span className="flex-1 text-[15px] font-semibold">
                  Reading text size
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
              </div>
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
