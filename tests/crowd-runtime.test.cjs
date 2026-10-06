const {test}=require('node:test');
const assert=require('node:assert/strict');
const THREE=require('three');
const {loadSource,installDOM}=require('./helpers.cjs');
function runtime(t,options={}){
 const dom=installDOM(); const originals=new Map();
 function replace(key,value){originals.set(key,Object.getOwnPropertyDescriptor(globalThis,key));Object.defineProperty(globalThis,key,{configurable:true,writable:true,value});}
 const listeners=new Set();const media={matches:options.reduced??false,addEventListener:(_,f)=>listeners.add(f),removeEventListener:(_,f)=>listeners.delete(f),change(v){this.matches=v;listeners.forEach(f=>f())}};window.matchMedia=()=>media;
 Object.defineProperty(window,'innerWidth',{value:options.viewport??1280});Object.defineProperty(window,'devicePixelRatio',{value:3});
 let now=1000,serial=0;const pending=new Map();replace('requestAnimationFrame',f=>{pending.set(++serial,f);return serial});replace('cancelAnimationFrame',id=>pending.delete(id));const observers=[];
 replace('ResizeObserver',class{constructor(f){this.callback=f;observers.push(this)}observe(){}disconnect(){this.disconnected=true}});
 const renders=[],renderers=[],statuses=[],actions=[];let model;
 class Renderer{constructor(){if(options.constructorError)throw Error('GPU unavailable');this.domElement=document.createElement('canvas');this.shadowMap={};this.disposals=0;renderers.push(this)}setPixelRatio(v){this.dpr=v}setSize(w,h){this.size=[w,h]}setClearColor(c,a){this.alpha=a}render(scene,camera){if(options.renderError)throw Error('Render failed');scene.updateMatrixWorld(true);camera.updateMatrixWorld(true);this.scene=scene;renders.push({rockY:model.rock.position.y,camera:camera.clone()})}dispose(){this.disposals++}}
 const modelModule=loadSource('src/lib/crowd-model.ts');const motion=loadSource('src/lib/bekal-motion.ts');
 const {startCrowdScene}=loadSource('src/lib/crowd-scene.ts',{three:{...THREE,WebGLRenderer:Renderer},'./crowd-model':{...modelModule,createCrowdModel:()=>{model=modelModule.createCrowdModel();return model}},'./bekal-motion':motion});
 const host=document.createElement('div');Object.defineProperty(host,'clientWidth',{value:options.width??440,configurable:true});Object.defineProperty(host,'clientHeight',{value:options.height??440,configurable:true});document.body.appendChild(host);
 const controller=startCrowdScene(host,{onReady:()=>{assert.ok(renders.length);statuses.push('ready')},onError:e=>statuses.push(e.message),onActionChange:v=>actions.push(v)});
 t.after(()=>{controller.dispose();for(const[k,v]of originals){if(v)Object.defineProperty(globalThis,k,v);else delete globalThis[k]}dom.close()});
 return {host,controller,media,model,observers,renderers,renders,statuses,actions,get frames(){return pending.size},tick(n=1){for(let i=0;i<n;i++){const fs=[...pending.values()];pending.clear();now+=16;fs.forEach(f=>f(now))}}};
}
test('crowd uses real geometry, transparent renderer and only announces readiness after first render',t=>{const v=runtime(t);assert.deepEqual(v.statuses,['ready']);assert.equal(v.host.querySelectorAll('canvas').length,1);assert.equal(v.renderers[0].alpha,0);assert.equal(v.renderers[0].dpr,1.5);assert.ok(v.model.actors.length>=6)});
test('help visibly raises the common boulder and coalesces repeated input until recovery',t=>{const v=runtime(t);v.tick(3);const base=v.renders.at(-1).rockY;assert.equal(v.controller.help(),true);assert.equal(v.controller.help(),false);v.tick(80);assert.ok(v.renders.at(-1).rockY>base+.10);assert.deepEqual(v.actions,[true]);v.tick(260);assert.deepEqual(v.actions,[true,false]);v.tick(30);assert.equal(v.controller.help(),true)});
test('autonomous scene includes camera travel and independently evolving poses',t=>{const v=runtime(t);const a=v.renders[0].camera.position.clone();v.tick(220);const b=v.renders.at(-1).camera.position;assert.ok(a.distanceTo(b)>.25);const timeA=v.model.actors.map(actor=>actor.body.position.y);v.tick(180);assert.notDeepEqual(v.model.actors.map(actor=>actor.body.position.y),timeA)});
test('pause and hidden tabs suspend both gesture clock and RAF without catch-up',t=>{const v=runtime(t);v.controller.help();v.tick(35);v.controller.setPaused(true);const count=v.renders.length;assert.equal(v.frames,0);v.tick(300);assert.equal(v.renders.length,count);v.controller.setPaused(false);v.tick(5);assert.equal(v.frames,1);Object.defineProperty(document,'hidden',{configurable:true,value:true});document.dispatchEvent(new window.Event('visibilitychange'));assert.equal(v.frames,0);assert.equal(v.controller.help(),false)});
test('reduced motion is a stable 3D still and cannot start an action',t=>{const v=runtime(t,{reduced:true,viewport:375,width:220,height:260});assert.equal(v.frames,0);assert.equal(v.renderers[0].dpr,1.25);assert.equal(v.controller.help(),false);const count=v.renders.length;v.tick(100);assert.equal(v.renders.length,count)});
test('context loss releases canvas, observers, renderer and disables interactions',t=>{const v=runtime(t);v.renderers[0].domElement.dispatchEvent(new window.Event('webglcontextlost',{cancelable:true}));assert.equal(v.host.children.length,0);assert.equal(v.frames,0);assert.equal(v.renderers[0].disposals,1);assert.ok(v.observers.every(o=>o.disconnected));assert.equal(v.controller.help(),false);v.controller.dispose();assert.equal(v.renderers[0].disposals,1)});
test('GPU construction failure reports the fallback state cleanly',t=>{const v=runtime(t,{constructorError:true});assert.deepEqual(v.statuses,['GPU unavailable']);assert.equal(v.host.children.length,0);assert.equal(v.controller.help(),false)});
test('render failure never reports ready',t=>{const v=runtime(t,{renderError:true});assert.deepEqual(v.statuses,['Render failed']);assert.equal(v.host.children.length,0)});
test('mobile updates the moving scene at a bounded cadence instead of rendering every RAF',t=>{const v=runtime(t,{viewport:375,width:220,height:260});v.tick(120);assert.ok(v.renders.length<80);assert.ok(v.renders.length>40)});
for(const dims of [[440,440],[220,260]])test(`lift stays framed at ${dims.join('x')} after opening reveal`,t=>{
 const v=runtime(t,{width:dims[0],height:dims[1]});v.tick(160);v.controller.help();const point=new THREE.Vector3();
 for(let step=0;step<20;step++){v.tick(12);const cam=v.renders.at(-1).camera;cam.updateMatrixWorld(true);v.model.root.traverse(o=>{if(!(o instanceof THREE.Mesh))return;const pos=o.geometry.attributes.position;for(let i=0;i<pos.count;i++){point.fromBufferAttribute(pos,i).applyMatrix4(o.matrixWorld).project(cam);assert.ok(Math.abs(point.x)<1&&Math.abs(point.y)<1,`${o.name} clipped at ${dims.join('x')}`)}})}
});

