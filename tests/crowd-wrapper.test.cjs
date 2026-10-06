const {test,after}=require('node:test');
const assert=require('node:assert/strict');
const React=require('react');
const {loadSource,installDOM}=require('./helpers.cjs');
const dom=installDOM();
const {createRoot}=require('react-dom/client');
const {act}=React;
after(()=>dom.close());

async function mount(t,{reduced=false,saveData=false,fail=false,intersection=false}={}){
  let loads=0,disposals=0,helps=0; let intersectionCallback;
  const previousObserver=globalThis.IntersectionObserver;
  if(intersection) globalThis.IntersectionObserver=class { constructor(cb){intersectionCallback=cb} observe(){intersectionCallback([{isIntersecting:true}])} disconnect(){} };
  t.after(()=>{if(previousObserver)globalThis.IntersectionObserver=previousObserver;else delete globalThis.IntersectionObserver});
  const pauses=[]; let callbacks; let mediaListener;
  const media={matches:reduced,addEventListener:(_,cb)=>{mediaListener=cb},removeEventListener:()=>{}};
  window.matchMedia=()=>media;
  Object.defineProperty(navigator,'connection',{value:{saveData},configurable:true});
  const handle={dispose:()=>disposals++,setPaused:value=>pauses.push(value),setPointer:()=>{},setProgress:()=>{},help:()=>{helps++;callbacks.onActionChange?.(true);return true}};
  const Scene=loadSource('src/components/CrowdScene.tsx',{
    'next/image':({priority,unoptimized,...props})=>React.createElement('img',props),
    './ArrowIcon':()=>React.createElement('svg'),
    '@/lib/crowd-scene':{startCrowdScene:(_,cb)=>{loads++;callbacks=cb;if(fail) cb.onError(new Error('test'));else cb.onReady();return handle;}},
  }).default;
  const container=document.createElement('div');document.body.appendChild(container); const root=createRoot(container);
  await act(async()=>root.render(React.createElement(Scene)));
  t.after(async()=>{await act(async()=>root.unmount());container.remove();});
  return {container,root,intersect:async visible=>{await act(async()=>intersectionCallback([{isIntersecting:visible}]))},get loads(){return loads},get disposals(){return disposals},get helps(){return helps},pauses,get callbacks(){return callbacks},toggleMotion:async value=>{media.matches=value;await act(async()=>mediaListener());}};
}
test('crowd load reveals canvas after first render and a paused help resumes correctly',async t=>{
  const v=await mount(t);assert.equal(v.loads,1);assert.equal(v.container.querySelector('.bekal').dataset.ready,'true');
  assert.equal(v.container.querySelector('.bekal-still').hidden,true);
  const pause=v.container.querySelector('[aria-label="Jeda animasi"]');assert.ok(pause);
  await act(async()=>pause.click());assert.equal(pause.getAttribute('aria-pressed'),'true');assert.equal(v.pauses.at(-1),true);
  const greet=v.container.querySelector('[aria-label="Bantu kelompok mengangkat batu"]');await act(async()=>greet.click());
  assert.equal(v.helps,1);assert.equal(v.pauses.at(-1),false);
});
for(const mode of ['reduced','saveData']) test(`${mode}: no Three import until explicit opt-in`,async t=>{
  const v=await mount(t,{[mode]:true});assert.equal(v.loads,0);assert.equal(v.container.querySelector('.bekal-still').hidden,false);
  assert.match(v.container.querySelector('[role="status"]').textContent,/menghemat data|mengurangi gerak/);
  await act(async()=>v.container.querySelector('button').click());assert.equal(v.loads,1);
});
test('GPU failure retains honest still fallback and retry disposes the old instance',async t=>{
  const v=await mount(t,{fail:true});assert.equal(v.container.querySelector('.bekal').dataset.ready,'false');
  assert.match(v.container.textContent,/3D tidak tersedia/);assert.equal(v.container.querySelector('.bekal-still').hidden,false);
  await act(async()=>v.container.querySelector('button').click());assert.equal(v.loads,2);assert.equal(v.disposals,1);
});
test('context loss restores illustration and unmount disposes the current instance',async t=>{
  const v=await mount(t);await act(async()=>v.callbacks.onError(new Error('context lost')));
  assert.equal(v.container.querySelector('.bekal-still').hidden,false);
  await act(async()=>v.root.unmount());assert.equal(v.disposals,1);
});

test('enabling reduced motion after mount disposes WebGL and reveals the still',async t=>{
  const v=await mount(t);assert.equal(v.loads,1);
  await v.toggleMotion(true);assert.equal(v.disposals,1);
  assert.equal(v.container.querySelector('.bekal').dataset.ready,'false');
  assert.equal(v.container.querySelector('.bekal-still').hidden,false);
});

test('reduced-motion opt-in exposes a still crowd without inert gesture buttons',async t=>{
  const v=await mount(t,{reduced:true});await act(async()=>v.container.querySelector('button').click());
  assert.match(v.container.querySelector('.bekal-controls').textContent,/gerak dikurangi/);
  assert.equal(v.container.querySelector('[aria-label="Bantu kelompok mengangkat batu"]'),null);
});

test('crowd interaction announces help, keeps focus and recovers button state',async t=>{
 const v=await mount(t);const button=v.container.querySelector('[aria-label="Bantu kelompok mengangkat batu"]');button.focus();
 await act(async()=>button.click());assert.equal(v.helps,1);assert.equal(document.activeElement,button);assert.equal(button.getAttribute('aria-disabled'),'true');assert.match(v.container.querySelector('[role="status"]').textContent,/Kamu ikut membantu/);
 await act(async()=>button.click());assert.equal(v.helps,1);await act(async()=>v.callbacks.onActionChange(false));assert.equal(button.getAttribute('aria-disabled'),'false');
});

test('manual resume preserves offscreen suspension until intersection returns',async t=>{
 const v=await mount(t,{intersection:true});const pause=v.container.querySelector('[aria-label="Jeda animasi"]');
 await act(async()=>pause.click());await v.intersect(false);await act(async()=>pause.click());
 assert.equal(v.pauses.at(-1),true);await v.intersect(true);assert.equal(v.pauses.at(-1),false);
});
