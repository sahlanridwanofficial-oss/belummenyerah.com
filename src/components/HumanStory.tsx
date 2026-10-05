"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import type { HumanSceneController } from "@/lib/human-scenes";

const CHAPTERS = [
  {
    name: "Belajar",
    title: ["Tempat UMKM", "naik kelas."],
    description: "Kelas gratis dan wawasan bisnis untuk langkah berikutnya.",
    action: "Mulai belajar",
    href: "/belajar",
    secondary: "Jelajahi media",
    secondaryHref: "/blog",
    caption: "BELAJAR. BERTUMBUH. BERSAMA.",
    poster: "/scenes/learning.webp",
  },
  {
    name: "Menjalankan usaha",
    title: ["Dari ilmu,", "jadi langkah."],
    description: "Bawa yang kamu pelajari ke keputusan dan keseharian usahamu.",
    action: "Temukan bekalmu",
    href: "/belajar",
    secondary: "Baca insight bisnis",
    secondaryHref: "/blog",
    caption: "PAHAMI. PRAKTIKKAN. LANJUTKAN.",
    poster: "/scenes/business.webp",
  },
  {
    name: "Berkolaborasi",
    title: ["Sudut pandang", "membuka jalan."],
    description:
      "Belajar dari cerita, bertukar perspektif, dan membangun usaha yang lebih kuat.",
    action: "Jelajahi media",
    href: "/blog",
    secondary: "Kelas gratis",
    secondaryHref: "/belajar",
    caption: "BERTUKAR IDE. MAJU BERSAMA.",
    poster: "/scenes/collaboration.webp",
  },
];

