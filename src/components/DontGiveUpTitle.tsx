/** Original lettering drawn for Belum Menyerah. No reference artwork or font files. */
const letters: Record<string, string> = {
  D: 'M9 8Q42 2 63 9C101 19 105 51 102 77C99 116 77 137 14 136Q5 133 6 123L5 19Q4 10 9 8ZM35 36L36 109C63 112 76 93 77 70C77 46 60 35 35 36Z',
  O: 'M51 4C82 3 104 29 104 71C104 111 86 140 54 141C20 142 2 115 3 73C4 33 19 5 51 4ZM52 36C37 37 31 51 31 75C32 98 38 110 53 109C69 108 76 93 75 70C75 47 67 35 52 36Z',
  N: 'M7 9Q22 5 35 8L72 76L70 9Q85 5 101 7L100 133Q87 139 74 135L36 64L38 136Q22 140 7 135Z',
  T: 'M3 9Q48 4 99 8L98 39L67 39L68 135Q51 138 36 135L37 39L3 39Z',
  G: 'M97 29L77 53C62 25 33 32 32 73C31 105 53 119 73 103L72 88L54 89L54 63L102 61L103 120C84 142 56 146 33 135C8 124 0 100 2 73C3 29 19 5 52 4C72 3 88 12 97 29Z',
  I: 'M10 7L48 5L45 135L10 137Z',
  V: 'M2 9L35 5L56 97L75 6L108 9L73 135Q57 139 40 135Z',
  E: 'M8 7L92 5L94 34L38 36L39 59L85 57L85 86L39 86L40 108L97 107L94 136L8 138Z',
  U: 'M6 8L37 6L36 86C34 115 73 117 73 85L75 7L107 9L105 91C104 125 85 143 54 143C21 141 4 125 4 91Z',
  P: 'M9 7Q51 2 73 11C119 26 111 85 72 93L40 95L40 137L8 137ZM40 35L39 68C54 69 78 67 78 50C78 35 53 33 40 35Z',
};
const rows = [
  [{ c: 'D', x: 36, y: 3, r: -4 }, { c: 'O', x: 145, y: 1, r: 2 }, { c: 'N', x: 258, y: 2, r: -2 }, { c: 'T', x: 402, y: 0, r: 2 }],
  [{ c: 'G', x: 78, y: 148, r: 2 }, { c: 'I', x: 195, y: 151, r: -3 }, { c: 'V', x: 256, y: 148, r: -1 }, { c: 'E', x: 373, y: 149, r: 3 }],
  [{ c: 'U', x: 163, y: 293, r: -3 }, { c: 'P', x: 286, y: 295, r: 3 }],
];
export default function DontGiveUpTitle() {
  return <h1 className="giveup-title">
    <span className="khusus-pembaca-layar">Don’t give up.</span>
    <svg viewBox="0 0 540 450" fill="currentColor" aria-hidden="true" focusable="false">
      {rows.flat().map(({ c, x, y, r }) => <path key={`${c}-${y}`} d={letters[c]} fillRule="evenodd" transform={`translate(${x} ${y}) rotate(${r} 52 72)`} />)}
      <path d="M380 9C399 0 409 24 395 40L380 52L373 41C391 31 383 28 379 28C367 27 369 13 380 9Z" />
    </svg>
  </h1>;
}
