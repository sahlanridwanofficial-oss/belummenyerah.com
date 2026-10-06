/** Only return to a local admin route after login; never accept arbitrary URLs. */
export function adminReturnPath(value: string | null): string {
  if (!value || /[\\\s%]/.test(value)) return '/admin';
  try {
    const url = new URL(value, 'https://admin.invalid');
    if (url.origin !== 'https://admin.invalid' || !value.startsWith('/')) return '/admin';
    if (url.pathname === '/admin/login' || url.pathname.startsWith('/admin/login/')) return '/admin';
    if (url.pathname !== '/admin' && !url.pathname.startsWith('/admin/')) return '/admin';
    return `${url.pathname}${url.search}${url.hash}`;
  } catch {
    return '/admin';
  }
}
