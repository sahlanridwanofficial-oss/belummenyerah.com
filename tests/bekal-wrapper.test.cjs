const {test,after}=require('node:test');
const assert=require('node:assert/strict');
const React=require('react');
const {loadSource,installDOM}=require('./helpers.cjs');
const dom=installDOM();
const {createRoot}=require('react-dom/client');
const {act}=React;
after(()=>dom.close());

async function mount(t,{reduced=false,saveData=false,fail=false}={}){
  let loads=0,disposals=0,celebrations=0;
  const pauses=[]; let callbacks; let mediaListener;
  const media={matches:reduced,addEventListener:(_,cb)=>{mediaListener=cb},removeEventListener:()=>{}};
  window.matchMedia=()=>media;
  Object.defineProperty(navigator,'connection',{value:{saveData},configurable:true});
  const handle={dispose:()=>disposals++,setPaused:value=>pauses.push(value),setPointer:()=>{},setProgress:()=>{},celebrate:()=>celebrations++};
  const Scene=loadSource('src/components/BekalScene.tsx',{
    './BekalFallback':()=>React.createElement('svg',{'data-still':true}),
    '@/lib/bekal-scene':{startBekalScene:(_,cb)=>{loads++;callbacks=cb;if(fail) cb.onError(new Error('test'));else cb.onReady();return handle;}},
  }).default;
  const container=document.createElement('div');document.body.appendChild(container); const root=createRoot(container);
  await act(async()=>root.render(React.createElement(Scene)));
  t.after(async()=>{await act(async()=>root.unmount());container.remove();});
  return {container,root,get loads(){return loads},get disposals(){return disposals},get celebrations(){return celebrations},pauses,get callbacks(){return callbacks},toggleMotion:async value=>{media.matches=value;await act(async()=>mediaListener());}};
}
test('normal load reveals canvas only after first render and keeps controls accessible',async t=>{
  const v=await mount(t);assert.equal(v.loads,1);assert.equal(v.container.querySelector('.bekal').dataset.ready,'true');
  assert.equal(v.container.querySelector('.bekal-still').hidden,true);
  const pause=v.container.querySelector('[aria-label="Jeda animasi"]');assert.ok(pause);
  await act(async()=>pause.click());assert.equal(pause.getAttribute('aria-pressed'),'true');assert.equal(v.pauses.at(-1),true);
  const greet=v.container.querySelector('[aria-label^="Sapa Bekal"]');await act(async()=>greet.click());
  assert.equal(v.celebrations,1);assert.equal(v.pauses.at(-1),false);
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
