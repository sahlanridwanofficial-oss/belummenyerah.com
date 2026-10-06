export const STORY_DURATION=24;
export type StoryActor={role:'core'|'helper'|'ambient';x:number;z:number;support:number;walking:number;distance:number;directionX:number;directionZ:number};
export const HELPER_PATHS=[
 {from:[-6,-2.5],to:[-2,.20],start:1,duration:4.1,bend:.5},
 {from:[5.6,1.7],to:[2,.20],start:1.5,duration:4.3,bend:-.5},
 {from:[3.8,-5.2],to:[.65,.55],start:2.2,duration:5,bend:.75},
 {from:[-5.4,2.8],to:[-.35,1.05],start:2.8,duration:5.3,bend:-.65},
 {from:[-4.6,-5.8],to:[-1.45,.65],start:3.4,duration:5.5,bend:-1.2},
 {from:[-6.8,-3.0],to:[-1.90,-.42],start:2.5,duration:5.2,bend:.7},
 {from:[-4.5,-8],to:[-1.2,-.55],start:3.2,duration:5.4,bend:-.45},
 {from:[-1,-8.2],to:[-.45,-.63],start:3.8,duration:5.8,bend:.6},
 {from:[2.4,-7.8],to:[.35,-.60],start:4.4,duration:5.5,bend:-.7},
 {from:[5,-6.7],to:[1.18,-.52],start:4,duration:6,bend:.9},
 {from:[6.8,-2.8],to:[1.9,-.32],start:4.8,duration:5.4,bend:-.6},
 {from:[-6.2,3.9],to:[-.62,.38],start:5.2,duration:5.2,bend:-1},
 {from:[2.2,4.1],to:[.15,.62],start:5.6,duration:5,bend:1.1},
 {from:[6,3.2],to:[1.53,.52],start:6,duration:4.8,bend:-.5},
 {from:[-7,.5],to:[-1.60,.15],start:6.3,duration:4.4,bend:.65},
] as const;
export const STORY_ACTOR_COUNT=36;
const smooth=(x:number)=>{const u=Math.max(0,Math.min(1,x));return u<1e-9?0:u>1-1e-9?1:u*u*(3-2*u);};
export function sampleCrowdStory(time:number,still=false){
 const t=still?12.5:((Number.isFinite(time)?time:0)%STORY_DURATION+STORY_DURATION)%STORY_DURATION;
 const actors:StoryActor[]=[[-.95,.93],[.12,1.18],[1.1,.85]].map(([x,z])=>({role:'core',x,z,support:1,walking:0,distance:0,directionX:0,directionZ:0}));
 HELPER_PATHS.forEach((path,i)=>{
  const arrival=path.start+path.duration,depart=17+(i%5)*.3;
  const approach=smooth((t-path.start)/path.duration),leave=smooth((t-depart)/5.1),progress=approach*(1-leave);
  const dx=path.to[0]-path.from[0],dz=path.to[1]-path.from[1],len=Math.hypot(dx,dz),sign=t>=depart?-1:1;
  const envelope=(p:number)=>smooth(p/.1)*smooth((1-p)/.1);
  const walking=Math.max(envelope(approach),envelope(leave));
  actors.push({role:'helper',x:path.from[0]+dx*progress+Math.sin(progress*Math.PI)*path.bend,z:path.from[1]+dz*progress,support:smooth((t-arrival+.9)/.9)*(1-smooth((t-depart)/.65)),walking,distance:progress*len,directionX:dx/len*sign,directionZ:dz/len*sign});
 });
 const ambient=[[-6.4,-4.4,.7,.45],[6,-3.8,.6,.55],[-6.1,1.25,.6,.5],[6,2.2,.7,.4],[-4.8,-7,.5,.4],[5.2,-7.2,.6,.5],[-2.6,-8.2,.4,.5],[2.5,-8.4,.5,.4],[-7.2,-.9,.4,.5],[7.1,.1,.5,.4],[-4.1,3.8,.6,.5],[4.6,4,.5,.5],[-3.5,-4.5,.4,.4],[3.7,-4.8,.4,.5],[-6.2,-6.7,.4,.4],[6.5,-6.5,.5,.4],[-.5,-8.8,.4,.4],[.8,4.8,.4,.3]];
 ambient.forEach(([cx,cz,rx,rz],i)=>{const angle=t/STORY_DURATION*Math.PI*2+i*1.1;const dx=-Math.sin(angle)*rx,dz=Math.cos(angle)*rz,l=Math.hypot(dx,dz);actors.push({role:'ambient',x:cx+(i%3?Math.cos(angle)*rx:0),z:cz+(i%3?Math.sin(angle)*rz:0),support:0,walking:i%3?1:0,distance:t/24*(Math.PI*2*16/18)+i*.8,directionX:dx/l,directionZ:dz/l});});
 const helpers=actors.filter(a=>a.role==='helper').reduce((n,a)=>n+a.support,0);
 const lift=smooth((t-11)/2)*(1-smooth((t-15.4)/1.5));
 const strain=1-helpers/HELPER_PATHS.length*.82;
 const roll=still?0:Math.sin(t*Math.PI*2/3)*.043*strain;
 const sag=.10*smooth(t/2)*(1-smooth((t-6)/4))*(1-lift);
 return{time:t,actors,helpers,lift,strain,roll,focus:smooth((t-3)/10)*(1-smooth((t-17)/6)),rockY:1.55-sag+lift*.48};
}
