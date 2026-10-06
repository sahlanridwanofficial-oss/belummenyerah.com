import { sampleCrowdStory } from './crowd-story';

/** Original, filtered noise Foley. No recordings, oscillator tones or network requests. */
export function makeCrowdNoise(length:number){
  const data=new Float32Array(length);let seed=713,brown=0;
  for(let i=0;i<length;i++){seed=(Math.imul(seed,1664525)+1013904223)>>>0;const white=seed/2147483648-1;brown=(brown+.035*white)/1.035;data[i]=brown*2.5+white*.12;}
  return data;
}
export type CrowdAudioHandle={unlock:()=>void;setMuted:(value:boolean)=>void;setActive:(value:boolean)=>void;frame:(time:number)=>void;dispose:()=>void};
export function createCrowdAudio(onPlaying:(value:boolean)=>void):CrowdAudioHandle{
  let ctx:AudioContext|null=null,master:GainNode|null=null,friction:GainNode|null=null,noise:AudioBuffer|null=null;
  let disposed=false,muted=false,active=false,lastTime:number|null=null,lastRock=0,lastStep=-1,playing=false;
  let phases:number[]=[];const sources=new Set<AudioBufferSourceNode>();const nodes=new Set<AudioNode>();
  const Context=window.AudioContext||(window as typeof window&{webkitAudioContext?:typeof AudioContext}).webkitAudioContext;
  try{muted=localStorage.getItem('belum-menyerah:scene-muted')==='1';}catch{/* Storage is optional. */}
  const report=()=>{const next=Boolean(ctx?.state==='running'&&active&&!muted&&!disposed);if(playing!==next){playing=next;onPlaying(next);}};
  function reconcile(){
    if(!ctx||!master||disposed)return;
    const audible=active&&!muted;
    master.gain.cancelScheduledValues(ctx.currentTime);master.gain.setTargetAtTime(audible?.18:0,ctx.currentTime,.06);
    // Silence immediately when hidden; suspend releases audio processing too.
    if(!audible){master.gain.setValueAtTime(0,ctx.currentTime);void ctx.suspend().catch(()=>{});}
    report();
  }
  function unlock(){
    if(disposed||muted||!active||!Context)return;
    try{
      if(!ctx){
        ctx=new Context();master=ctx.createGain();master.gain.value=0;master.connect(ctx.destination);nodes.add(master);
        noise=ctx.createBuffer(1,ctx.sampleRate*2,ctx.sampleRate);noise.copyToChannel(makeCrowdNoise(noise.length),0);
        const source=ctx.createBufferSource(),filter=ctx.createBiquadFilter();friction=ctx.createGain();friction.gain.value=0;
        source.buffer=noise;source.loop=true;filter.type='lowpass';filter.frequency.value=410;source.connect(filter);filter.connect(friction);friction.connect(master);
        sources.add(source);nodes.add(filter);nodes.add(friction);source.start();ctx.onstatechange=report;
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
    const motion=continuous?Math.min(1,Math.abs(story.rockY-lastRock)/dt*2+Math.abs(story.roll)*3):0;
    friction.gain.setTargetAtTime(motion*.10,now,.15);
    const next=story.actors.map((a,i)=>Math.floor((a.distance*18+i*.73)/Math.PI));
    if(continuous&&now-lastStep>.13){
      // A few nearby walkers are enough to suggest the group; avoid 36 overlapping footsteps.
      const index=story.actors.findIndex((a,i)=>i%3===1&&a.walking>.35&&phases[i]!==undefined&&phases[i]!==next[i]);
      if(index>=0){const a=story.actors[index],source=ctx.createBufferSource(),filter=ctx.createBiquadFilter(),gain=ctx.createGain();
        source.buffer=noise;filter.type='lowpass';filter.frequency.value=480+(index%4)*170;
        const level=.10/(1+Math.hypot(a.x,a.z)*.22);gain.gain.setValueAtTime(0,now);gain.gain.linearRampToValueAtTime(level,now+.008);gain.gain.exponentialRampToValueAtTime(.0001,now+.12);
        source.connect(filter);filter.connect(gain);gain.connect(master);sources.add(source);nodes.add(filter);nodes.add(gain);
        source.onended=()=>{source.disconnect();filter.disconnect();gain.disconnect();sources.delete(source);nodes.delete(filter);nodes.delete(gain);};
        source.start(now,(index%11)*.13,.14);lastStep=now;
      }
    }
    phases=next;lastTime=time;lastRock=story.rockY;
  }
  function dispose(){if(disposed)return;disposed=true;playing=false;onPlaying(false);if(ctx)ctx.onstatechange=null;for(const source of sources){source.onended=null;try{source.stop();}catch{}source.disconnect();}sources.clear();nodes.forEach(n=>n.disconnect());nodes.clear();if(ctx)void ctx.close().catch(()=>{});ctx=null;}
  return{unlock,setMuted,setActive,frame,dispose};
}
