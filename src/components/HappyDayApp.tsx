import { useEffect, useState } from 'react'
import { HISTORY, HYMNS, RECENT, TODAY, VERSES } from '../lib/data'

type Screen = 'home' | 'passage' | 'resources' | 'hymn' | 'profile'

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
  const [screen, setScreen] = useState<Screen>('home')
  const [hymnIdx, setHymnIdx] = useState(0)
  const [from, setFrom] = useState<Screen>('home')
  const [read, setRead] = useState(false)
  const [size, setSize] = useState(19)
  const [playing, setPlaying] = useState(false)
  const [pct, setPct] = useState(12)
  const [reminder, setReminder] = useState(true)
  const [name, setName] = useState(() => readName())
  const [group, setGroup] = useState(() => readGroup())
  const [draft, setDraft] = useState('')
  const [draftGroup, setDraftGroup] = useState('')
  const [signInStep, setSignInStep] = useState<'group' | 'name'>('group')

  useEffect(() => {
    if (!playing) return
    const t = setInterval(() => setPct((p) => (p >= 98 ? 0 : p + 1.2)), 400)
    return () => clearInterval(t)
  }, [playing])

  const hymn = HYMNS[hymnIdx]
  const streak = TODAY.baseStreak + (read ? 1 : 0)
  const signedIn = name !== ''
  const firstName = name.split(' ')[0]
  const chrome = screen !== 'passage' && screen !== 'hymn'
  const mm = Math.floor((pct * 2.4) / 60)
  const ss = Math.floor((pct * 2.4) % 60)
  const clock = `${String(mm).padStart(2, '0')}:${String(ss).padStart(2, '0')}`

  const labelForGroup = (id: string) =>
    groups.find((g) => g.id === id)?.label ?? id

  const openHymn = (i: number) => {
    setHymnIdx(i)
    setFrom(screen)
    setScreen('hymn')
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
    setSignInStep('group')
  }

  const signOut = () => {
    setName('')
    writeName('')
    setDraftGroup('')
    setSignInStep('group')
  }

  const grow = () => setSize((s) => Math.min(26, s + 2))
  const shrink = () => setSize((s) => Math.max(15, s - 2))

  return (
    <div className="relative flex h-svh w-full flex-col overflow-hidden bg-ground pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)]">
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
              <span className="text-[15px] font-black tracking-[0.14em]">
                快樂每一天 HAPPY DAY
              </span>
              <span className="text-xs font-semibold tracking-wide text-ash-700">
                {TODAY.dateLong}
              </span>
            </div>

            <section className="border-b-2 border-ink px-[18px] pt-[22px] pb-5">
              <div className={`${KICKER} mb-2.5`}>TODAY&rsquo;S PASSAGE</div>
              <h1 className="mb-3 text-[40px] leading-[0.98] font-extrabold tracking-[-0.02em]">
                {TODAY.passageRef}
              </h1>
              <p className="mb-[18px] text-base leading-relaxed text-ash-800 [text-wrap:pretty]">
                &ldquo;{VERSES[0]}&rdquo;
              </p>
              <button
                type="button"
                onClick={() => setScreen('passage')}
                className="flex w-full items-center gap-2.5 bg-accent px-4 py-[15px] text-left text-[15px] font-bold tracking-wide text-white hover:bg-accent-600 active:bg-accent-700"
              >
                <span className="flex-1">
                  {read ? 'Read again' : 'Read today’s passage'}
                </span>
                <span className="text-lg">&rarr;</span>
              </button>
            </section>

            <section className="px-[18px] pt-5 pb-2">
              <div className={`${KICKER} mb-3.5`}>TODAY&rsquo;S HYMNS</div>
              {HYMNS.map((h, i) => (
                <button
                  key={h.no}
                  type="button"
                  onClick={() => openHymn(i)}
                  className="flex w-full items-center gap-3.5 border-t border-ink/40 py-3.5 text-left hover:bg-surface"
                >
                  <span className="min-w-[54px] text-[26px] font-extrabold text-ash-400">
                    {h.no}
                  </span>
                  <span className="flex flex-1 flex-col gap-[3px]">
                    <span className="text-[17px] font-bold">{h.title}</span>
                    <span className="text-xs font-medium tracking-wide text-ash-700">
                      {h.meta}
                    </span>
                  </span>
                  <span className="flex h-[34px] w-[34px] items-center justify-center border-2 border-ink text-[11px]">
                    &#9654;
                  </span>
                </button>
              ))}
            </section>

            <div className="mx-[18px] mt-[18px] mb-6 flex items-end justify-between border-t-2 border-ink pt-3.5">
              <span className="text-[13px] leading-snug font-medium text-ash-800">
                {read
                  ? `${streak} days in a row. Today is done.`
                  : `${streak} days in a row. Keep it going.`}
              </span>
              <button
                type="button"
                onClick={() => setScreen('profile')}
                className="text-xs font-bold tracking-[0.08em] text-accent-700"
              >
                HISTORY
              </button>
            </div>
          </div>
        )}

        {screen === 'home' && homeLayout === 'cards' && (
          <div className="animate-hd-in px-4 pt-4 pb-6">
            <div className="mb-1.5 flex items-baseline justify-between">
              <span className="text-[15px] font-black tracking-[0.14em]">
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
                {TODAY.passageRef}
              </h2>
              <p className="mb-4 text-[13px] font-medium text-ash-700">
                14 verses · about 3 minutes
              </p>
              <button
                type="button"
                onClick={() => setScreen('passage')}
                className="flex w-full items-center gap-2.5 bg-accent px-3.5 py-3 text-left text-sm font-bold tracking-wide text-white hover:bg-accent-600"
              >
                <span className="flex-1">
                  {read ? 'Read again' : 'Read today’s passage'}
                </span>
                <span>&rarr;</span>
              </button>
            </section>

            {HYMNS.map((h, i) => (
              <button
                key={h.no}
                type="button"
                onClick={() => openHymn(i)}
                className="mb-3 flex w-full items-center gap-3.5 border-2 border-ink bg-surface p-3.5 text-left hover:bg-accent-200"
              >
                <span className="min-w-[48px] text-[22px] font-extrabold text-accent">
                  {h.no}
                </span>
                <span className="flex flex-1 flex-col gap-[3px]">
                  <span className="text-[11px] font-bold tracking-[0.12em] text-ash-700">
                    HYMN
                  </span>
                  <span className="text-base font-bold">{h.title}</span>
                </span>
                <span className="text-[13px]">&#9654;</span>
              </button>
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
                {TODAY.passageRef}
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
                onClick={() => openHymn(0)}
                className="mt-5 flex w-full items-center gap-2.5 border-t border-ink/40 pt-3.5 text-left text-sm font-bold"
              >
                <span className="flex-1">
                  Next: hymn {HYMNS[0].no}, {HYMNS[0].title}
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
            {HYMNS.map((h, i) => (
              <button
                key={h.no}
                type="button"
                onClick={() => openHymn(i)}
                className="flex w-full items-center gap-3.5 border-t-2 border-ink py-4 text-left hover:bg-surface"
              >
                <span className="min-w-[58px] text-3xl font-extrabold text-accent">
                  {h.no}
                </span>
                <span className="flex flex-1 flex-col gap-[3px]">
                  <span className="text-lg font-bold">{h.title}</span>
                  <span className="text-xs font-medium text-ash-700">
                    {h.meta}
                  </span>
                </span>
                <span className="text-[13px]">&#9654;</span>
              </button>
            ))}
            <div className={`${KICKER} mt-7 mb-1.5`}>SUNG THIS WEEK</div>
            {RECENT.map((r) => (
              <div
                key={r.no}
                className="flex items-baseline gap-3.5 border-t border-ink/40 py-3"
              >
                <span className="min-w-[58px] text-sm font-bold text-ash-600">
                  {r.no}
                </span>
                <span className="flex-1 text-[15px] font-medium">
                  {r.title}
                </span>
                <span className="text-xs text-ash-600">{r.day}</span>
              </div>
            ))}
          </div>
        )}

        {screen === 'hymn' && (
          <div className="animate-hd-in">
            <header className="sticky top-0 z-10 flex items-center gap-3 border-b-2 border-ink bg-ground px-[18px] py-3">
              <button
                type="button"
                onClick={() => setScreen(from === 'hymn' ? 'home' : from)}
                className="text-xl leading-none"
              >
                &larr;
              </button>
              <span className="flex-1 text-[15px] font-bold">
                Hymn {hymn.no}
              </span>
            </header>
            <div className="px-[18px] pt-5">
              <div className="text-[64px] leading-[0.9] font-extrabold tracking-[-0.03em] text-accent">
                {hymn.no}
              </div>
              <h1 className="mt-2.5 mb-1 text-[26px] leading-tight font-extrabold">
                {hymn.title}
              </h1>
              <p className="border-b-2 border-ink pb-4 text-xs font-semibold tracking-wide text-ash-700">
                {hymn.meta}
              </p>
            </div>
            <div className="px-[18px] pt-[18px] pb-[120px]">
              {hymn.verses.map((t, i) => (
                <div key={i} className="mb-[22px]">
                  <div className={`${KICKER} mb-2`}>VERSE {i + 1}</div>
                  <p
                    className="leading-[1.65] whitespace-pre-line [text-wrap:pretty]"
                    style={{ fontSize: size }}
                  >
                    {t}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {screen === 'profile' && !signedIn && signInStep === 'group' && (
          <div className="animate-hd-in flex min-h-full flex-col px-[18px] pt-[18px] pb-7">
            <div className={KICKER}>ME</div>
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
              <input
                id="hd-name"
                name="name"
                type="text"
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                autoComplete="name"
                autoCapitalize="words"
                spellCheck={false}
                maxLength={40}
                placeholder="Grace Lim"
                autoFocus
                className="mt-2.5 w-full border-2 border-ink bg-transparent px-3.5 py-3.5 text-[22px] font-bold tracking-[-0.01em] placeholder:font-medium placeholder:text-ash-400 focus:bg-surface"
              />
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
            <div className="mb-6 grid grid-cols-2 border-2 border-ink">
              <div className="border-r-2 border-ink p-4">
                <div className="text-[34px] font-extrabold text-accent">
                  {streak}
                </div>
                <div className="text-[11px] font-bold tracking-[0.12em] text-ash-700">
                  DAY STREAK
                </div>
              </div>
              <div className="p-4">
                <div className="text-[34px] font-extrabold">
                  {TODAY.totalRead}
                </div>
                <div className="text-[11px] font-bold tracking-[0.12em] text-ash-700">
                  PASSAGES READ
                </div>
              </div>
            </div>
            <div className={`${KICKER} mb-1`}>LAST SEVEN DAYS</div>
            {HISTORY.map((h) => (
              <div
                key={h.ref}
                className="flex items-center gap-3 border-t border-ink/40 py-[13px]"
              >
                <span
                  className={`flex h-[22px] w-[22px] items-center justify-center border-2 border-ink text-xs font-bold text-white ${
                    h.done ? 'bg-accent' : 'bg-ground'
                  }`}
                >
                  {h.done ? '✓' : ''}
                </span>
                <span className="flex-1 text-[15px] font-semibold">
                  {h.ref}
                </span>
                <span className="text-xs font-medium text-ash-700">
                  {h.day}
                </span>
              </div>
            ))}
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

      {screen === 'hymn' && (
        <div className="flex-none border-t-2 border-ink bg-surface px-[18px] py-3">
          <div className="flex items-center gap-3.5">
            <button
              type="button"
              onClick={() => setPlaying((p) => !p)}
              className="flex h-11 w-11 items-center justify-center bg-accent text-[15px] text-white hover:bg-accent-600"
            >
              {playing ? '‖' : '▶'}
            </button>
            <span className="flex flex-1 flex-col gap-1.5">
              <span className="text-xs font-semibold tracking-wide text-ash-800">
                {playing ? 'Playing · ' : 'Recording · '}
                {hymn.title}
              </span>
              <span className="block h-1 bg-ash-300">
                <span
                  className="block h-1 bg-accent transition-[width] duration-300 ease-linear"
                  style={{ width: `${pct.toFixed(0)}%` }}
                />
              </span>
            </span>
            <span className="text-xs font-semibold text-ash-700">
              {clock}
            </span>
          </div>
        </div>
      )}

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
