import { sampleCrowdStory } from './crowd-story';

/** Original PCM Foley: paired shoe impacts and granular stone scrape, synthesized locally. */
export const CROWD_MASTER_GAIN=.5;
export function makeCrowdNoise(length:number){
  const data=new Float32Array(length);let seed=713,brown=0;
  for(let i=0;i<length;i++){seed=(Math.imul(seed,1664525)+1013904223)>>>0;const white=seed/2147483648-1;brown=(brown+.035*white)/1.035;data[i]=brown*2.5+white*.12;}
  return data;
}
function random(seed:number){return()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/2147483648-1;};}
function normalize(data:Float32Array<ArrayBuffer>,peak:number){let max=0;for(const v of data)max=Math.max(max,Math.abs(v));if(max)for(let i=0;i<data.length;i++)data[i]*=peak/max;return data;}
export function makeCrowdFootstep(sampleRate:number,variant=0){
  const data=new Float32Array(Math.round(sampleRate*.24)),rand=random(713+variant*97);let low=0,body=0;
  const a=1-Math.exp(-2*Math.PI*1700/sampleRate),b=1-Math.exp(-2*Math.PI*340/sampleRate);
  for(let i=0;i<data.length;i++){
    const t=i/sampleRate,w=rand();low+=a*(w-low);body+=b*(w-body);
    // Heel followed by a softer forefoot: two broad, short impacts rather than a noise puff.
    let impact=0;
    for(const [offset,weight]of [[0,1],[.073+(variant%3)*.004,.56]]){
      const u=t-offset;if(u<0)continue;
      const attack=Math.min(1,u/.0018),tail=Math.exp(-u/.029);
      const thud=Math.sin(2*Math.PI*(94+variant*6)*u)*Math.exp(-u/.023);
      impact+=weight*attack*(body*3.1*tail+low*.5*Math.exp(-u/.009)+thud*.23);
    }
    const grit=t>.035&&t<.18?low*.12*Math.pow(Math.max(0,Math.sin(t*431+variant)*Math.sin(t*167)),5)*Math.sin((t-.035)/.145*Math.PI):0;
    data[i]=impact+grit;
  }
  return normalize(data,.8);
}
export function makeCrowdScrape(sampleRate:number){
  const data=new Float32Array(Math.round(sampleRate*2.4)),rand=random(9171);let low=0,mid=0;
  const a=1-Math.exp(-2*Math.PI*150/sampleRate),b=1-Math.exp(-2*Math.PI*1350/sampleRate);
  for(let i=0;i<data.length;i++){
    const t=i/sampleRate,w=rand();low+=a*(w-low);mid+=b*(w-mid);
    // Uneven small contacts over a low rough body, no steady high-frequency hiss.
    const grain=Math.pow(Math.max(0,Math.sin(t*79+Math.sin(t*19)*2)),6);
    const rough=.2+.8*Math.pow(Math.sin(t*13.089969),2);
    const seam=Math.min(1,t/.025,(2.4-t)/.025);
    data[i]=(low*2.1*rough+(mid-low)*.75*grain)*Math.max(0,seam);
  }
  return normalize(data,.75);
}
export function crowdScrapeLevel(speed:number){return Math.min(.34,Math.max(0,speed-.018)*1.5);}
export function crowdStepLevel(x:number,z:number){return .36/(1+Math.hypot(x,z)*.075);}
export type CrowdAudioHandle={unlock:()=>void;setMuted:(value:boolean)=>void;setActive:(value:boolean)=>void;frame:(time:number)=>void;dispose:()=>void};
export function createCrowdAudio(onPlaying:(value:boolean)=>void):CrowdAudioHandle{
  let ctx:AudioContext|null=null,master:GainNode|null=null,friction:GainNode|null=null,noise:AudioBuffer|null=null;const steps:AudioBuffer[]=[];
  let disposed=false,muted=false,active=false,lastTime:number|null=null,lastRock=0,lastRoll=0,lastStep=-1,playing=false;
  let phases:number[]=[];const sources=new Set<AudioBufferSourceNode>();const nodes=new Set<AudioNode>();
  const Context=window.AudioContext||(window as typeof window&{webkitAudioContext?:typeof AudioContext}).webkitAudioContext;
  try{muted=localStorage.getItem('belum-menyerah:scene-muted')==='1';}catch{/* Storage is optional. */}
  const report=()=>{const next=Boolean(ctx?.state==='running'&&active&&!muted&&!disposed);if(playing!==next){playing=next;onPlaying(next);}};
  function reconcile(){
    if(!ctx||!master||disposed)return;
    const audible=active&&!muted;
    master.gain.cancelScheduledValues(ctx.currentTime);master.gain.setTargetAtTime(audible?CROWD_MASTER_GAIN:0,ctx.currentTime,.06);
    // Silence immediately when hidden; suspend releases audio processing too.
    if(!audible){master.gain.setValueAtTime(0,ctx.currentTime);void ctx.suspend().catch(()=>{});}
    report();
  }
  function unlock(){
    if(disposed||muted||!active||!Context)return;
    try{
      if(!ctx){
        ctx=new Context();master=ctx.createGain();master.gain.value=0;master.connect(ctx.destination);nodes.add(master);
        const scrape=makeCrowdScrape(ctx.sampleRate);noise=ctx.createBuffer(1,scrape.length,ctx.sampleRate);noise.copyToChannel(scrape,0);
        for(let i=0;i<4;i++){const data=makeCrowdFootstep(ctx.sampleRate,i),buffer=ctx.createBuffer(1,data.length,ctx.sampleRate);buffer.copyToChannel(data,0);steps.push(buffer);}
        const source=ctx.createBufferSource();friction=ctx.createGain();friction.gain.value=0;
        source.buffer=noise;source.loop=true;source.connect(friction);friction.connect(master);
        sources.add(source);nodes.add(friction);source.start();ctx.onstatechange=report;
      }
      const current=ctx;void current.resume().then(()=>{if(!disposed&&ctx===current)reconcile();}).catch(()=>report());
    }catch{report();}
  }
  function setMuted(value:boolean){muted=value;try{localStorage.setItem('belum-menyerah:scene-muted',value?'1':'0');}catch{}reconcile();}
  function setActive(value:boolean){active=value;lastTime=null;phases=[];reconcile();if(active&&ctx&&!muted){void ctx.resume().then(()=>{if(!disposed)reconcile();}).catch(()=>report());}}
  function frame(time:number){
    if(!ctx||!master||!friction||!noise||!playing)return;
    const story=sampleCrowdStory(time),now=ctx.currentTime;
    const dt=lastTime===null?0:time-lastTime;const continuous=dt>0&&dt<.2;
    const speed=continuous?(Math.abs(story.rockY-lastRock)+Math.abs(story.roll-lastRoll)*1.8)/dt:0;
    friction.gain.setTargetAtTime(crowdScrapeLevel(speed),now,.07);
    const next=story.actors.map((a,i)=>Math.floor((a.distance*18+i*.73)/Math.PI));
    if(continuous&&now-lastStep>.13){
      // A few nearby walkers are enough to suggest the group; avoid 36 overlapping footsteps.
      const index=story.actors.findIndex((a,i)=>i%3===1&&a.walking>.35&&phases[i]!==undefined&&phases[i]!==next[i]);
      if(index>=0){const a=story.actors[index],source=ctx.createBufferSource(),gain=ctx.createGain();
        source.buffer=steps[index%steps.length];gain.gain.value=crowdStepLevel(a.x,a.z);
        source.connect(gain);gain.connect(master);sources.add(source);nodes.add(gain);
        source.onended=()=>{source.disconnect();gain.disconnect();sources.delete(source);nodes.delete(gain);};
        source.start(now);lastStep=now;
      }
    }
    phases=next;lastTime=time;lastRock=story.rockY;lastRoll=story.roll;
  }
  function dispose(){if(disposed)return;disposed=true;playing=false;onPlaying(false);if(ctx)ctx.onstatechange=null;for(const source of sources){source.onended=null;try{source.stop();}catch{}source.disconnect();}sources.clear();nodes.forEach(n=>n.disconnect());nodes.clear();if(ctx)void ctx.close().catch(()=>{});ctx=null;}
  return{unlock,setMuted,setActive,frame,dispose};
}
