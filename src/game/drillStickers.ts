import type { Sticker } from '@/types/drill'

export const STICKERS: Sticker[] = [
  {
    id: 'starknight', name: 'ORDER KNIGHT', rarity: 'common',
    bg: 'linear-gradient(135deg,#3da5ff,#b83dff)',
    pixels: [
      '.....KKKKKK.....','....KYYYYYYK....','...KYWYYYYWYK...','...KYYYYYYYYK...',
      '....KYWYYWYK....','....KYYYYYYK....','...KKDDDDDDKK..','..KDDWDDDDWDDK..',
      '..KDDDDDDDDDDK..','..KDDDRDDRDDDK..','...KDDDDDDDDK...','....KNDDDDNK....',
      '....KN.KK.NK....','....KN.KK.NK....','...KYY.KK.YYK...','...KKK....KKK...',
    ],
  },
  {
    id: 'lasersword', name: 'PLASMA BLADE', rarity: 'common',
    bg: 'linear-gradient(135deg,#0a0a14,#2d2d5c)',
    pixels: [
      '.............CC.','............CWC.',  '...........CWC..','..........CWC...',
      '.........CWC....','........CWC.....', '.......CWC......','......CWC.......',
      '.....CWC........','....CWC.........',  '...CWC..........','..CWC...........',
      '.KSK............','KSSSK...........',  'KSKSK...........','.KKK............',
    ],
  },
  {
    id: 'robopal', name: 'ASTRO-DROID', rarity: 'common',
    bg: 'linear-gradient(135deg,#ffd93d,#ff7a1f)',
    pixels: [
      '.....KKKKKK.....','....KDDDDDDK....','...KDDDDDDDDK...','..KDDKKDDKKDDK..',
      '..KDDKCKDKCKDDK.','..KDDKKDDKKDDK..','...KDDDRRDDDK...','....KDDDDDDK....',
      '...KSSSSSSSSK...','..KSSCSSSSCSSK..','..KSSSSSSSSSSK..','..KSSCCCCCCSSK..',
      '..KSSSSSSSSSSK..','...KSS....SSK...','....KK....KK....','....KK....KK....',
    ],
  },
  {
    id: 'fighter', name: 'REBEL FIGHTER', rarity: 'rare',
    bg: 'linear-gradient(135deg,#ff2e63,#b83dff)',
    pixels: [
      'K..............K','KK............KK','KSK..........KSK','KCSK........KSCK',
      'KSCSK......KSCSK','.KSCSKKKKKKSCSK.','..KSCSDDDDSCSK..','...KSDWWWWDSK...',
      '...KSDCCCCDSK...','...KSDWWWWDSK...','..KSCSDDDDSCSK..','.KSCSKKKKKKSCSK.',
      'KSCSK......KSCSK','KCSK........KSCK','KSK..........KSK','K..............K',
    ],
  },
  {
    id: 'alien', name: 'MARSH SCAMP', rarity: 'rare',
    bg: 'linear-gradient(135deg,#3ce67a,#4cf1ff)',
    pixels: [
      '.....KKKKKK.....','....KGGGGGGK....','...KGGCGGCGGK...','...KGCKGGKCGK...',
      '...KGGCGGCGGK...','....KGGGGGGK....','.....KGRRGK.....','....KKGGGGKK....',
      '...KGGGGGGGGK...','..KGGCGGGGCGGK..','..KGGGGGGGGGGK..','..KGGGGGGGGGGK..',
      '...KGGGGGGGGK...','....KGK..KGK....','....KGK..KGK....','....KKK..KKK....',
    ],
  },
  {
    id: 'starship', name: 'RIM CRUISER', rarity: 'epic',
    bg: 'linear-gradient(135deg,#b83dff,#ff2e63)',
    pixels: [
      '........K.......', '.......KSK......','......KSWSK.....', '.....KSWCWSK....',
      '....KSWCCCWSK...','...KSWCCWCCWSK..','..KSSSCCCCCCSSSK','.KSSDDCCKKCCDDSSK',
      'KSSSDDDDKDDDDSSSK','.KSSSSSSKSSSSSSK.','..KKSSSKKKSSSKK..','...KOYOKKKOYOK...',
      '....KYYKYKYYK....', '.....KOKKKOK....','......K.K.K.....', '......Y.Y.Y.....',
    ],
  },
  {
    id: 'princess', name: 'REBEL GENERAL', rarity: 'epic',
    bg: 'linear-gradient(135deg,#ff9ec7,#b83dff)',
    pixels: [
      '.....KKKKKK.....','....KTTTTTTK....','...KTYYYYYTK....','..KTYWYYWYYTK...',
      '..KEEWEEWEEK....','..KEWEEEEWEK....','...KEEKKEEK.....','....KEEEEK......',
      '...KWWWWWWK.....','..KWRRWWRRWK....','..KWWWRRWWWK....','..KWWRRRRWWK....',
      '..KWWWWWWWWK....','...KWW..WWK.....','...KEE..EEK.....','...KKK..KKK.....',
    ],
  },
  {
    id: 'yoda', name: 'GRAND MASTER', rarity: 'legendary',
    bg: 'linear-gradient(135deg,#ffd93d,#3ce67a)',
    pixels: [
      '..GG........GG..','.GGGG......GGGG.','..GGGGGGGGGGGG..','.GGKGGGGGGGGKGG.',
      '.GGGKWGGGGWKGGG.','.GGGWKGGGGKWGGG.','.GGGGGKRRKGGGGG.','..GGGGGGGGGGGG..',
      '...KTTTTTTTTK...','..KTTWTTTTWTTK..','..KTTTTTTTTTTK..','..KTTTTTTTTTTK..',
      '...KTTTTTTTTK...','....KTK..KTK....','....KTK..KTK....','....KKK..KKK....',
    ],
  },
  {
    id: 'bot', name: 'PROTOCOL-BOT', rarity: 'legendary',
    bg: 'linear-gradient(135deg,#4cf1ff,#3da5ff)',
    pixels: [
      '.......KK.......','......KCCK......','.....KCCCCK.....','....KKKKKKKK....',
      '...KDDDDDDDDK...','..KDDCCDDCCDDK..','..KDDCWDDWCDDK..','..KDDDDRRDDDDK..',
      '..KDDDDDDDDDDK..','..KDSSSSSSSSDK..','...KDDDDDDDDK...','....KDDDDDDK....',
      '...KYK....KYK...','...KYK....KYK...','...KOK....KOK...','...KKK....KKK...',
    ],
  },
  // ── Common stickers ──────────────────────────────
  {
    id: 'blaster', name: 'ION BLASTER', rarity: 'common',
    bg: 'linear-gradient(135deg,#ff7a1f,#ff2e63)',
    pixels: [
      '................','................','....KKKKKKK.....','...KSSSSSSSKK...',
      '..KSSSSSSSSSNK..','..KSDDDDSSSSNK..','KKKSDDDDSSNNNK..','KWWKSSSSSSSNK...',
      'KKKKSSSRRSSNK...','..KSSSSSSSNK....','..KSSSSSSSKK....','...KKKKKKKK.....',
      '................','................','................','................',
    ],
  },
  {
    id: 'trooper', name: 'STORM TROOPER', rarity: 'common',
    bg: 'linear-gradient(135deg,#d4d4e8,#8a8aad)',
    pixels: [
      '....KKKKKKKK....','...KWWWWWWWWK...','..KWWWWWWWWWWK..','..KWKWWWWWWKWK..',
      '..KKKKWWWWKKKK..','..KWWKKKKKKWWK..','...KWWKWWKWWK...','....KKKKKKKKK...',
      '.....KWWWWK.....','...KWWWWWWWWK...','..KWWKWWWWKWWK..','..KWWWWWWWWWWK..',
      '..KWWWWWWWWWWK..','...KWW....WWK...','...KSS....SSK...','...KKK....KKK...',
    ],
  },
  {
    id: 'spacestation', name: 'ORBITAL BASE', rarity: 'common',
    bg: 'linear-gradient(135deg,#2d2d5c,#8a8aad)',
    pixels: [
      '......KKKK......','.....KSSSSKK....','....KSSDDSSKK...','...KSDDDDDDSSK..',
      '..KSDDDDDDDDSK.','..KSDDRRDDRDDSK.','..KSDDDDDDDDDSK','KKKSDDDDDDDDSKK',
      'KSSSDDDDDDDDSSSK','KKKSDDDDDDDDSKK','..KSDDDDDDDDDSK','..KSDDRRDDRDDSK.',
      '..KSDDDDDDDDSK.','...KSDDDDDDSSK..','....KSSDDSSKK...','......KKKK......',
    ],
  },
  {
    id: 'asteroid', name: 'SPACE ROCK', rarity: 'common',
    bg: 'linear-gradient(135deg,#0a0a14,#2d2d5c)',
    pixels: [
      '................','......KKKK......','....KKSSSKKK....','...KSSSNSSSSK...',
      '..KSSNNSNSSSSKK.','..KSNNSSSSSSNSK.','.KSSSSSSNNSSSSK.','.KSNSSSSSSSSSK..',
      '.KSSSSSSNNSSSSK.','.KSNNSSSSSSNSK..','..KSSNNSNSSSK...','..KSSNSSSSSKK...',
      '...KSSSSSSK.....','....KKSSKK......','.....KKKK.......','................',
    ],
  },
  {
    id: 'crystal', name: 'KYBER CRYSTAL', rarity: 'common',
    bg: 'linear-gradient(135deg,#4cf1ff,#3da5ff)',
    pixels: [
      '................','.......KK.......','......KCCK......','.....KCWCCK.....',
      '....KCWCCWCK....','...KCWCCCWCK....','...KCWCWCWCK....','..KCCCWCCCCK....',
      '..KCWCCCWCCK....','..KCCCWCCCCK....','...KCWCCCCK.....','...KCCCWCK......',
      '....KCCCCK......','.....KCKK.......','......KK........','................',
    ],
  },
  {
    id: 'shieldgen', name: 'SHIELD ARRAY', rarity: 'common',
    bg: 'linear-gradient(135deg,#3da5ff,#3ce67a)',
    pixels: [
      '................','......KBKK......','.....KBBBKK.....','....KBCBBCBK....',
      '...KBCCCCCBK....','..KBCCCCCCCBK...','..KBCCCCCCCBK...','.KBCCCCCCCCCBK..',
      '.KBCCCBBCCCBK...','..KBCBBBBCBK....','..KBBBKKBBBK....','...KBKKKKKBK....',
      '...KKSSSSKKK....','....KSSSSKK.....','....KSSKSKK.....','....KKKKKKK.....',
    ],
  },
  {
    id: 'comlink', name: 'HOLO-COMLINK', rarity: 'common',
    bg: 'linear-gradient(135deg,#8a8aad,#d4d4e8)',
    pixels: [
      '................','................','....KKKKKKK.....','...KSSSSSSSK....','..KSSSSSSSSSSK..',
      '..KSDDDDDDDSK..','..KSDBDDDBDSK..','..KSDDDDDDDSK..','..KSSSSSSSSSSK..',
      '..KSKKKKKKKSK..','..KSDDDDDDDSK..','..KSDDDDDDDSK..','..KSSSSSSSSSSK..',
      '...KSSSSSSSK....','....KKKKKKK.....','................',
    ],
  },
  {
    id: 'speeder', name: 'SWOOP BIKE', rarity: 'common',
    bg: 'linear-gradient(135deg,#ff7a1f,#ffd93d)',
    pixels: [
      '................','................','...........KK...','..........KRSK..',
      '...KK....KRRSK..','..KSSKKKKSSSSK..','..KSSSSSSSSSSK..','.KDSSSSSSSSSDK..',
      'KDDSSSSSSSSSDDK.','KDDSSSRRSSSDDK..','KKKSSSSSSSKKK...','..KSSSSSSSK.....',
      '..KOYKKKKOYOK...','..KYK....KYKK...','..KKK.....KK....','................',
    ],
  },
  // ── Rare stickers ──────────────────────────────
  {
    id: 'bountyhunter', name: 'BOUNTY HUNTER', rarity: 'rare',
    bg: 'linear-gradient(135deg,#3ce67a,#ffd93d)',
    pixels: [
      '....KKKKKKKK....','...KGGGGGGGGK...','..KGGGGGGGGGGK..','..KGKGGGGGGKGK..',
      '..KKRKKKKKKRKK..','..KGGKKKKKKGGK..','...KGGGGGGGGK...','....KKKKKKKK....',
      '...KGGGGGGGGK...','..KGKGGGGGGKGK..','..KGGGGGGGGGGK..','..KGGGRRGGGGGK..',
      '..KGGGGGGGGGGK..','...KGG....GGK...','...KGG....GGK...','...KKK....KKK...',
    ],
  },
  {
    id: 'pilot', name: 'ACE PILOT', rarity: 'rare',
    bg: 'linear-gradient(135deg,#ff7a1f,#ff2e63)',
    pixels: [
      '.....KKKKKK.....','....KOOOOOOOK...','...KOOOOOOOOOK..','..KKKKOOOOKKKK..',
      '..KDDKWWWWKDDK..','..KDDKWKKWKDDK..','...KDKKKKKKDK...','....KEEEEEEK....',
      '...KOOOOOOOOOK..','..KOOOKOOOOKOOK.','..KOOOOOOOOOOOOK','..KOOROOOOROOK..',
      '..KOOOOOOOOOOK..','...KOO....OOK...','...KSS....SSK...','...KKK....KKK...',
    ],
  },
  {
    id: 'smugglership', name: 'SMUGGLER SHIP', rarity: 'rare',
    bg: 'linear-gradient(135deg,#8a8aad,#4cf1ff)',
    pixels: [
      '................','........KKK.....','..KKKKKKSSSKK...','..KSSSSSSSSSSK..',
      '.KSSDDDDDDDSSK.','.KSDDDDDDDDDSSK','KSDDDDWWDDDDSSK','KSDDDDWWDDDDSK.',
      'KSDDDDDDDDDSK..','KKSDSSSSSSDSKK..','.KKSKKKKKKSKKK..','.KOYOK..KOYOK...',
      '..KYK....KYK....','..KKK....KKK....','................','................',
    ],
  },
  {
    id: 'wookiee', name: 'MIGHTY WOOKIEE', rarity: 'rare',
    bg: 'linear-gradient(135deg,#ff7a1f,#ffd93d)',
    pixels: [
      '....KOOOOOOK....','...KOOOOOOOOOK..','..KOOOKOOKOOOOK.','..KOOWKOOOKWOOOK',
      '..KOOOKOOKOOOOK.','..KOOOOROOOOOK..','...KOOOOOOOOOK..','....KOOOOOOOK...',
      '...KOOOOOOOOK...','..KOOOKOOOKOOK..','..KOOOOOOOOOOK..','..KOOOOOOOOOOK..',
      '...KOOOOOOOOOK..','...KOOKK.KOOK...','...KOOK..KOOK...','...KKKK..KKKK...',
    ],
  },
  {
    id: 'darktrooper', name: 'DARK TROOPER', rarity: 'rare',
    bg: 'linear-gradient(135deg,#0a0a14,#8a8aad)',
    pixels: [
      '....KKKKKKKK....','...KNNNNNNNNK...','..KNNNNNNNNNNNK.','..KNRNNNNNNRNK..',
      '..KNRRNNNNRRNK..','..KNNKKKKKKNNK..','...KNNNNNNNNK...','....KKKKKKKK....',
      '....KNNNNNK.....','...KNNNNNNNK....','..KNNKNNNKNNNK..','..KNNNNNNNNNK...',
      '..KNNNNNNNNNNK..','...KNN....NNK...','...KNN....NNK...','...KKK....KKK...',
    ],
  },
  // ── Epic stickers ──────────────────────────────
  {
    id: 'sithlord', name: 'SITH LORD', rarity: 'epic',
    bg: 'linear-gradient(135deg,#ff2e63,#0a0a14)',
    pixels: [
      '..KKKKKKKKKKK...','..KNNNNNNNNNK...','.KNNNNNNNNNNNNK.','.KNNKNNNNNNKNNK.',
      '.KNRRKNNNKRRNK..','.KNNKNNNNNNKNK..','..KNNNKRRKNNK...','..KNNNNNNNNK....',
      '...KNNNNNNNK....','..KKKKKKKKKK....','..KNNNNNNNNNK...','..KNRNNNNNNRNK..',
      '..KNNNNNNNNNK...','...KNN....NNK...','...KNN....NNK...','...KKK....KKK...',
    ],
  },
  {
    id: 'stardestroyer', name: 'STAR DESTROYER', rarity: 'epic',
    bg: 'linear-gradient(135deg,#2d2d5c,#d4d4e8)',
    pixels: [
      '........K.......','........KK......','.......KSSK.....','.......KSSSK....',
      '......KSDDSK....','......KSDDSK....','....KKSDDDDSKKK.',
      '...KSDDDDDDDDDSK','..KSSDDDDDDDDSSSK','.KSSSDDDDDDDDSSK',
      'KSSSDDDKKKKDDDSSSK','.KSSKKKKKKKKKSSK.','..KKOYOKKOYOKK..','...KOYKKKKYOK...',
      '....KYK..KYK....','....KKK..KKK....',
    ],
  },
  {
    id: 'jeditemple', name: 'JEDI TEMPLE', rarity: 'epic',
    bg: 'linear-gradient(135deg,#ffd93d,#3da5ff)',
    pixels: [
      '.......YY.......','......KBBK......','.....KBCCBK.....','....KBCCCCBK....',
      '....KKKBBKKKK...','...KSSK..KSSK...','...KSSK..KSSK...','..KSSSK..KSSSK..',
      '..KSSSK..KSSSK..','..KSSSK..KSSSK..','..KSSSK..KSSSK..','.KSSSSKKKKSSSSK.',
      '.KSSSSSSSSSSSSK.','KDDDDDDDDDDDDDK','KDDDKDDDDKDDDK.','KKKKKKKKKKKKKKK.',
    ],
  },
  // ── Legendary stickers ──────────────────────────
  {
    id: 'theforce', name: 'THE FORCE', rarity: 'legendary',
    bg: 'linear-gradient(135deg,#ffd93d,#4cf1ff)',
    pixels: [
      '..C...Y....C....','...C..YY..B.....','....CYBBYC......','...CYBBWBBYC....',
      '..CYBBWWWBBYC...','..CBBWWWWWBBC...','.CYBWWWWWWWBYC..','.CBBWWWWWWWBBC..',
      '.CYBWWWWWWWBYC..','..CBBWWWWWBBC...','..CYBBWWWBBYC...','...CYBBWBBYC....',
      '....CYBBYC......','...C..YY..B.....','..C...Y....C....','................',
    ],
  },
  {
    id: 'emperor', name: 'GALAXY EMPEROR', rarity: 'legendary',
    bg: 'linear-gradient(135deg,#b83dff,#ff2e63)',
    pixels: [
      '..M...KKKK...M..','..MM.KNNNNK.MM..','.MMM.KNNNNK.MMM.','.MMKKNNNNNNKKMM.',
      '..KNRNNNNNNRNK..','..KNRRNNNNRRNK..','..KNNKKNNKKNNK..','...KNNRRRNNK....',
      '..KTTTTTTTTTTK..','..KTKTTTTTTKTK..','.KTTTTTTTTTTTK..','.KTTRTTTTRTTTK..',
      '.KTTTTTTTTTTK...','..KTT....TTK....','..KTT....TTK....','..KKK....KKK....',
    ],
  },
]

export const PALETTE: Record<string, string> = {
  K: '#0a0a14', W: '#ffffff', Y: '#ffd93d', O: '#ff7a1f',
  R: '#ff2e63', M: '#b83dff', B: '#3da5ff', C: '#4cf1ff',
  G: '#3ce67a', N: '#2d2d5c', S: '#8a8aad', D: '#d4d4e8',
  T: '#7a3ea1', E: '#ff9ec7',
}

export const RARITY_COLOR: Record<string, string> = {
  common: '#8a8aad', rare: '#4cf1ff', epic: '#b83dff', legendary: '#ffd93d',
}
