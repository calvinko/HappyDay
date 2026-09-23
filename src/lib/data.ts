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
  no: string
  title: string
  meta: string
  verses: string[]
}

export const HYMNS: Hymn[] = [
  {
    no: '021',
    title: 'Holy, Holy, Holy',
    meta: 'Reginald Heber, 1826 · 4 verses',
    verses: [
      'Holy, holy, holy! Lord God Almighty!\nEarly in the morning our song shall rise to thee;\nHoly, holy, holy! merciful and mighty!\nGod in three Persons, blessed Trinity!',
      'Holy, holy, holy! all the saints adore thee,\nCasting down their golden crowns around the glassy sea;\nCherubim and seraphim falling down before thee,\nWhich wert, and art, and evermore shalt be.',
      'Holy, holy, holy! though the darkness hide thee,\nThough the eye of sinful man thy glory may not see;\nOnly thou art holy; there is none beside thee,\nPerfect in power, in love, and purity.',
    ],
  },
  {
    no: '187',
    title: 'Amazing Grace',
    meta: 'John Newton, 1779 · 3 verses',
    verses: [
      'Amazing grace! how sweet the sound,\nThat saved a wretch like me!\nI once was lost, but now am found,\nWas blind, but now I see.',
      "'Twas grace that taught my heart to fear,\nAnd grace my fears relieved;\nHow precious did that grace appear\nThe hour I first believed.",
      "Through many dangers, toils and snares,\nI have already come;\n'Tis grace hath brought me safe thus far,\nAnd grace will lead me home.",
    ],
  },
]

export const RECENT = [
  { no: '045', title: 'How Great Thou Art', day: 'Wed' },
  { no: '112', title: 'Rock of Ages', day: 'Tue' },
  { no: '008', title: 'Praise to the Lord', day: 'Mon' },
  { no: '260', title: 'Abide with Me', day: 'Sun' },
]

export const HISTORY = [
  { ref: 'Psalm 102:1–17', day: 'Yesterday', done: true },
  { ref: 'Psalm 101', day: 'Mon', done: true },
  { ref: 'Psalm 100', day: 'Sun', done: true },
  { ref: 'Psalm 99', day: 'Sat', done: true },
  { ref: 'Psalm 98', day: 'Fri', done: false },
  { ref: 'Psalm 97', day: 'Thu', done: true },
  { ref: 'Psalm 96', day: 'Wed', done: true },
]

export const TODAY = {
  dateLong: 'Thu, Sep 17',
  dayLabel: 'DAY 261',
  passageRef: 'Psalm 103:1–14',
  passageTitle: 'Bless the LORD, O my soul',
  translation: 'KING JAMES VERSION',
  member: 'Sister Grace Lim',
  memberMeta: 'Member since 2014 · San Jose',
  totalRead: 612,
  baseStreak: 24,
}

export type GroupContent = {
  passage: string
  song: string
  supplementary: string | null
}

// Placeholder for testing, standing in for the daily_content row the server will
// eventually serve per group (see server/sql/schema.sql). Keyed by the group ids
// in App.tsx's GROUPS. Replace with a fetch from the server API once it's wired up.
export const GROUP_CONTENT: Record<string, GroupContent> = {
  sj_senior: {
    passage: '「弟兄們哪，你們要忍耐，直到主來。看哪，農夫忍耐等候地裏寶貴的出產，直到得了秋雨春雨。 你們也當忍耐，堅固你們的心，因為主來的日子近了。」雅各書 5:7-8 CUNP-神',
    song: '1. 24小時的同在\n 何等甜蜜寶貴祝福,\n有誰像你這樣親近\n唯你是我隨時的幫助。',
    supplementary: null,
  },
  bra_senior: {
    passage: 'João 3:16-21',
    song: 'Grandioso És Tu',
    supplementary: null,
  },
}

// Members currently in each group, keyed by the group ids in App.tsx's GROUPS.
export const GROUP_MEMBERS: Record<string, string[]> = {
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

export type Member = {
  id: string
  name: string
  aliasesName: string[]
  remark: string
}

export const MEMBERS: Member[] = [
  { id: 'calvin-ko', name: 'Calvin Ko', aliasesName: [], remark: '' },
  { id: 'ivy-chan', name: 'Ivy Chan', aliasesName: [], remark: '' },
  { id: 'kwok-ching', name: 'Kwok Ching', aliasesName: [], remark: '' },
  { id: 'may-tsui', name: 'May Tsui', aliasesName: [], remark: '' },
  { id: 'catherine', name: 'Catherine', aliasesName: [], remark: '' },
  { id: 'rick-ng', name: 'Rick Ng', aliasesName: [], remark: '' },
  { id: 'yvonne-ho', name: 'Yvonne Ho', aliasesName: [], remark: '' },
  { id: 'james-leung', name: 'James Leung', aliasesName: [], remark: '' },
  { id: 'linda-chiu', name: 'Linda Chiu', aliasesName: [], remark: '' },
  { id: 'patrick-chiu', name: 'Patrick Chiu', aliasesName: [], remark: '' },
  { id: 'honyuen', name: 'HonYuen', aliasesName: [], remark: '' },
]
