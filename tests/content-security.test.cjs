const {test} = require('node:test');
const assert = require('node:assert/strict');
const React = require('react');
const {renderToStaticMarkup} = require('react-dom/server');
const {JSDOM} = require('jsdom');
const {loadSource} = require('./helpers.cjs');
const {keHtml} = loadSource('src/lib/markdown.ts');
const Link = ({children, ...props}) => React.createElement('a', props, children);
const TOKEN = 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee';

for (const attack of [
  '<script>alert(1)</script><p onclick="alert(1)">Text</p>',
  '<img src="x" onerror="alert(1)" style="background:url(javascript:alert(1))">',
  '<svg><a xlink:href="javascript:alert(1)">x</a><animate attributeName="href" values="javascript:alert(1)" /></svg>',
  '<math><mtext><table><mglyph><style><!--</style><img title="--><img src=x onerror=alert(1)>">',
  '<iframe srcdoc="<script>alert(1)</script>" src="https://evil.test"></iframe><form action="https://evil.test"><input name="password"></form>',
  '<a href="javascript:alert(1)">a</a><a href="jav&#x61;script:alert(1)">b</a>',
  '<a href="java&#x09;script:alert(1)">a</a><a href="java&#10;script:alert(1)">b</a>',
  '<a href="data:text/html,hello">a</a><img src="data:image/svg+xml,bad"><img src="javascript:alert(1)">',
  '[Click](javascript:alert%281%29) ![bad](data:image/svg+xml,anything)',
]) {
  test(`Markdown strips active HTML: ${attack.slice(0,55)}`, () => {
    const dom = new JSDOM(keHtml(attack));
    const document = dom.window.document;
    assert.equal(document.querySelector('script,style,svg,math,iframe,object,embed,form,input'), null);
    for (const el of document.querySelectorAll('*')) for (const attr of el.attributes) {
      assert.doesNotMatch(attr.name, /^(on|style$|srcdoc$)/i);
      if (['href','src'].includes(attr.name)) assert.doesNotMatch(attr.value.replace(/[\u0000-\u0020]/g,''), /^(?:javascript|data|vbscript):/i);
    }
    dom.window.close();
  });
}

test('safe Markdown, tables, escaped code, images and intended links survive sanitization', () => {
  const html = keHtml('# Heading\n\n**Bold** and *italic*. [Web](https://example.test/path) [Email](mailto:hi@example.test) [Local](/blog)\n\n![Image](https://example.test/img.png "Title")\n\n| A | B |\n|---|---|\n| 1 | 2 |\n\n```html\n<script>example</script>\n```');
  const dom = new JSDOM(html);
  const doc = dom.window.document;
  for (const selector of ['h1','strong','em','a[href="https://example.test/path"]','a[href="mailto:hi@example.test"]','a[href="/blog"]','img[src="https://example.test/img.png"]','.tabel-geser > table','pre > code.language-html']) assert.ok(doc.querySelector(selector), selector);
  assert.match(doc.querySelector('code').textContent, /<script>example<\/script>/);
  dom.window.close();
});

test('existing separate YouTube player remains available', () => {
  const Video = loadSource('src/components/PemutarVideo.tsx', {'@/lib/kursus-umum': loadSource('src/lib/kursus-umum.ts')}).default;
  const html = renderToStaticMarkup(React.createElement(Video,{url:'https://www.youtube.com/watch?v=dQw4w9WgXcQ',judul:'Materi'}));
  assert.match(html,/https:\/\/www.youtube-nocookie.com\/embed\/dQw4w9WgXcQ/);
  assert.match(html,/<iframe/);
});

for (const params of [{}, {token:TOKEN}, {token:TOKEN,hasil:'gagal'}, {hasil:'berhasil'}]) {
  test(`GET unsubscribe is render-only: ${JSON.stringify(params)}`, async () => {
    const Page = loadSource('src/app/berhenti/page.tsx', {
      'next/link':Link, '@/components/Masthead':()=>null, '@/components/Kaki':()=>null,
      '@/lib/supabase/server': {klienServer:()=>{throw new Error('GET must not create database client');},supabaseTerpasang:()=>{throw new Error('GET must not access database');}},
    }).default;
    const html = renderToStaticMarkup(await Page({searchParams:Promise.resolve(params)}));
    if(params.token) {assert.match(html,/method="post"/);assert.match(html,/action="\/berhenti\/konfirmasi"/);assert.match(html,/Ya, berhenti berlangganan/);}
    assert.doesNotMatch(html,/http-equiv="refresh"/);
    assert.doesNotMatch(html,/Kamu sudah berhenti berlangganan|Tidak akan ada email lagi/);
  });
}

