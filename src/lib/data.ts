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