export default function HumanStory() {
  const section = useRef<HTMLElement>(null);
  const canvas = useRef<HTMLDivElement>(null);
  const controller = useRef<HumanSceneController | null>(null);
  const progress = useRef(0);
  const [chapter, setChapter] = useState(0);
  const [ready, setReady] = useState([false, false, false]);
  const [paused, setPaused] = useState(false);
  const [reduced, setReduced] = useState(false);
  const [failed, setFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const [seen, setSeen] = useState(false);
  const playback = useRef({ paused, reduced });
  playback.current = { paused, reduced };

  useEffect(() => {
    const element = section.current;
    if (!element) return;
    if (typeof IntersectionObserver === "undefined") {
      setSeen(true);
      return;
    }
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setSeen(true);
        observer.disconnect();
      }
    }, { rootMargin: "160px", threshold: 0.01 });
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => setReduced(media.matches);
    sync();
    media.addEventListener("change", sync);
    let scrollFrame = 0;
    const readScroll = () => {
      scrollFrame = 0;
      if (!section.current) return;
      const box = section.current.getBoundingClientRect();
      const p = Math.max(
        0,
        Math.min(
          2,
          (-box.top / Math.max(1, box.height - window.innerHeight)) * 2,
        ),
      );
      progress.current = p;
      setChapter(Math.round(p));
      controller.current?.setProgress(p);
    };
    const onScroll = () => {
      if (!scrollFrame) scrollFrame = requestAnimationFrame(readScroll);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    readScroll();
    return () => {
      cancelAnimationFrame(scrollFrame);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      media.removeEventListener("change", sync);
    };
  }, []);

  useEffect(() => {
    if (!seen) return;
    let cancelled = false;
    setFailed(false);
    setReady([false, false, false]);
    // Read the preference here as well as in state so an initial effect race
    // cannot download the renderer or models for a reduced-motion reader.
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const connection = (
      navigator as Navigator & { connection?: { saveData?: boolean } }
    ).connection;
    if (connection?.saveData && attempt === 0) {
      setFailed(true);
      return;
    }
    import("@/lib/human-scenes")
      .then(({ createHumanScenes }) => {
        if (cancelled || !canvas.current) return;
        try {
          controller.current = createHumanScenes(
            canvas.current,
            (index, available) => {
              if (cancelled) return;
              if (index < 0) {
                setReady([false, false, false]);
                setFailed(true);
              } else {
                setReady((previous) =>
                  previous.map((value, i) => (i === index ? available : value)),
                );
                if (!available) setFailed(true);
              }
            },
          );
          controller.current.pause(playback.current.paused || playback.current.reduced);
          controller.current.setProgress(progress.current);
        } catch {
          setFailed(true);
        }
      })
      .catch(() => {
        if (!cancelled) setFailed(true);
      });
    return () => {
      cancelled = true;
      controller.current?.dispose();
      controller.current = null;
    };
  }, [attempt, seen, reduced]);

  useEffect(() => {
    controller.current?.pause(paused || reduced);
  }, [paused, reduced, ready]);

  function goTo(index: number) {
    if (!section.current) return;
    const box = section.current.getBoundingClientRect();
    window.scrollTo({
      top:
        window.scrollY +
        box.top +
        ((box.height - window.innerHeight) * index) / 2,
      behavior: reduced ? "auto" : "smooth",
    });
  }

  return (
    <section
      className="human-story"
      ref={section}
      data-scene={chapter}
      aria-label="Perjalanan UMKM: belajar, menjalankan usaha, dan berkolaborasi"
    >
      <noscript>
        <style>{`.human-story { height: 100svh !important; } .human-story__steps, .human-story__controls, .human-story__scroll { display: none !important; }`}</style>
      </noscript>
      <div className="human-story__sticky">
        <div className="human-story__fallback" aria-hidden="true">
          <Image
            src={CHAPTERS[chapter].poster}
            alt=""
            fill
            sizes="100vw"
            unoptimized
            priority
          />
        </div>
        <div
          ref={canvas}
          className="human-story__canvas"
          aria-hidden="true"
          style={{ opacity: ready[chapter] ? 1 : 0 }}
        />
        <p className="khusus-pembaca-layar">
          Tiga situasi digambarkan dengan model manusia 3D: belajar di meja
          laptop, mengelola pesanan usaha, lalu berkolaborasi di ruang kerja.
          Semua informasi dan tautan tetap tersedia tanpa animasi.
        </p>
        {CHAPTERS.map((item, index) => (
          <div
            className="human-story__copy"
            key={item.name}
            data-active={chapter === index}
            aria-hidden={chapter !== index}
            inert={chapter !== index}
          >
            <span className="human-story__eyebrow">
              SEKOLAH DAN MEDIA UNTUK UMKM
            </span>
            {index === 0 ? (
              <h1>
                {item.title[0]}
                <br />
                {item.title[1]}
              </h1>
            ) : (
              <h2>
                {item.title[0]}
                <br />
                {item.title[1]}
              </h2>
            )}
            <p>{item.description}</p>
            <div className="human-story__actions">
              <Link href={item.href} className="story-button">
                {item.action}
              </Link>
              <Link href={item.secondaryHref} className="story-link">
                {item.secondary} <span aria-hidden="true">→</span>
              </Link>
            </div>
          </div>
        ))}
        <div className="human-story__caption">{CHAPTERS[chapter].caption}</div>
        <button
          className="human-story__scroll"
          type="button"
          onClick={() =>
            chapter < 2
              ? goTo(chapter + 1)
              : document
                  .getElementById("kelas")
                  ?.scrollIntoView({ behavior: reduced ? "auto" : "smooth" })
          }
          aria-label={
            chapter < 2 ? "Lihat situasi berikutnya" : "Lihat kelas gratis"
          }
        >
          ⌄
        </button>
        <nav className="human-story__steps" aria-label="Pilih situasi">
          {CHAPTERS.map((item, i) => (
            <button
              key={item.name}
              type="button"
              aria-label={item.name}
              aria-current={chapter === i ? "step" : undefined}
              onClick={() => goTo(i)}
            />
          ))}
        </nav>
        <div className="human-story__controls">
          {ready[chapter] && !reduced && (
            <button
              type="button"
              aria-pressed={paused}
              onClick={() => setPaused((value) => !value)}
            >
              {paused ? "▷ Lanjutkan gerak" : "Ⅱ Jeda gerak"}
            </button>
          )}
          {!reduced && !ready[chapter] && failed && (
            <button
              type="button"
              onClick={() => setAttempt((value) => value + 1)}
            >
              Ilustrasi statis · Coba 3D
            </button>
          )}
        </div>
      </div>
    </section>
  );
}