function route(result = {data:true,error:null}, configured = true) {
  const calls=[];
  const handler=loadSource('src/app/berhenti/konfirmasi/route.ts',{
    '@/lib/supabase/server': {supabaseTerpasang:()=>configured,klienServer:async()=>({rpc:async(...args)=>{calls.push(args); if(result instanceof Error) throw result; return result;}})},
  });
  return {...handler,calls};
}
function request(token=TOKEN,origin='https://belummenyerah.test') {
  return new Request('https://belummenyerah.test/berhenti/konfirmasi',{method:'POST',headers:{origin,'content-type':'application/x-www-form-urlencoded'},body:new URLSearchParams({token})});
}
test('only explicit same-origin POST calls existing unsubscribe RPC and redirects without token', async()=>{
  const {POST,GET,calls}=route();
  assert.equal(GET,undefined);
  const result=await POST(request());
  assert.deepEqual(calls,[['berhenti_langganan',{p_token:TOKEN}]]);
  assert.equal(result.status,200);
  assert.equal(result.headers.get('location'),null);
  assert.match(result.headers.get('content-type'),/text\/html/);
  const body = await result.text();
  assert.match(body,/Kamu sudah berhenti berlangganan/);
  assert.doesNotMatch(body,new RegExp(TOKEN));
  assert.equal(result.headers.get('cache-control'),'no-store');
});
for (const [token,origin,status] of [[TOKEN,'https://evil.test',403],[TOKEN,'',403],['not-a-token','https://belummenyerah.test',400]]) {
  test(`invalid unsubscribe request is non-mutating (${origin}, ${token})`,async()=>{
    const {POST,calls}=route(); const result=await POST(request(token,origin));
    assert.equal(result.status,status);assert.equal(calls.length,0);
  });
}
for (const result of [{data:false,error:null},{data:null,error:{message:'private backend detail'}},new Error('private backend detail')]) {
  test(`unsubscribe failure allows retry without claiming success: ${String(result)}`,async()=>{
    const {POST}=route(result);const response=await POST(request());const url=new URL(response.headers.get('location'));
    assert.equal(url.searchParams.get('hasil'),'gagal');assert.equal(url.searchParams.get('token'),TOKEN);
    assert.doesNotMatch(response.headers.get('location'),/private/);
  });
}

test('missing database configuration leaves subscription unchanged and offers retry', async()=>{
  const {POST,calls}=route({data:true,error:null},false);
  const response=await POST(request());
  assert.equal(calls.length,0);
  assert.equal(new URL(response.headers.get('location')).searchParams.get('hasil'),'gagal');
});

test('protocol-relative URLs and non-image email URLs are removed',()=>{
  const dom=new JSDOM(keHtml('<a href="//evil.test/path">x</a><img src="//evil.test/x"><img src="mailto:person@example.test">'));
  assert.equal(dom.window.document.querySelector('a[href],img[src]'),null);
  dom.window.close();
});

// Fetch's append-a-request-Origin-header algorithm nulls a navigation POST's
// Origin for no-referrer, but preserves it for same-origin strict-origin.
test('native form referrer policy preserves same-origin POST Origin without exposing token URL', async()=>{
  const page=loadSource('src/app/berhenti/page.tsx', {'next/link':Link,'@/components/Masthead':()=>null,'@/components/Kaki':()=>null});
  assert.equal(page.metadata.referrer,'strict-origin');
  const source=new URL(`https://belummenyerah.test/berhenti?token=${TOKEN}`);
  const sentOrigin=page.metadata.referrer==='no-referrer'?'null':source.origin;
  const referrer=source.origin+'/';
  assert.doesNotMatch(referrer,/token|berhenti/);
  const {POST,calls}=route();
  const response=await POST(request(TOKEN,sentOrigin));
  assert.equal(response.status,200);
  assert.equal(calls.length,1);
  const rejected=route();
  assert.equal((await rejected.POST(request(TOKEN,'null'))).status,403);
  assert.equal(rejected.calls.length,0);
});
