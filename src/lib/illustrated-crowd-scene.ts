import * as THREE from 'three';
import { createIllustratedCrowd, poseIllustratedCrowd } from './illustrated-crowd-model';
import { getCrowdCamera } from './crowd-camera';
export type IllustratedSceneHandle={setPaused:(value:boolean)=>void;dispose:()=>void};
export function startIllustratedScene(host:HTMLElement,callbacks:{onReady:()=>void;onError:(error:unknown)=>void}):IllustratedSceneHandle {
  let renderer:THREE.WebGLRenderer|null=null;
  let model:ReturnType<typeof createIllustratedCrowd>|null=null;
  let disposed=false,paused=false,frame=0,previous=0,time=0,ready=false;
  const cleanups:(()=>void)[]=[];
  const reduced=window.matchMedia('(prefers-reduced-motion: reduce)');
  const compact=window.innerWidth<=800;
  const scene=new THREE.Scene();
  const camera=new THREE.PerspectiveCamera(34,1,.1,60);
  let distance=12;
  function stop(){if(frame)cancelAnimationFrame(frame);frame=0;previous=0;}
  function dispose(){if(disposed)return;disposed=true;stop();cleanups.reverse().forEach(fn=>fn());model?.dispose();renderer?.dispose();renderer?.domElement.remove();}
  function fail(error:unknown){if(disposed)return;dispose();callbacks.onError(error);}
  function render(){if(disposed||!model||!renderer)return;try{
    poseIllustratedCrowd(model,time,reduced.matches);
    // The old typography remains fixed in front of this independent world.
    const view=getCrowdCamera(time,camera.aspect,reduced.matches);
    model.root.position.set(...view.rootPosition);camera.position.set(...view.position);camera.lookAt(...view.target);renderer.render(scene,camera);
    if(!ready){ready=true;callbacks.onReady();}
  }catch(error){fail(error);}}
  function tick(now:number){frame=0;if(disposed||paused||document.hidden||reduced.matches)return;
    if(previous&&now-previous<32){frame=requestAnimationFrame(tick);return;}
    const dt=previous?Math.min((now-previous)/1000,.05):0;previous=now;time+=dt;render();
    if(!disposed&&!paused&&!document.hidden&&!reduced.matches)frame=requestAnimationFrame(tick);
  }
  function resume(){if(disposed||paused||document.hidden)return;if(reduced.matches){if(!ready)render();return;}if(!frame)frame=requestAnimationFrame(tick);}
  const controller={setPaused(value:boolean){if(disposed||paused===value)return;paused=value;if(paused)stop();else resume();},dispose};
  try{
    renderer=new THREE.WebGLRenderer({alpha:true,antialias:true,powerPreference:'low-power'});renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.setClearColor(0,0);renderer.domElement.setAttribute('aria-hidden','true');host.appendChild(renderer.domElement);
    model=createIllustratedCrowd();scene.add(model.root);
    function resize(){if(disposed||!renderer)return;const w=Math.max(1,host.clientWidth),h=Math.max(1,host.clientHeight);renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,compact?1:1.5));renderer.setSize(w,h,false);camera.aspect=w/h;distance=Math.max(10.2,16/camera.aspect)/(2*Math.tan(THREE.MathUtils.degToRad(camera.fov)/2));camera.far=getCrowdCamera(time,camera.aspect,reduced.matches).far;camera.updateProjectionMatrix();render();}
    if(typeof ResizeObserver!=='undefined'){const observer=new ResizeObserver(resize);observer.observe(host);cleanups.push(()=>observer.disconnect());}else{window.addEventListener('resize',resize);cleanups.push(()=>window.removeEventListener('resize',resize));}
    function visibility(){if(document.hidden)stop();else resume();}
    function motionChanged(){stop();render();resume();}
    function lost(event:Event){event.preventDefault();fail(new Error('WebGL context unavailable'));}
    document.addEventListener('visibilitychange',visibility);reduced.addEventListener('change',motionChanged);renderer.domElement.addEventListener('webglcontextlost',lost);
    cleanups.push(()=>{document.removeEventListener('visibilitychange',visibility);reduced.removeEventListener('change',motionChanged);renderer?.domElement.removeEventListener('webglcontextlost',lost);});
    resize();resume();
  }catch(error){fail(error);}
  return controller;
}
