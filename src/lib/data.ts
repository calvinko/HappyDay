export const VERSES: string[] = [
  'Bless the LORD, O my soul: and all that is within me, bless his holy name.',
  'Bless the LORD, O my soul, and forget not all his benefits:',
  'Who forgiveth all thine iniquities; who healeth all thy diseases;',
  'Who redeemeth thy life from destruction; who crowneth thee with lovingkindness and tender mercies;',
  "Who satisfieth thy mouth with good things; so that thy youth is renewed like the eagle's.",
  'The LORD executeth righteousness and judgment for all that are oppressed.',
  'He made known his ways unto Moses, his acts unto the children of Israel.',
  'The LORD is merciful and gracious, slow to anger, and plenteous in mercy.',
  'He will not always chide: neither will he keep his anger for ever.',
  'He hath not dealt with us after our sins; nor rewarded us according to our iniquities.',
  'For as the heaven is high above the earth, so great is his mercy toward them that fear him.',
  'As far as the east is from the west, so far hath he removed our transgressions from us.',
  'Like as a father pitieth his children, so the LORD pitieth them that fear him.',
  'For he knoweth our frame; he remembereth that we are dust.',
]

export type Hymn = {
  id?: number
  no: string
  title: string
  meta: string
  verses: string[]
  songUrl?: string | null
}

function formatDateLong(date: Date): string {
  return date.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  })
}

export const TODAY = {
  dateLong: formatDateLong(new Date()),
  passageRef: 'Psalm 103:1–14',
  passageTitle: 'Bless the LORD, O my soul',
  translation: 'KING JAMES VERSION',
}

export type GroupContent = {
  passage: string
  song: string
  songUrl: string | null
  supplementary: string | null
}

// Placeholder for testing, standing in for the daily_content row the server will
// eventually serve per group (see server/sql/schema.sql). Keyed by the group ids
// in App.tsx's GROUPS. Replace with a fetch from the server API once it's wired up.
export const GROUP_CONTENT: Record<string, GroupContent> = {
  sj_senior: {
    passage: '#Read \n「弟兄們哪，你們要忍耐，直到主來。看哪，農夫忍耐等候地裏寶貴的出產，直到得了秋雨春雨。 你們也當忍耐，堅固你們的心，因為主來的日子近了。」雅各書 5:7-8 CUNP-神',
    song: 'T:24小時的同在\n1. 24小時的同在 \n 何等甜蜜寶貴祝福, \n有誰像你這樣親近\n唯你是我隨時的幫助。\n',
    songUrl: 'https://kosolution.net/songaudio/S1-153-%e4%ba%8c%e5%8d%81%e5%9b%9b%e5%b0%8f%e6%99%82%e7%9a%84%e5%90%8c%e5%9c%a8.mp3',
    supplementary: null,
  },
  bra_senior: {
    passage: 'João 3:16-21',
    song: 'T:Grandioso És Tu',
    songUrl: null,
    supplementary: null,
  },
}

// Members currently in each group, keyed by the group ids in App.tsx's GROUPS.
export const BUILTIN_GROUPS: Record<string, string[]> = {
  sj_senior: [
    'Calvin Ko',
    'Ivy Chan',
    'Kwok Ching',
    'May Tsui',
    'Catherine',
    'Rick Ng',
    'Yvonne Ho',
  ],
  sf_senior: ['James Leung', 'Linda Chiu', 'Patrick Chiu'],
  bra_senior: ['HonYuen'],
}