test('cooldown input is rejected without an unannounced queued lift',t=>{
 const v=runtime(t);v.controller.help();
 for(let i=0;i<400&&v.actions.length<2;i++)v.tick();
 assert.deepEqual(v.actions,[true,false]);assert.equal(v.controller.help(),false);
 v.tick(100);assert.deepEqual(v.actions,[true,false]);assert.ok(v.renders.at(-1).rockY<2.42);
 assert.equal(v.controller.help(),true);assert.deepEqual(v.actions,[true,false,true]);
});
for(const dims of [[440,440],[220,260],[190,230],[160,205],[320,180]])test(`opening reveal stays framed at ${dims.join('x')}`,t=>{
 const v=runtime(t,{width:dims[0],height:dims[1]});const point=new THREE.Vector3();
 for(let step=0;step<24;step++){
  const cam=v.renders.at(-1).camera;cam.updateMatrixWorld(true);
  v.model.root.traverse(o=>{if(!(o instanceof THREE.Mesh))return;const pos=o.geometry.attributes.position;
   for(let i=0;i<pos.count;i++){point.fromBufferAttribute(pos,i).applyMatrix4(o.matrixWorld).project(cam);assert.ok(Math.abs(point.x)<1&&Math.abs(point.y)<1,`${o.name} clipped during reveal at ${dims.join('x')}`)}
  });v.tick(6);
 }
});
