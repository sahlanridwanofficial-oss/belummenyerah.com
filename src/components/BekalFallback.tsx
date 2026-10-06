/** Original lightweight still illustration. Shown only until genuine WebGL is ready. */
export default function BekalFallback() {
  return <svg viewBox="0 0 480 520" className="bekal-fallback" aria-hidden="true" focusable="false">
    <defs>
      <linearGradient id="bekal-paper" x1="0" y1="0" x2="1" y2="1"><stop stopColor="#ffe596"/><stop offset="1" stopColor="#ecc04d"/></linearGradient>
      <radialGradient id="bekal-shadow"><stop stopColor="#14140f" stopOpacity=".15"/><stop offset="1" stopColor="#14140f" stopOpacity="0"/></radialGradient>
    </defs>
    <ellipse cx="247" cy="449" rx="160" ry="29" fill="url(#bekal-shadow)"/>
    <g stroke="#14140f" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M189 365L184 415M284 363L297 412" fill="none" strokeWidth="13"/>
      <path d="M185 402C202 403 208 428 187 433L145 432C130 423 151 401 185 402Z" fill="#14140f"/>
      <path d="M294 401C322 400 343 419 332 432L291 435C276 431 278 410 294 401Z" fill="#14140f"/>
      <path d="M335 244Q368 211 364 180" fill="none" strokeWidth="13"/>
      <path d="M359 185L348 163M365 180L366 151M372 183L383 162" fill="none" strokeWidth="9"/>
      <path d="M150 248Q106 274 106 318" fill="none" strokeWidth="13"/>
      <path d="M155 140L184 121L319 127L344 163L335 358Q331 378 309 380L166 362Z" fill="#cda746"/>
      <path d="M143 156Q142 137 163 134L283 137L319 181L310 356Q309 373 288 373L158 366Q139 364 141 344Z" fill="url(#bekal-paper)"/>
      <path d="M283 137L281 180L319 181Z" fill="#fff2bb"/>
      <path d="M157 149L156 349" fill="none" stroke="#d3ab42" strokeWidth="4"/>
      <ellipse cx="208" cy="236" rx="9" ry="17" fill="#14140f" stroke="none" transform="rotate(-5 208 236)"/>
      <ellipse cx="263" cy="238" rx="9" ry="17" fill="#14140f" stroke="none" transform="rotate(5 263 238)"/>
      <path d="M220 274Q238 286 252 272" fill="none" strokeWidth="5"/>
      <path d="M182 207L199 202M266 207L280 214" fill="none" strokeWidth="5"/>
      <path d="M77 321L132 315L140 380L78 385Z" fill="#fffdf5" strokeWidth="4"/>
      <path d="M87 319Q84 286 116 292Q128 296 124 315" fill="none" strokeWidth="4"/>
      <path d="M96 344L119 342M96 355L115 353" fill="none" strokeWidth="3"/>
    </g>
  </svg>;
}
