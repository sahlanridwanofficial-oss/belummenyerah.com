/** Stroke-based icon stays crisp without relying on font glyph coverage. */
export default function ArrowIcon({ className }: { className?: string }) {
  return <svg className={className} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false"><path d="M6 18L18 6M6 6h12v12"/></svg>;
}
