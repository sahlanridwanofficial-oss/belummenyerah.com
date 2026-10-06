"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import ArrowIcon from "./ArrowIcon";
import type { CrowdSceneHandle } from "@/lib/crowd-scene";

export default function CrowdScene() {
  const host = useRef<HTMLDivElement>(null);
  const scene = useRef<CrowdSceneHandle | null>(null);
  const [enabled, setEnabled] = useState(false);
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);
  const [paused, setPaused] = useState(false);
  const [helping, setHelping] = useState(false);
  const [limited, setLimited] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const visibleRef = useRef(true);
  const pausedRef = useRef(paused);
  pausedRef.current = paused;

  useEffect(() => {
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const connection = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection;
    const update = () => {
      const save = motion.matches || Boolean(connection?.saveData);
      setLimited(save);
      setReducedMotion(motion.matches);
      setEnabled(!save);
      if (save) { setPaused(true); setReady(false); setHelping(false); }
    };
    update();
    motion.addEventListener("change", update);
    return () => motion.removeEventListener("change", update);
  }, []);

  useEffect(() => {
    const element = host.current;
    if (!enabled || !element) return;
    let cancelled = false;
    let started = false;
    visibleRef.current = true;
    let instance: CrowdSceneHandle | null = null;
    setFailed(false);
    setHelping(false);
    setReady(false);
    const visibility = () => instance?.setPaused(pausedRef.current || document.hidden || !visibleRef.current);
    const load = async () => {
      if (started || cancelled) return;
      started = true;
      try {
        const { startCrowdScene } = await import("@/lib/crowd-scene");
        if (cancelled) return;
        instance = await startCrowdScene(element, {
          onReady: () => { if (!cancelled) setReady(true); },
          onError: () => { if (!cancelled) { setFailed(true); setReady(false); setHelping(false); } },
          onActionChange: active => { if (!cancelled) setHelping(active); },
        });
        if (cancelled) { instance.dispose(); return; }
        scene.current = instance;
        visibility();
      } catch {
        if (!cancelled) { setFailed(true); setReady(false); }
      }
    };
    const observer = typeof IntersectionObserver === "undefined" ? null : new IntersectionObserver(([entry]) => {
      visibleRef.current = entry.isIntersecting;
      if (visibleRef.current) void load();
      visibility();
    }, { rootMargin: "80px" });
    if (observer) observer.observe(element); else void load();
    document.addEventListener("visibilitychange", visibility);
    return () => {
      cancelled = true;
      observer?.disconnect();
      document.removeEventListener("visibilitychange", visibility);
      instance?.dispose();
      scene.current = null;
    };
  }, [enabled, attempt]);

  useEffect(() => { scene.current?.setPaused(paused || document.hidden || !visibleRef.current); }, [paused]);

  return <div className="bekal crowd" data-ready={ready} data-helping={helping}>
    <div className="bekal-art" onPointerMove={(event) => {
      if (paused || event.pointerType === "touch") return;
      const rect = event.currentTarget.getBoundingClientRect();
      scene.current?.setPointer((event.clientX - rect.left) / rect.width * 2 - 1, (event.clientY - rect.top) / rect.height * 2 - 1);
    }} onPointerLeave={() => scene.current?.setPointer(0, 0)}>
      <div className="bekal-still" hidden={ready}><Image src="/scenes/crowd-still.webp" width={720} height={720} alt="" priority unoptimized className="crowd-fallback" /></div>
      <div className="bekal-canvas" ref={host} aria-hidden="true" style={{ opacity: ready ? 1 : 0 }} />
    </div>
    <div className="bekal-note"><ArrowIcon className="bekal-note__line"/><span>Berat?<br />Bareng-bareng.</span></div>
    <div className="bekal-controls">
      {ready && reducedMotion ? <span>3D · gerak dikurangi</span> : ready ? <>
        <button type="button" aria-disabled={helping} onClick={() => { if (helping) return; if (paused) { setPaused(false); scene.current?.setPaused(document.hidden || !visibleRef.current); } scene.current?.help(); }} aria-label="Bantu kelompok mengangkat batu" aria-busy={helping}>{helping ? "Bareng-bareng!" : "Bantu angkat"} <svg width="15" height="15" viewBox="0 0 20 20" aria-hidden="true"><path d="M10 17V3M4 9l6-6 6 6" fill="none" stroke="currentColor" strokeWidth="1.5"/></svg></button>
        <button className="bekal-pause" type="button" aria-pressed={paused} aria-label={paused ? "Lanjutkan animasi" : "Jeda animasi"} onClick={() => setPaused(value => !value)}><svg width="16" height="16" viewBox="0 0 20 20" aria-hidden="true">{paused ? <path d="M6 3l10 7-10 7Z" fill="none" stroke="currentColor" strokeWidth="1.5"/> : <path d="M7 4v12M13 4v12" stroke="currentColor" strokeWidth="2"/>}</svg></button>
      </> : (failed || limited) ? <button type="button" onClick={() => { setPaused(false); setEnabled(true); setAttempt(value => value + 1); }}>Coba animasi 3D <ArrowIcon/></button> : null}
    </div>
    <span className="khusus-pembaca-layar" role="status">{failed ? "Ilustrasi kelompok menopang batu ditampilkan karena 3D tidak tersedia di perangkat ini." : limited && !ready ? "Ilustrasi diam ditampilkan untuk menghemat data atau mengurangi gerak." : helping ? "Kamu ikut membantu. Bersama, batu terangkat." : "Sekelompok orang saling membantu menopang batu besar."}</span>
  </div>;
}
