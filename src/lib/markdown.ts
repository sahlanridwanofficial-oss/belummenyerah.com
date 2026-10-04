import { marked } from 'marked';

marked.setOptions({ gfm: true, breaks: false });

/**
 * Isi tulisan hanya ditulis oleh redaksi lewat /admin, jadi HTML mentah
 * di dalamnya sengaja dibiarkan lewat. Kalau nanti ada penulis tamu,
 * pasang sanitiser di sini sebelum membuka aksesnya.
 */
export function keHtml(markdown: string): string {
  const html = marked.parse(markdown ?? '', { async: false }) as string;
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
