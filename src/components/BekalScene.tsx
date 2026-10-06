"use client";

import { useEffect, useRef, useState } from "react";
import BekalFallback from "./BekalFallback";
import ArrowIcon from "./ArrowIcon";
import type { BekalSceneHandle } from "@/lib/bekal-scene";

export default function BekalScene() {
  const host = useRef<HTMLDivElement>(null);
  const scene = useRef<BekalSceneHandle | null>(null);
  const [enabled, setEnabled] = useState(false);
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);
  const [paused, setPaused] = useState(false);
  const [limited, setLimited] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [attempt, setAttempt] = useState(0);
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
      if (save) { setPaused(true); setReady(false); }
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
    let visible = true;
    let instance: BekalSceneHandle | null = null;
    setFailed(false);
    setReady(false);
    const visibility = () => instance?.setPaused(pausedRef.current || document.hidden || !visible);
    const load = async () => {
      if (started || cancelled) return;
      started = true;
      try {
        const { startBekalScene } = await import("@/lib/bekal-scene");
        if (cancelled) return;
        instance = await startBekalScene(element, {
          onReady: () => { if (!cancelled) setReady(true); },
          onError: () => { if (!cancelled) { setFailed(true); setReady(false); } },
        });
        if (cancelled) { instance.dispose(); return; }
        scene.current = instance;
        visibility();
      } catch {
        if (!cancelled) { setFailed(true); setReady(false); }
      }
    };
    const observer = typeof IntersectionObserver === "undefined" ? null : new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      if (visible) void load();
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

  useEffect(() => { scene.current?.setPaused(paused || document.hidden); }, [paused]);

  return <div className="bekal" data-ready={ready}>
    <div className="bekal-art" onPointerMove={(event) => {
      if (paused || event.pointerType === "touch") return;
      const rect = event.currentTarget.getBoundingClientRect();
      scene.current?.setPointer((event.clientX - rect.left) / rect.width * 2 - 1, (event.clientY - rect.top) / rect.height * 2 - 1);
    }} onPointerLeave={() => scene.current?.setPointer(0, 0)}>
      <div className="bekal-still" hidden={ready}><BekalFallback /></div>
      <div className="bekal-canvas" ref={host} aria-hidden="true" style={{ opacity: ready ? 1 : 0 }} />
    </div>
    <div className="bekal-note"><ArrowIcon className="bekal-note__line"/><span>Bekal kecil.<br />Langkah besar.</span></div>
    <div className="bekal-controls">
      {ready && reducedMotion ? <span>3D · gerak dikurangi</span> : ready ? <>
        <button type="button" onClick={() => { if (paused) { setPaused(false); scene.current?.setPaused(false); } scene.current?.celebrate(); }} aria-label="Sapa Bekal, mainkan gerakan pendek">Sapa Bekal <svg width="15" height="15" viewBox="0 0 20 20" aria-hidden="true"><path d="M10 2v16M2 10h16M4 4l12 12M16 4L4 16" stroke="currentColor" strokeWidth="1.5"/></svg></button>
        <button className="bekal-pause" type="button" aria-pressed={paused} aria-label={paused ? "Lanjutkan animasi" : "Jeda animasi"} onClick={() => setPaused(value => !value)}><svg width="16" height="16" viewBox="0 0 20 20" aria-hidden="true">{paused ? <path d="M6 3l10 7-10 7Z" fill="none" stroke="currentColor" strokeWidth="1.5"/> : <path d="M7 4v12M13 4v12" stroke="currentColor" strokeWidth="2"/>}</svg></button>
      </> : (failed || limited) ? <button type="button" onClick={() => { setPaused(false); setEnabled(true); setAttempt(value => value + 1); }}>Coba animasi 3D <ArrowIcon/></button> : null}
    </div>
    <span className="khusus-pembaca-layar" role="status">{failed ? "Ilustrasi Bekal ditampilkan karena 3D tidak tersedia di perangkat ini." : limited && !ready ? "Ilustrasi diam ditampilkan untuk menghemat data atau mengurangi gerak." : "Bekal, karakter buku kecil yang menemani langkah usahamu."}</span>
  </div>;
}
