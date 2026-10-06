"use client";

import ArrowIcon from "@/components/ArrowIcon";
import Link from "next/link";
import { useEffect, useId, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { TandaLogo } from "./Logo";

export type Bagian = "blog" | "belajar" | "tentang";

/** Reading and lesson pages deliberately omit the subscription CTA. */
export default function Masthead({
  aktif,
  ajakan = true,
  ringkas = false,
}: {
  aktif?: Bagian;
  ajakan?: boolean;
  ringkas?: boolean;
}) {
  const [terbuka, setTerbuka] = useState(false);
  const menuId = useId();
  const judulId = `${menuId}-judul`;
  const tombol = useRef<HTMLButtonElement>(null);
  const dialog = useRef<HTMLDialogElement>(null);
  const alamat = usePathname();

  useEffect(() => {
    setTerbuka(false);
  }, [alamat]);

  useEffect(() => {
    const menu = dialog.current;
    if (!terbuka || !menu) return;

    const overflowSebelumnya = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    menu.showModal();
    menu.querySelector<HTMLAnchorElement>("nav a")?.focus();

    return () => {
      menu.close();
      document.body.style.overflow = overflowSebelumnya;
      tombol.current?.focus({ preventScroll: true });
    };
  }, [terbuka]);

  return (
    <header className={`masthead${ringkas ? " masthead--ringkas" : ""}`}>
      <div className="halaman masthead-isi">
        <Link href="/" className="tautan-logo" aria-label="belummenyerah, ke beranda">
          <TandaLogo ukuran={48} />
        </Link>
        <div className="masthead-kanan">
          <nav className="nav nav-publik" aria-label="Navigasi utama">
            <Link href="/belajar" aria-current={aktif === "belajar" ? "page" : undefined}>
              Kelas gratis
            </Link>
            <Link href="/tentang" aria-current={aktif === "tentang" ? "page" : undefined}>
              Tentang
            </Link>
          </nav>
          <button
            className="tombol-menu"
            type="button"
            ref={tombol}
            aria-label="Buka menu"
            aria-expanded={terbuka}
            aria-controls={menuId}
            aria-haspopup="dialog"
            onClick={() => setTerbuka(true)}
          >
            <span className="ikon-menu" aria-hidden="true"><span /><span /></span>
          </button>
        </div>
      </div>

      <dialog
        ref={dialog}
        id={menuId}
        className="menu-overlay"
        aria-labelledby={judulId}
        onCancel={(event) => {
          event.preventDefault();
          setTerbuka(false);
        }}
        onKeyDown={(event) => {
          if (event.key === "Escape") {
            event.preventDefault();
            setTerbuka(false);
          }
          if (event.key !== "Tab") return;
          const items = dialog.current?.querySelectorAll<HTMLElement>("a[href], button:not([disabled])");
          if (!items?.length) return;
          const first = items[0];
          const last = items[items.length - 1];
          if (event.shiftKey && document.activeElement === first) {
            event.preventDefault();
            last.focus();
          } else if (!event.shiftKey && document.activeElement === last) {
            event.preventDefault();
            first.focus();
          }
        }}
      >
        <h2 id={judulId} className="khusus-pembaca-layar">Menu utama</h2>
        <div className="menu-overlay__top halaman">
          <Link href="/" className="tautan-logo" aria-label="belummenyerah, ke beranda" onClick={() => setTerbuka(false)}>
            <TandaLogo ukuran={48} />
          </Link>
          <button type="button" className="tombol-menu tombol-menu--close" aria-label="Tutup menu" onClick={() => setTerbuka(false)}>
            <span className="ikon-menu" aria-hidden="true"><span /><span /></span>
          </button>
        </div>
        <div className="menu-overlay__body halaman">
          <span className="menu-overlay__intro">Satu langkah berikutnya.</span>
          <nav
            className="menu-overlay__links"
            aria-label="Semua halaman"
            onClick={(event) => {
              if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
              if (event.target instanceof Element && event.target.closest("a")) setTerbuka(false);
            }}
          >
            <Link href="/belajar" aria-current={aktif === "belajar" ? "page" : undefined}><span>Kelas gratis</span><ArrowIcon /></Link>
            <Link href="/tentang" aria-current={aktif === "tentang" ? "page" : undefined}><span>Tentang kami</span><ArrowIcon /></Link>
            {ajakan && <Link href="/berlangganan"><span>Langganan gratis</span><ArrowIcon /></Link>}
          </nav>
          <p className="menu-overlay__note">Bekal belajar untuk UMKM.<br />Belajar. Bertumbuh. Bersama.</p>
        </div>
      </dialog>
      <noscript>
        <style>{`.tombol-menu { display: none !important; }`}</style>
        <nav className="halaman menu-tanpa-script" aria-label="Halaman lainnya">
          <Link href="/tentang">Tentang kami</Link>
          {ajakan && <Link href="/berlangganan">Langganan gratis</Link>}
        </nav>
      </noscript>
    </header>
  );
}
