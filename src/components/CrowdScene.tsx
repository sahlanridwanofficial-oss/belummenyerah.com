"use client";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import Image from "next/image";
import ArrowIcon from "./ArrowIcon";
import { createCrowdAudio, type CrowdAudioHandle } from "@/lib/crowd-audio";
import type { IllustratedSceneHandle } from "@/lib/illustrated-crowd-scene";

/** Preserve the accepted grid footprint; only the art is a full-page backdrop. */
export default function CrowdScene() {
  const placeholder=useRef<HTMLDivElement>(null);
  const host=useRef<HTMLDivElement>(null);
  const [backdrop,setBackdrop]=useState<Element|null>(null);
  const [ready,setReady]=useState(false);
  const sound=useRef<CrowdAudioHandle|null>(null);
  const [playing,setPlaying]=useState(false);
  const [soundAvailable,setSoundAvailable]=useState(false);
  useEffect(()=>{setBackdrop(placeholder.current?.closest('.giveup-home')??null);},[]);
  useEffect(()=>{
    const element=host.current;if(!backdrop||!element)return;
    let cancelled=false,instance:IllustratedSceneHandle|null=null;
    const media=window.matchMedia('(prefers-reduced-motion: reduce)');
    const connection=(navigator as Navigator&{connection?:{saveData?:boolean}}).connection;
    let visible=true,generation=0,sceneReady=false;
    const audio=createCrowdAudio(setPlaying);sound.current=audio;
    setSoundAvailable(Boolean(window.AudioContext||(window as typeof window&{webkitAudioContext?:unknown}).webkitAudioContext));
    const visibility=()=>{instance?.setPaused(document.hidden||!visible);audio.setActive(sceneReady&&!document.hidden&&visible&&!media.matches);};
    const gesture=(event:Event)=>{if(event.isTrusted&&!(event.target instanceof Element&&event.target.closest('.crowd-sound')))audio.unlock();};
    document.addEventListener('pointerdown',gesture);document.addEventListener('keydown',gesture);
    const update=async()=>{
      const current=++generation;
      instance?.dispose();instance=null;sceneReady=false;audio.setActive(false);setReady(false);
      if(media.matches||connection?.saveData||cancelled)return;
      try{const {startIllustratedScene}=await import('@/lib/illustrated-crowd-scene');if(cancelled||current!==generation||media.matches||connection?.saveData)return;
        instance=startIllustratedScene(element,{onReady:()=>{if(!cancelled){sceneReady=true;setReady(true);visibility();}},onError:()=>{if(!cancelled){sceneReady=false;setReady(false);visibility();}},onFrame:audio.frame});visibility();
      }catch{if(!cancelled)setReady(false);}
    };
    const observer=typeof IntersectionObserver==='undefined'?null:new IntersectionObserver(([entry])=>{visible=entry.isIntersecting;visibility();});
    observer?.observe(element);document.addEventListener('visibilitychange',visibility);media.addEventListener('change',update);void update();
    return()=>{cancelled=true;generation++;observer?.disconnect();document.removeEventListener('visibilitychange',visibility);media.removeEventListener('change',update);instance?.dispose();document.removeEventListener('pointerdown',gesture);document.removeEventListener('keydown',gesture);audio.dispose();sound.current=null;};
  },[backdrop]);
  return <div className="bekal crowd" ref={placeholder}>
    {backdrop&&createPortal(<div className="crowd-background" aria-hidden="true">
      <div className="crowd-background__still" hidden={ready}><Image src="/scenes/illustrated-crowd-still.webp" width={1280} height={800} alt="" priority unoptimized/></div>
      <div className="crowd-background__canvas" ref={host} style={{opacity:ready?1:0}}/>
    </div>,backdrop)}
    {backdrop&&ready&&soundAvailable&&createPortal(<button type="button" className="crowd-sound" aria-label={playing?'Bisukan suara suasana':'Aktifkan suara suasana'} aria-pressed={playing} title={playing?'Bisukan suara':'Aktifkan suara'} onClick={event=>{if(!event.nativeEvent.isTrusted)return;sound.current?.setMuted(playing);if(!playing)sound.current?.unlock();}}>
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true"><path d="M11 5 6 9H3v6h3l5 4V5Z"/>{playing?<><path d="M15 8a6 6 0 0 1 0 8M18 5a10 10 0 0 1 0 14"/></>:<path d="m16 9 5 6m0-6-5 6"/>}</svg>
    </button>,backdrop)}
    <div className="bekal-note"><ArrowIcon className="bekal-note__line"/><span>Berat?<br/>Bareng-bareng.</span></div>
    <span className="khusus-pembaca-layar">Sekelompok orang saling membantu menopang batu besar.</span>
  </div>;
}
