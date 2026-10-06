const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const React = require('react');
const { renderToStaticMarkup } = require('react-dom/server');
const { JSDOM } = require('jsdom');
const { project, loadSource } = require('./helpers.cjs');

const notFoundError = new Error('NEXT_HTTP_ERROR_FALLBACK;404');
const navigation = { notFound: () => { throw notFoundError; } };
const articleSettings = loadSource('src/lib/article-visibility.ts');
const visibility = loadSource('src/app/blog/_visibility.ts', {
  'next/navigation': navigation,
  '@/lib/article-visibility': articleSettings,
});
const Link = ({ children, ...props }) => React.createElement('a', props, children);
const Empty = () => null;

test('public article gate responds with notFound', () => {
  assert.equal(articleSettings.PUBLIC_ARTICLES_ENABLED, false);
  assert.throws(() => visibility.requirePublicArticles(), (error) => error === notFoundError);
});

test('the visibility gate can be reopened explicitly without changing the stored article content', () => {
  const reopened = loadSource('src/app/blog/_visibility.ts', {
    'next/navigation': navigation,
    '@/lib/article-visibility': { PUBLIC_ARTICLES_ENABLED: true },
  });
  assert.doesNotThrow(() => reopened.requirePublicArticles());
});

const blog = loadSource('src/lib/blog.ts');
const markdown = loadSource('src/lib/markdown.ts');
function newBlogRoute(file) {
  return loadSource(file, {
    'next/navigation': navigation, 'next/link': Link,
    '@/components/Masthead': Empty, '@/components/Kaki': Empty,
    '@/components/ArrowIcon': Empty, '@/lib/blog': blog, '@/lib/markdown': markdown,
  });
}

test('new public listing exposes exactly the curated articles without database reads', () => {
  const route = newBlogRoute('src/app/blog/page.tsx');
  const dom = new JSDOM(renderToStaticMarkup(React.createElement(route.default)));
  assert.equal(blog.ARTIKEL_BLOG.length, 3);
  assert.equal(new Set(blog.ARTIKEL_BLOG.map(a => a.slug)).size, 3);
  assert.deepEqual([...dom.window.document.querySelectorAll('main li a')].map(a => a.getAttribute('href')), blog.ARTIKEL_BLOG.map(a => `/blog/${a.slug}`));
  assert.equal(route.metadata.robots, undefined);
  dom.window.close();
});

test('all new article pages render their complete text and correct metadata', async () => {
  const route = newBlogRoute('src/app/blog/[slug]/page.tsx');
  assert.equal(route.dynamicParams, false);
  assert.deepEqual(route.generateStaticParams(), blog.ARTIKEL_BLOG.map(({slug}) => ({slug})));
  for (const article of blog.ARTIKEL_BLOG) {
    const params = Promise.resolve({ slug: article.slug });
    const meta = await route.generateMetadata({params});
    assert.equal(meta.title, article.judul);
    assert.equal(meta.alternates.canonical, `/blog/${article.slug}`);
    const dom = new JSDOM(renderToStaticMarkup(await route.default({params})));
    assert.equal(dom.window.document.querySelector('h1').textContent, article.judul);
    assert.ok(dom.window.document.querySelector('.prosa').textContent.length > 700);
    assert.ok(dom.window.document.querySelector('a[href="/blog"]'));
    assert.equal(dom.window.document.querySelectorAll('form').length, 0);
    dom.window.close();
  }
});

for (const entrypoint of ['default', 'generateMetadata']) {
  test(`legacy and unknown slugs remain 404 in ${entrypoint}`, async () => {
    const route = newBlogRoute('src/app/blog/[slug]/page.tsx');
    for (const slug of ['existing-article', 'private-draft', 'missing-page', '__proto__']) {
      await assert.rejects(route[entrypoint]({params: Promise.resolve({slug})}), error => error === notFoundError);
    }
  });
}

test('sitemap contains only working destinations and new curated articles', () => {
  const sitemap = loadSource('src/app/sitemap.ts', {'@/lib/blog': blog}).default;
  const paths = sitemap().map(entry => new URL(entry.url).pathname);
  assert.deepEqual(paths, ['/', '/belajar', '/tentang', '/berlangganan', '/blog', ...blog.ARTIKEL_BLOG.map(a => `/blog/${a.slug}`)]);
  assert.ok(paths.every(route => !/^\/(?:admin|berhenti)(?:\/|$)/.test(route)));
});

