"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import InlineAudio from "./components/InlineAudio";
import { useRouter } from "next/navigation";

type Title = { id: string; name: string; overview: string; poster: string; backdrop: string; year: number; mediaUrl?: string };

const API_BASE = (process.env.NEXT_PUBLIC_API_BASE || "").replace(/\/$/, "");

export default function Home() {
  const [trending, setTrending] = useState<Title[]>([]);
  const [popular, setPopular] = useState<Title[]>([]);
  const [top, setTop] = useState<Title[]>([]);
  const [hero, setHero] = useState<Title | null>(null);
  const [loading, setLoading] = useState(false);
  const [playerSrc, setPlayerSrc] = useState<string>("");
  const api = API_BASE;
  const router = useRouter();

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const bust = Date.now();
        const [t, p, tp] = await Promise.all([
          fetch(`${api}/api/tmdb/trending?bust=${bust}`, { cache: 'no-store' }).then(r=>r.json()).catch(()=>({})),
          fetch(`${api}/api/tmdb/popular?bust=${bust}`, { cache: 'no-store' }).then(r=>r.json()).catch(()=>({})),
          fetch(`${api}/api/tmdb/top?bust=${bust}`, { cache: 'no-store' }).then(r=>r.json()).catch(()=>({})),
        ]);
        if (cancelled) return;
        const dedupe = (arr: any[]) => (Array.isArray(arr) ? arr.filter((it, i, a) => a.findIndex(x => x.name === it.name) === i) : []);
        const tt = dedupe(t?.items);
        const pp = dedupe(p?.items);
        const tpv = dedupe(tp?.items);
        setTrending(tt); setPopular(pp); setTop(tpv);
        // Prefer an item with mediaUrl so Play works immediately (e.g., Thrawn)
        const withMedia = [...tt, ...pp, ...tpv].find(it => !!it.mediaUrl);
        const first = withMedia || (tt[0] || pp[0] || tpv[0] || null);
        setHero(first);
      } catch (e) {
        console.error(e);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [api]);

  const rows = useMemo(() => ([
    { title: "Trending Now", items: trending },
    { title: "Popular", items: popular },
    { title: "Top Rated", items: top },
  ]), [trending, popular, top]);

  const ULTIMATE_FALLBACK = 'https://sirround.me/thrawn1-ec3.mkv';

  const fallbackMediaUrl = useMemo(() => {
    const all = rows.flatMap(r => r.items);
    return all.find(it => !!it.mediaUrl)?.mediaUrl || ULTIMATE_FALLBACK;
  }, [rows]);

  const playUrl = useMemo(() => {
    const url = (hero?.mediaUrl || fallbackMediaUrl || ULTIMATE_FALLBACK).trim();
    const direct = encodeURI(url);
    const base = (process.env.NEXT_PUBLIC_API_BASE || '').replace(/\/$/, '');
    return base ? `${base}/api/stream?src=${encodeURIComponent(direct)}` : direct;
  }, [hero, fallbackMediaUrl]);

  const toAndroidIntent = (rawUrl: string) => {
    const scheme = rawUrl.startsWith('https') ? 'https' : 'http';
    const noScheme = rawUrl.replace(/^https?:\/\//, '');
    return `intent://${noScheme}#Intent;action=android.intent.action.VIEW;type=video/x-matroska;scheme=${scheme};end`;
  };

  return (
    <section className="mx-auto max-w-[120rem]">
      {/* Hero */}
      {hero ? (
        <section className="relative h-[60vh] w-full overflow-hidden md:h-[70vh]">
          <div className="absolute inset-0">
            {/* Use img to avoid Next Image remote domain config */}
            <img src={hero.poster} alt={hero.name} className="h-full w-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-black/10" />
          </div>
          <div className="relative z-10 mx-auto flex h-full max-w-7xl flex-col justify-end gap-4 px-6 pb-10">
            <h1 className="max-w-2xl text-4xl font-bold md:text-6xl">{hero.name}</h1>
            <p className="max-w-xl text-sm text-zinc-200 md:text-base line-clamp-3">{hero.overview}</p>
            <div className="flex gap-3">
              <a
                href={playUrl}
                target="_self"
                rel="noopener noreferrer"
                className="rounded bg-white px-4 py-2 text-black hover:bg-zinc-200"
                data-focusable="true"
                onClick={(e) => {
                  e.preventDefault();
                  const ua = typeof navigator !== 'undefined' ? navigator.userAgent : '';
                  const direct = (hero?.mediaUrl || fallbackMediaUrl || ULTIMATE_FALLBACK).trim();
                  if (/Android/i.test(ua)) {
                    const intentUrl = toAndroidIntent(direct);
                    try { window.location.assign(intentUrl); } catch { window.location.href = intentUrl; }
                    return;
                  }
                  try { window.location.assign(playUrl); } catch { window.location.href = playUrl; }
                }}
              >
                Play
              </a>
              <button
                className="rounded bg-zinc-800 px-4 py-2 text-white hover:bg-zinc-700"
                data-focusable="true"
                onClick={() => {
                  const direct = (hero?.mediaUrl || fallbackMediaUrl || ULTIMATE_FALLBACK).trim();
                  setPlayerSrc(direct);
                }}
              >
                Play
              </button>
            </div>
          </div>
        </section>
      ) : (
        <div className="h-40" />
      )}

      {/* Rows */}
      <div className="space-y-10 py-8">
        {rows.map((row) => (
          <section key={row.title} className="space-y-3">
            <h2 className="px-6 text-lg font-semibold md:text-xl">{row.title}</h2>
            <div className="no-scrollbar flex gap-3 overflow-x-auto px-6 pb-2">
              {row.items.map((item) => (
                <div key={item.id} className="flex w-[100px] flex-shrink-0 flex-col items-stretch md:w-[150px]">
                  <button
                    className="relative h-[150px] w-full overflow-hidden rounded border border-zinc-800 bg-zinc-900 hover:border-zinc-600 md:h-[225px]"
                    onClick={() => {
                      const direct = (item.mediaUrl || '').trim();
                      setPlayerSrc(direct);
                    }}
                    aria-label={`Play ${item.name}`}
                    data-focusable="true"
                    tabIndex={0}
                  >
                    <img src={item.poster} alt={item.name} className="h-full w-full object-cover" />
                  </button>
                </div>
              ))}
            </div>
          </section>
        ))}
      </div>
      {playerSrc ? (
        <div className="px-6 pb-10">
          <InlineAudio src={playerSrc} apiBase={API_BASE} autoplay />
        </div>
      ) : null}
    </section>
  );
}
