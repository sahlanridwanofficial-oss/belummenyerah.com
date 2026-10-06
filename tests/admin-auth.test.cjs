const {test} = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const {loadSource,project} = require('./helpers.cjs');
const {checkAdminAccess} = loadSource('src/lib/admin-access.ts');

function client({user={id:'fake-owner',user_metadata:{role:'admin'}},authError=null,data=true,rpcError=null,throws=false}={}) {
  const calls=[];
  return {calls,auth:{getUser:async()=>{calls.push('getUser');if(throws)throw new Error('private');return {data:{user},error:authError};}},rpc:async(name)=>{calls.push(name);return {data,error:rpcError};},from:()=>{throw new Error('Unexpected data access');}};
}
for(const [data,expected] of [[true,true],[false,false],[null,false],['true',false],[1,false],[[true],false],[{is_admin:true},false]]) {
 test(`admin predicate requires strict boolean true: ${JSON.stringify(data)}`,async()=>{
  const c=client({data});const result=await checkAdminAccess(c);assert.equal(result.ok,expected);assert.deepEqual(c.calls,['getUser','is_admin']);
 });
}
for(const options of [{user:null},{authError:new Error('bad session')},{rpcError:new Error('RPC missing')},{throws:true}]) {
 test(`authorization fails closed: ${Object.keys(options)[0]}`,async()=>{
  const c=client(options);assert.equal((await checkAdminAccess(c)).ok,false);
  if(options.user===null||options.authError)assert.deepEqual(c.calls,['getUser']);
 });
}
test('editable metadata cannot grant admin access',async()=>{
 assert.deepEqual(await checkAdminAccess(client({data:false})),{ok:false,reason:'forbidden'});
});

function authModule(c,configured=true) {
 return loadSource('src/lib/admin-auth.ts',{
  'next/navigation':{redirect:destination=>{const e=new Error('redirect');e.destination=destination;throw e;}},
  '@/lib/admin-access':{checkAdminAccess},
  '@/lib/supabase/server':{supabaseTerpasang:()=>configured,klienServer:async()=>c},
 });
}
test('server helper returns structured access and page guard redirects denied users',async()=>{
 const owner=client();assert.equal((await authModule(owner).getAdminContext()).supabase,owner);
 assert.deepEqual(await authModule(client(),false).getAdminContext(),{ok:false,reason:'unconfigured'});
 await assert.rejects(authModule(client({data:false})).requireAdminPage(),e=>e.destination==='/admin/login?akses=ditolak');
 await assert.rejects(authModule(client({user:null})).requireAdminPage(),e=>e.destination==='/admin/login?akses=masuk');
});

for(const file of ['src/app/admin/aksi.ts','src/app/admin/aksi-kursus.ts']) {
 test(`${file}: every exported mutation denies non-owner before parsing input or touching data`,async()=>{
  const access=authModule(client({data:false}));
  const actions=loadSource(file,{'@/lib/admin-auth':access,'next/cache':{revalidatePath:()=>{throw new Error('Unauthorized revalidation');}},'@/lib/format':loadSource('src/lib/format.ts')});
  for(const [name,action] of Object.entries(actions)) {
   assert.equal((await action(undefined)).ok,false,name);
  }
 });
}
for(const [options,status] of [[{user:null},401],[{data:false},403],[{rpcError:new Error('private')},503]]) {
 test(`newsletter send API denies ${status} before reading request body, records or email`,async()=>{
  const route=loadSource('src/app/api/kirim/route.ts',{
   '@/lib/admin-auth':authModule(client(options)),
   '@/lib/email':{resendTerpasang:()=>{throw new Error('No email access');}},
  });
  const response=await route.POST({json:()=>{throw new Error('No parsing before authorization');}});
  assert.equal(response.status,status);
  assert.doesNotMatch(JSON.stringify(await response.json()),/private/);
 });
}

for(const file of ['src/app/admin/page.tsx','src/app/admin/tulis/page.tsx','src/app/admin/tulis/[id]/page.tsx','src/app/admin/kursus/page.tsx','src/app/admin/kursus/baru/page.tsx','src/app/admin/kursus/[id]/page.tsx','src/app/admin/kursus/[id]/pelajaran/[pid]/page.tsx','src/app/admin/pelanggan/page.tsx']) {
 test(`${file}: requires owner authorization`,()=>{
  const source=fs.readFileSync(path.join(project,file),'utf8');
  assert.match(source,/await requireAdminPage\(\)/);
  assert.doesNotMatch(source,/await klienServer\(\)/);
 });
}

async function middlewareFor(url,options={}) {
 const c=client(options);
 const {middleware}=loadSource('src/middleware.ts',{'@supabase/ssr':{createServerClient:()=>c},'@/lib/admin-access':{checkAdminAccess}});
 const {NextRequest}=require('next/server');
 return {response:await middleware(new NextRequest(url)),calls:c.calls};
}
test('middleware denies non-admin, avoids login loop, permits owner, and leaves public pages readable',async t=>{
 const oldUrl=process.env.NEXT_PUBLIC_SUPABASE_URL;const oldKey=process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
 process.env.NEXT_PUBLIC_SUPABASE_URL='https://example.test';process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY='mock';
 t.after(()=>{if(oldUrl===undefined)delete process.env.NEXT_PUBLIC_SUPABASE_URL;else process.env.NEXT_PUBLIC_SUPABASE_URL=oldUrl;if(oldKey===undefined)delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;else process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY=oldKey;});
 const denied=await middlewareFor('https://site.test/admin/kursus',{data:false});
 assert.equal(denied.response.status,307);assert.match(denied.response.headers.get('location'),/akses=ditolak/);
 assert.equal((await middlewareFor('https://site.test/admin/login',{data:false})).response.status,200);
 assert.equal((await middlewareFor('https://site.test/admin/kursus')).response.status,200);
 assert.equal((await middlewareFor('https://site.test/admin/login')).response.headers.get('location'),'https://site.test/admin');
 const publicRead=await middlewareFor('https://site.test/belajar',{data:false});
 assert.equal(publicRead.response.status,200);assert.deepEqual(publicRead.calls,['getUser']);
});
