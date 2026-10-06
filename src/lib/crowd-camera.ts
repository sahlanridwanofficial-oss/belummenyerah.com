import { sampleCrowdStory, STORY_DURATION } from './crowd-story';
/** Screen-fixed UI sits in front of this visibly rotating, bounded world camera. */
export function getCrowdCamera(time:number,aspect:number,still=false){
 const safeAspect=Math.max(.05,Number.isFinite(aspect)?aspect:1),story=sampleCrowdStory(time,still);
 const base=Math.max(10.2,16/safeAspect)/(2*Math.tan(34*Math.PI/360));
 const distance=base*(1-story.focus*.20);
 const orbit=still?-.12:-.38*Math.cos(story.time*Math.PI*2/STORY_DURATION);
 return{orbit,distance,far:base*1.2+40,position:[Math.sin(orbit)*distance,.7+distance*.64,Math.cos(orbit)*distance] as [number,number,number],target:[0,.7,-.8] as [number,number,number],rootPosition:[safeAspect<.85?.6:1.25,.15,0] as [number,number,number]};
}
