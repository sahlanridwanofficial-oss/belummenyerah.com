import { marked } from 'marked';
import sanitizeHtml from 'sanitize-html';

marked.setOptions({ gfm: true, breaks: false });

/** Sanitize at every HTML render boundary, including stored legacy content. */
export function keHtml(markdown: string): string {
  const parsed = marked.parse(markdown ?? '', { async: false }) as string;
  const html = sanitizeHtml(parsed, {
    allowedTags: [
      'p', 'br', 'hr', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
      'blockquote', 'ul', 'ol', 'li', 'strong', 'b', 'em', 'i', 's', 'del',
      'pre', 'code', 'a', 'img', 'table', 'thead', 'tbody', 'tfoot', 'tr', 'th', 'td',
    ],
    allowedAttributes: {
      a: ['href', 'title'],
      img: ['src', 'alt', 'title', 'width', 'height'],
      ol: ['start'],
      th: ['colspan', 'rowspan', 'scope'],
      td: ['colspan', 'rowspan'],
      code: ['class'],
    },
    allowedClasses: { code: ['language-*'] },
    allowedSchemes: ['http', 'https', 'mailto'],
    allowedSchemesByTag: { img: ['http', 'https'] },
    allowProtocolRelative: false,
    disallowedTagsMode: 'discard',
  });
  // Tabel lebar dibungkus supaya bisa digeser di dalam wadahnya sendiri,
  // bukan membuat seluruh halaman melebar di layar ponsel.
  return html
    .replace(/<table>/g, '<div class="tabel-geser"><table>')
    .replace(/<\/table>/g, '</table></div>');
}

/** Versi teks polos untuk cuplikan dan email. */
export function keTeks(markdown: string, batas = 240): string {
  const polos = (markdown ?? '')
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/!\[[^\]]*\]\([^)]*\)/g, ' ')
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/[#>*_`~-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  return polos.length > batas ? `${polos.slice(0, batas).trimEnd()}…` : polos;
}