function filesIn(relativeDirectory) {
  return fs.readdirSync(path.join(project, relativeDirectory), { withFileTypes: true }).flatMap((entry) => {
    const relative = path.join(relativeDirectory, entry.name);
    return entry.isDirectory() ? filesIn(relative) : [relative];
  });
}

test('no public search, feed, sitemap, or API reader exposes legacy database article data', () => {
  const discoveryFiles = filesIn('src/app').filter((file) => (
    /(?:^|\/)(?:sitemap|feed|rss|atom|search|cari)(?:[./]|$)/i.test(file)
    || (/\/api\/.+\/route\.[jt]s$/.test(file) && !file.includes('/api/kirim/'))
  ));
  assert.ok(discoveryFiles.includes('src/app/sitemap.ts'));
  for (const file of discoveryFiles) {
    const source = fs.readFileSync(path.join(project, file), 'utf8');
    assert.doesNotMatch(source, /(?:lib\/tulisan|\.from\(['"]tulisan['"]\))/, file);
  }
});

test('the 404 recovery destination is the free course catalog, not a disabled article route', () => {
  const NotFound = loadSource('src/app/not-found.tsx', {
    'next/link': Link,
    '@/components/Masthead': Empty,
    '@/components/Kaki': Empty,
    '@/components/Ilustrasi': { LabelHarga: Empty },
  }).default;
  const dom = new JSDOM(renderToStaticMarkup(React.createElement(NotFound)));
  try {
    assert.equal(dom.window.document.querySelector('a[href="/belajar"]').textContent, 'Lihat kursus gratis');
    assert.equal(dom.window.document.querySelectorAll('a[href^="/blog"]').length, 0);
  } finally { dom.window.close(); }
});

test('new signup welcome emails link to free courses and retain the unsubscribe link', () => {
  const { emailSelamatDatang, alamatSitus } = loadSource('src/lib/email.ts', {
    resend: { Resend: class { constructor() { throw new Error('No email service may be called by this test'); } } },
    './markdown': {},
    './format': {},
    './article-visibility': articleSettings,
  });
  const message = emailSelamatDatang('test-unsubscribe-token');
  const dom = new JSDOM(message.html);
  try {
    const links = [...dom.window.document.querySelectorAll('a')].map((link) => link.href);
    assert.ok(links.includes(`${alamatSitus()}/belajar`));
    assert.ok(links.includes(`${alamatSitus()}/berhenti?token=test-unsubscribe-token`));
    assert.match(message.teks, /Kursus gratis: .*\/belajar\nBerhenti:/);
    assert.doesNotMatch(`${message.html}\n${message.teks}`, /\/blog(?:\/|["\s<])/);
  } finally { dom.window.close(); }
});

for (const enabled of [false, true]) {
  test(`article emails preserve their content and unsubscribe link while the public CTA is ${enabled ? 'enabled' : 'disabled'}`, () => {
    const { emailTulisan, alamatSitus } = loadSource('src/lib/email.ts', {
      resend: { Resend: class { constructor() { throw new Error('No live email'); } } },
      './article-visibility': enabled ? { PUBLIC_ARTICLES_ENABLED: true } : articleSettings,
      './markdown': { keHtml: (text) => `<p>${text}</p>`, keTeks: (text) => text },
      './format': { penanda: () => 'Catatan', tanggalPanjang: () => '6 Oktober 2026' },
    });
    const article = {
      slug: 'existing-article', judul: 'Tulisan tersimpan', deck: 'Ringkasan tetap ada',
      isi: 'Seluruh isi email tetap disertakan.', penulis: 'Redaksi', menit_baca: 3,
      format: 'catatan', status: 'terbit',
    };
    const message = emailTulisan(article, 'test-unsubscribe-token');
    const dom = new JSDOM(message.html);
    try {
      const links = [...dom.window.document.querySelectorAll('a')].map((link) => link.href);
      assert.equal(message.subjek, article.judul);
      for (const value of [article.judul, article.deck, article.isi]) {
        assert.ok(dom.window.document.body.textContent.includes(value));
        assert.ok(message.teks.includes(value));
      }
      assert.ok(links.includes(`${alamatSitus()}/berhenti?token=test-unsubscribe-token`));
      assert.ok(message.teks.includes(`Berhenti: ${alamatSitus()}/berhenti?token=test-unsubscribe-token`));
      assert.equal(links.includes(`${alamatSitus()}/blog/${article.slug}`), enabled);
      assert.equal(message.teks.includes(`Baca: ${alamatSitus()}/blog/${article.slug}`), enabled);
      assert.equal(dom.window.document.body.textContent.includes('Baca di situs'), enabled);
    } finally { dom.window.close(); }
  });
}

test('the article email API rejects anonymous access before looking up any article or sending email', async () => {
  const calls = { data: 0, email: 0 };
  const { POST } = loadSource('src/app/api/kirim/route.ts', {
    'next/server': { NextResponse: { json: (body, options) => ({ body, status: options?.status ?? 200 }) } },
    '@/lib/supabase/server': {
      supabaseTerpasang: () => true,
      klienServer: async () => ({
        auth: { getUser: async () => ({ data: { user: null } }) },
        from: () => { calls.data++; throw new Error('Anonymous article lookup'); },
      }),
    },
    '@/lib/email': {
      resendTerpasang: () => true,
      klienResend: () => { calls.email++; throw new Error('Anonymous email send'); },
    },
  });
  const response = await POST({ json: async () => ({ tulisan_id: 'existing-article' }) });
  assert.equal(response.status, 401);
  assert.deepEqual(calls, { data: 0, email: 0 });
});

test('the authenticated article list remains available with both draft and published records', async () => {
  const records = [
    { id: 'draft-id', slug: 'private-draft', judul: 'Draf tersimpan', status: 'draf', format: 'catatan' },
    { id: 'published-id', slug: 'existing-article', judul: 'Tulisan tersimpan', status: 'terbit', format: 'catatan' },
  ];
  const calls = [];
  const query = {
    select(fields) { calls.push(['select', fields]); return this; },
    order(field) { calls.push(['order', field]); return this; },
    async limit(count) { calls.push(['limit', count]); return { data: records }; },
  };
  const AdminArticles = loadSource('src/app/admin/page.tsx', {
    'next/link': Link,
    '@/components/BelumTersambung': Empty,
    '@/lib/format': { NAMA_FORMAT: { catatan: 'Catatan' }, tanggalPendek: () => '06 Okt' },
    '@/lib/supabase/server': {
      supabaseTerpasang: () => true,
      klienServer: async () => ({ from: (table) => { calls.push(['from', table]); return query; } }),
    },
  }).default;
  const dom = new JSDOM(renderToStaticMarkup(await AdminArticles()));
  try {
    assert.deepEqual(calls[0], ['from', 'tulisan']);
    assert.equal(dom.window.document.querySelectorAll('tbody tr').length, 2);
    for (const record of records) {
      assert.equal(dom.window.document.querySelector(`a[href="/admin/tulis/${record.id}"]`).textContent, record.judul);
    }
    assert.match(dom.window.document.body.textContent, /1 terbit · 1 draf/);
  } finally { dom.window.close(); }
});

for (const enabled of [false, true]) {
  for (const status of ['draf', 'terbit']) {
  test(`the authenticated editor preserves a ${status} article while public links are ${enabled ? 'enabled' : 'disabled'}`, async () => {
    const record = { id: 'article-id', slug: 'article-slug', judul: 'Konten tetap tersimpan', status };
    const calls = [];
    const query = {
      select(fields) { calls.push(['select', fields]); return this; },
      eq(field, value) { calls.push(['eq', field, value]); return this; },
      async maybeSingle() { return { data: record }; },
    };
    const Editor = loadSource('src/app/admin/tulis/[id]/page.tsx', {
      'next/link': Link,
      'next/navigation': navigation,
      '@/lib/article-visibility': enabled ? { PUBLIC_ARTICLES_ENABLED: true } : articleSettings,
      '@/components/EditorTulisan': ({ awal }) => React.createElement('div', { 'data-editor-id': awal.id }, awal.judul),
      '@/lib/format': { tanggalPanjang: () => '6 Oktober 2026' },
      '@/lib/supabase/server': {
        supabaseTerpasang: () => true,
        klienServer: async () => ({ from: (table) => { calls.push(['from', table]); return query; } }),
      },
    }).default;
    const dom = new JSDOM(renderToStaticMarkup(await Editor({ params: Promise.resolve({ id: record.id }) })));
    try {
      assert.deepEqual(calls, [['from', 'tulisan'], ['select', '*'], ['eq', 'id', record.id]]);
      assert.equal(dom.window.document.querySelector('[data-editor-id]').textContent, record.judul);
      assert.equal(dom.window.document.querySelectorAll(`a[href="/blog/${record.slug}"]`).length, enabled && status === 'terbit' ? 1 : 0);
    } finally { dom.window.close(); }
  });
  }
}
