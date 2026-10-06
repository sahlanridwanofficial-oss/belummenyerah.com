import * as THREE from 'three';
import { createIllustratedRock } from './illustrated-rock';
import { createInkShadowMaterial } from './ink-shadow';
import { sampleCrowdStory, STORY_ACTOR_COUNT } from './crowd-story';

/** Original ink drawing geometry, placed in a three-dimensional world. */
export function createIllustratedCrowd() {
  const root = new THREE.Group();

  const geometries: THREE.BufferGeometry[] = [];
  const materials: THREE.Material[] = [];
  const ink = new THREE.MeshBasicMaterial({ color:'#14140f', side:THREE.DoubleSide });
  materials.push(ink);
  const source=createIllustratedRock(ink),rock=source.root;root.add(rock);
  const actors: { root:THREE.Group; parts:{geometry:THREE.BufferGeometry;rest:number[];poses:number[][];indices:number[][]}[]; eyes:THREE.Group;pupils:THREE.Mesh[];shadow:THREE.Group; effort:THREE.Group;phase:number;poseIndex:number;support:number;role:string }[] = [];
  function silhouette(raised=1) {
    const s=new THREE.Shape();
    const mix=(a:number[],b:number[])=>a.map((v,i)=>v*raised+b[i]*(1-raised));
    const c=(a:number[],b=a)=>{const p=mix(a,b);s.bezierCurveTo(p[0],p[1],p[2],p[3],p[4],p[5]);};
    const l=(a:number[],b=a)=>{const p=mix(a,b);s.lineTo(p[0],p[1]);};
    s.moveTo(-.22,1.46);c([-.40,1.60,-.32,1.90,-.08,1.97]);c([.18,2.08,.40,1.89,.33,1.64]);c([.31,1.55,.26,1.50,.19,1.46]);
    c([.34,1.44,.38,1.67,.40,1.83],[.34,1.44,.43,1.30,.47,1.10]);l([.44,2.15],[.58,.80]);c([.47,2.33,.68,2.29,.67,2.11],[.65,.62,.48,.50,.43,.68]);c([.64,1.74,.66,1.31,.52,.97],[.40,.86,.37,1.03,.34,1.14]);
    c([.43,.75,.39,.65,.39,.43]);l([.38,.21]);c([.37,.03,.20,-.02,.09,.08]);c([.04,.13,.06,.37,.05,.52]);l([-.03,.49]);l([-.05,.17]);c([-.07,-.02,-.33,-.02,-.38,.15]);c([-.43,.32,-.37,.64,-.43,.90]);
    c([-.57,1.18,-.61,1.53,-.64,1.84],[-.34,1.08,-.38,.86,-.43,.68]);l([-.67,2.10],[-.49,.60]);c([-.70,2.28,-.48,2.32,-.43,2.14],[-.65,.55,-.67,.73,-.58,.88]);l([-.39,1.82],[-.47,1.10]);c([-.35,1.59,-.35,1.46,-.22,1.46],[-.40,1.33,-.35,1.46,-.22,1.46]);return s;
  }
  function outline(shape:THREE.Shape) {
    const p=shape.getPoints(12);p.pop();const v:number[]=[],ix:number[]=[];
    for(let i=0;i<p.length;i++) {const a=p[(i+p.length-1)%p.length],b=p[(i+1)%p.length];const dx=b.x-a.x,dy=b.y-a.y;const len=Math.hypot(dx,dy)||1;const nx=dy/len*.024,ny=-dx/len*.024;v.push(p[i].x+nx,p[i].y+ny,.012,p[i].x-nx,p[i].y-ny,.012);const j=(i+1)%p.length;ix.push(i*2,j*2,i*2+1,j*2,j*2+1,i*2+1);}
    const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(v,3));g.setIndex(ix);return g;
  }
  const templates=Array.from({length:17},(_,i)=>{const shape=silhouette(i/16);return [new THREE.ShapeGeometry(shape,12),outline(shape)];});
  templates.flat().forEach(g=>geometries.push(g));
  const templateData=[0,1].map(p=>({poses:templates.map(row=>Array.from(row[p].attributes.position.array)),indices:templates.map(row=>Array.from(row[p].index!.array))}));
  const fillCache=new Map<string,THREE.MeshBasicMaterial>();
  const pupilGeometry=new THREE.CircleGeometry(.031,12),browGeometry=new THREE.PlaneGeometry(.085,.014),capGeometry=new THREE.PlaneGeometry(.46,.035);geometries.push(pupilGeometry,browGeometry,capGeometry);
  const personShadowGeometry=new THREE.PlaneGeometry(.95,.70),personShadowMaterial=createInkShadowMaterial(.31);geometries.push(personShadowGeometry);materials.push(personShadowMaterial);
  let hairGeometry:THREE.ShapeGeometry|undefined;
  for(let i=0;i<STORY_ACTOR_COUNT;i++) {
    const group=new THREE.Group();group.name=`illustrated-person-${i+1}`;group.scale.set([.62,.66,.70,.60,.65,.57,.67,.62,.58,.65,.66,.60][i%12],[.60,.71,.65,.63,.68,.59,.72,.64,.56,.62,.67,.58][i%12],.68);root.add(group);
    const color=[3,6,11,16].includes(i)?(i%2?'#f0d47e':'#eedfa8'):['#f8f7f2','#e6e4db','#f1f0ea'][i%3];let fill=fillCache.get(color);if(!fill){fill=new THREE.MeshBasicMaterial({color,side:THREE.DoubleSide});fillCache.set(color,fill);materials.push(fill);}
    const parts=[];
    for(let p=0;p<2;p++){const geometry=templates[16][p].clone();const cache=templateData[p];geometry.setAttribute('position',new THREE.Float32BufferAttribute(new Float32Array(Math.max(...cache.poses.map(p=>p.length))),3));geometry.setIndex(new THREE.Uint16BufferAttribute(new Uint16Array(Math.max(...cache.indices.map(p=>p.length))),1));const material=p?ink:fill;const mesh=new THREE.Mesh(geometry,material);mesh.name=p?'drawn-ink-contour':'flat-illustrated-silhouette';group.add(mesh);geometries.push(geometry);parts.push({geometry,rest:cache.poses[16],poses:cache.poses,indices:cache.indices});}
    const eyes=new THREE.Group();eyes.position.set(0,1.77,.03);group.add(eyes);
    const pupils:THREE.Mesh[]=[];
    for(const side of [-1,1]){const eye=new THREE.Mesh(pupilGeometry,ink);eye.scale.set(.75,1,1);eye.position.x=side*.075;eye.rotation.z=-.25;eyes.add(eye);pupils.push(eye);}
    if([1,5,9,2,7,10].includes(i%12)){
      const hair=new THREE.Shape();hair.moveTo(-.25,.13);hair.bezierCurveTo(-.29,.29,-.02,.37,.22,.20);hair.quadraticCurveTo(.12,.25,.025,.16);hair.lineTo(-.07,.205);hair.quadraticCurveTo(-.15,.17,-.25,.13);const g=hairGeometry??new THREE.ShapeGeometry(hair,10);if(!hairGeometry){hairGeometry=g;geometries.push(g);}const patch=new THREE.Mesh(g,ink);patch.name='charcoal-hair';patch.position.z=.019;eyes.add(patch);
      if([1,5,9].includes(i%12)){const g=capGeometry,brim=new THREE.Mesh(g,ink);brim.name='charcoal-cap';brim.position.set(.035,.135,.024);brim.rotation.z=-.08;eyes.add(brim);}
    }
    const effort=new THREE.Group();eyes.add(effort);
    for(const side of [-1,1]){const g=browGeometry;const brow=new THREE.Mesh(g,ink);brow.position.set(side*.075,.075,.015);brow.rotation.z=side*.35;effort.add(brow);}
    const shadow=new THREE.Group();root.add(shadow);
    const disk=new THREE.Mesh(personShadowGeometry,personShadowMaterial);disk.name='soft-person-shadow';disk.rotation.x=-Math.PI/2;shadow.add(disk);
    actors.push({root:group,parts,eyes,pupils,shadow,effort,phase:i*.73,poseIndex:-1,support:0,role:'ambient'});
  }
  const rockShadow=new THREE.Group();rockShadow.name='boulder-ground-shadow';root.add(rockShadow);
  const rockShadowMaterial=createInkShadowMaterial(.24),rockShadowGeometry=new THREE.PlaneGeometry(8,5);materials.push(rockShadowMaterial);geometries.push(rockShadowGeometry);const groundShadow=new THREE.Mesh(rockShadowGeometry,rockShadowMaterial);groundShadow.name='soft-boulder-shadow';groundShadow.rotation.x=-Math.PI/2;rockShadow.add(groundShadow);
  let disposed=false;
  const model={root,rock,rockShadow,rockShadowMaterial,actors,dispose(){if(disposed)return;disposed=true;source.dispose();geometries.forEach(g=>g.dispose());materials.forEach(m=>m.dispose());}};
  poseIllustratedCrowd(model,0,true);
  return model;
}
export type IllustratedCrowd=ReturnType<typeof createIllustratedCrowd>;
/** A dispersed world: struggle, approach, join, lift, recover, and walk back. */
export function poseIllustratedCrowd(model:IllustratedCrowd,time:number,still=false) {
  const story=sampleCrowdStory(time,still),t=story.time;
  const ease=(x:number)=>{const u=Math.max(0,Math.min(1,x));return u*u*(3-2*u);};
  model.rockShadow.position.set(.22+story.rockY*.16,.001,.3+story.rockY*.16);model.rockShadow.scale.setScalar(1+story.lift*.10);
  model.rockShadowMaterial.uniforms.strength.value=.24*(1-story.lift*.14);
  model.rock.position.set(0,story.rockY,0);model.rock.rotation.set(0,0,story.roll);
  for(const [index,a] of model.actors.entries()){
    const actor=story.actors[index],support=actor.support,poseIndex=Math.round(support*16),walk=still?0:actor.walking*(1-support);
    const step=actor.distance*18+a.phase;const bob=Math.abs(Math.sin(step))*.018*walk;
    a.root.position.set(actor.x,bob*.3-.014,actor.z);a.shadow.position.set(actor.x,.003,actor.z);a.shadow.scale.set(a.root.scale.y/.65,1,a.root.scale.y/.65);a.root.rotation.y=support*(-Math.sign(actor.x)*(.10+index%3*.09))+walk*actor.directionX*.20;
    a.support=support;a.role=actor.role;
    const brace=still?0:(.5+.5*Math.sin(t*Math.PI*2/1.5+a.phase))*.105*story.strain*support;
    const lean=still?0:Math.sin(t*Math.PI*2/3+a.phase)*.085*story.strain*support;
    for(const [partIndex,part] of a.parts.entries()){
      if(a.poseIndex!==poseIndex){const indices=part.indices[poseIndex];for(let k=0;k<indices.length;k++)part.geometry.index!.setX(k,indices[k]);part.geometry.index!.needsUpdate=true;part.geometry.setDrawRange(0,indices.length);}
      const rest=part.poses[poseIndex],attr=part.geometry.attributes.position;
      for(let i=0;i<rest.length;i+=3){const x=rest[i],y=rest[i+1],z=rest[i+2];const hand=ease((Math.abs(x)-.30)/.13)*ease((y-1.05)/.4)*support;const reach=ease((y-1.1)/1.04)*hand;
        const worldX=actor.x+x*a.root.scale.x*Math.cos(a.root.rotation.y)+z*a.root.scale.z*Math.sin(a.root.rotation.y);const contactY=story.rockY+Math.tan(story.roll)*worldX;
        const rise=(contactY-a.root.position.y-2.275*a.root.scale.y)/a.root.scale.y;
        const torso=ease(y/.75)*(1-hand);const foot=ease((.72-y)/.50);const legPhase=step+(x<0?0:Math.PI);const stride=Math.sin(legPhase)*.22*foot*walk;
        const px=x+lean*torso+stride*actor.directionX;
        const py=y+rise*(reach+torso*.22*support)-brace*torso+Math.max(0,Math.cos(legPhase))*.13*foot*walk;
        const pz=z+stride*actor.directionZ;
        attr.setXYZ(i/3,px,py,pz);
      }attr.needsUpdate=true;part.geometry.computeBoundingSphere();
    }
    a.poseIndex=poseIndex;a.eyes.position.set(lean,1.77+(story.rockY-a.root.position.y-2.275*a.root.scale.y)/a.root.scale.y*.22*support-brace,.03);
    for(const pupil of a.pupils)pupil.scale.y=!still&&((t+a.phase)%4.8)<.10?.18:1;a.effort.visible=support>.8&&story.strain>.4;
  }
}
