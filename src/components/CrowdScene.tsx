"use client";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import Image from "next/image";
import ArrowIcon from "./ArrowIcon";
import type { IllustratedSceneHandle } from "@/lib/illustrated-crowd-scene";

/** Preserve the accepted grid footprint; only the art is a full-page backdrop. */
export default function CrowdScene() {
  const placeholder=useRef<HTMLDivElement>(null);
  const host=useRef<HTMLDivElement>(null);
  const [backdrop,setBackdrop]=useState<Element|null>(null);
  const [ready,setReady]=useState(false);
  useEffect(()=>{setBackdrop(placeholder.current?.closest('.giveup-home')??null);},[]);
  useEffect(()=>{
    const element=host.current;if(!backdrop||!element)return;
    let cancelled=false,instance:IllustratedSceneHandle|null=null;
    const media=window.matchMedia('(prefers-reduced-motion: reduce)');
    const connection=(navigator as Navigator&{connection?:{saveData?:boolean}}).connection;
    let visible=true,generation=0;
    const visibility=()=>instance?.setPaused(document.hidden||!visible);
    const update=async()=>{
      const current=++generation;
      instance?.dispose();instance=null;setReady(false);
      if(media.matches||connection?.saveData||cancelled)return;
      try{const {startIllustratedScene}=await import('@/lib/illustrated-crowd-scene');if(cancelled||current!==generation||media.matches||connection?.saveData)return;
        instance=startIllustratedScene(element,{onReady:()=>{if(!cancelled)setReady(true);},onError:()=>{if(!cancelled)setReady(false);}});visibility();
      }catch{if(!cancelled)setReady(false);}
    };
    const observer=typeof IntersectionObserver==='undefined'?null:new IntersectionObserver(([entry])=>{visible=entry.isIntersecting;visibility();});
    observer?.observe(element);document.addEventListener('visibilitychange',visibility);media.addEventListener('change',update);void update();
    return()=>{cancelled=true;generation++;observer?.disconnect();document.removeEventListener('visibilitychange',visibility);media.removeEventListener('change',update);instance?.dispose();};
  },[backdrop]);
  return <div className="bekal crowd" ref={placeholder}>
    {backdrop&&createPortal(<div className="crowd-background" aria-hidden="true">
      <div className="crowd-background__still" hidden={ready}><Image src="/scenes/illustrated-crowd-still.webp" width={1280} height={800} alt="" priority unoptimized/></div>
      <div className="crowd-background__canvas" ref={host} style={{opacity:ready?1:0}}/>
    </div>,backdrop)}
    <div className="bekal-note"><ArrowIcon className="bekal-note__line"/><span>Berat?<br/>Bareng-bareng.</span></div>
    <span className="khusus-pembaca-layar">Sekelompok orang saling membantu menopang batu besar.</span>
  </div>;
}
