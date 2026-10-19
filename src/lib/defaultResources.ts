import type { Hymn } from './data'
import type { Resources } from './api'

// Temporary stand-in for GET /api/resources/*: the Resources page is filled
// from these rows instead of being fetched. Each row is a song_slug, as in the
// server's resources table (see DEFAULT_RESOURCE_ROWS in
// server/src/models/resource.ts, which should list the same slugs).
export const DEFAULT_RESOURCE_ROWS = [
  { kind: 'song', songSlug: 'CSTND_5' },
  { kind: 'song', songSlug: 'S1_222' },
  { kind: 'song', songSlug: 'H2_45' },
  { kind: 'song', songSlug: 'H1_7' }
] as const

// The client has no copy of server/data/songs.json (it's far too large to
// bundle), so just the entries for the slugs above are copied here. Add an
// entry when adding a slug to DEFAULT_RESOURCE_ROWS.
const SONG_CATALOG: Record<
  string,
  { name: string; content: string; mp3: string | null; book: string; pageNumber: string }
> = {
  "CSTND_5": {
    "name": "早晨禱告歌",
    "content": "\n\n1.  早晨起來，拍拍手，\n感謝阿爸，感謝主。\n新的一天，新開始，\n恩典夠用，夠晒用。\n\n2.  阿爸同在，四圍環繞，\n看顧我，扶持我，\n主在心中，加我力量，\n陪伴到永遠。\n\n3.  舉起雙手，向神祈求，\n為自己，為家人，\n求大福，求大恩，\n出入平安，常常喜樂。\n\n4.  主在十架，呼喊成了，\n打敗仇敵，得勝一切，\n主在我旁,加我力量,\n賜我權柄，驅逐鬼魔，\n\n5.  舉起雙手，繼續祈求，\n祝福教會，顯主榮耀，\n聖靈充滿，聚會興旺，\n傳揚福音，多人得救。\n\n6.  舉起雙手，祝福世界，\n記念窮人，憐憫困苦，\n求主掌權，求神拯救，\n世界見真光。\n\n7.  主要快來，雲中相見，\n天上團圓，跳舞慶祝，\n永居新城，與主作王，\n嘩！燦爛永恆！\n",
    "mp3": "http://songapp.vercel.app/song-audio/chinese/CSTND_5.mp3",
    "book": "CSTND",
    "pageNumber": "5"
  },
  "S1_222": {
    "name": "因主微笑",
    "content": "\n\n詞：余光昭　曲：William H.  Monk\n\n1 終日微笑，因祢在我心旁；\n終日微笑，因祢愛環繞我。\n我雖落在百試煉當中，\n我能放心，因祢為我掌權。\n\n2 當遇試探，讓我向祢微笑；\n祢已為我勝過仇敵、世界。\n祢恩夠用，聖靈必賜生命，\n使我穩行在洶湧浪濤上。\n\n3 磨難之日，祢抱著我前進；\n在戰場上，我靠祢能微笑。\n四面受敵，我仍見祢慈容；\n敵人面前，祢為我擺盛筵。\n\n4 一生與祢經過水火甘苦，\n與祢友情越久越深越甜。\n與祢同苦，都是甜蜜回憶，\n更要成就永遠無比榮耀。\n\n5 親愛弟兄，你我只有一生，\n唯有今生，才能為主負架。\n趁著今日，打碎我們玉瓶，\n以愛膏主，心單歸屬良人。\n\n13-10-1993\n\n",
    "mp3": "https://kosolution.net/songaudio/S1-222-smile.mp3",
    "book": "神家詩歌合訂本 1",
    "pageNumber": "222"
  },
  "H2_45": {
    "name": "24小時的同在",
    "content": "\n\n1   24小時的同在，\n何等甜蜜寶貴祝福，\n有誰像你這樣親近，\n唯你是我隨時的幫助。\n\n2   24小時的同在，\n你是我的安慰支持，\n有你我不懼怕驚惶，\n你多喜歡與我在一起。\n\n3   24小時的同在，\n我能傾訴，我有倚靠，\n你是我的良人密友，\n你保抱我，牽我手前走。\n\n4   24小時的同在，\n你愛能經一切考驗，\n你的友情溫馨珍貴，\n宇宙一切都不能與比。\n\n5   24小時的同在，\n我一生滿享恩情，\n與你生活這麼多年，\n永世中我怎能沒有你。\n\n副：晝夜同在，溫馨，甘甜，\n有你在我旁，我不孤單，\n晝夜同在，心心相連，\n與你同活預嘗天甜美。\n\n",
    "mp3": "https://kosolution.net/songaudio/S1-153-二十四小時的同在.mp3",
    "book": "神家詩歌 2",
    "pageNumber": "45"
  },
  "H1_7": {
    "name": "父愛",
    "content": "\n\n1. 在父懷中我為寵兒，\n我是祂喜樂詩歌\n我的頭髮祂已數過，\n我比飛鳥貴重多\n祂向我懷寶貴意念，\n比海沙天星更多\n無論起坐或是躺臥，\n祂心怎能忘記我。\n\n2. 從幼到老祂保抱我，\n終身事在祂手中。\n我與基督同為後嗣，\n享受父豐富預備。\n在世雖有打擊淚谷，\n父賜諸般的安慰。\n祂牽我手走完世程，\n在天享父家豐盛。\n\n",
    "mp3": null,
    "book": "神家詩歌 1",
    "pageNumber": "7"
  }
}

// Same verse splitting as the server's songCatalog.ts: verses are separated
// by a blank line in the catalog's single `content` blob.
function splitVerses(content: string): string[] {
  return content
    .split(/\n\s*\n/)
    .map((v) => v.trim())
    .filter(Boolean)
}

function toHymn(slug: string, id: number): Hymn | null {
  const song = SONG_CATALOG[slug]
  if (!song) return null
  return {
    id,
    no: slug,
    title: song.name,
    meta: `${song.book} · p.${song.pageNumber}`,
    verses: splitVerses(song.content),
    songUrl: song.mp3,
  }
}

export const DEFAULT_RESOURCES: Resources = {
  songs: DEFAULT_RESOURCE_ROWS.map((row, i) => toHymn(row.songSlug, -(i + 1))).filter(
    (h): h is Hymn => h !== null,
  ),
  messages: [],
  texts: [],
}
