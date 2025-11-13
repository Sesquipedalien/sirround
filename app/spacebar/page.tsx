"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

const API_BASE = (process.env.NEXT_PUBLIC_API_BASE || "").replace(/\/$/, "");

function useScript(src: string) {
  const [ok, setOk] = useState(false);
  useEffect(() => {
    if (document.querySelector(`script[src="${src}"]`)) { setOk(true); return; }
    const s = document.createElement('script');
    s.src = src; s.async = true; s.onload = () => setOk(true); s.onerror = () => setOk(false);
    document.body.appendChild(s);
    return () => { s.remove(); };
  }, [src]);
  return ok;
}

export default function SpacebarPage() {
  const redirectedRef = useRef(false);
  useEffect(() => { if (typeof window !== 'undefined' && !redirectedRef.current) { redirectedRef.current = true; window.location.replace('/'); } }, []);
  const [src, setSrc] = useState("");
  const [status, setStatus] = useState<string>("");
  const [hasQuery, setHasQuery] = useState(false);
  
  const [pack, setPack] = useState<any>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  
  const isSafari = useMemo(() => {
    if (typeof navigator === 'undefined') return false;
    const ua = navigator.userAgent;
    return /Safari\//.test(ua) && !/Chrome\//.test(ua) && !/Chromium\//.test(ua);
  }, []);
  // External libraries and query params
  const hlsOk = useScript("https://unpkg.com/hls.js@1.5.14/dist/hls.min.js");
  const hlsRef = useRef<any>(null);

  // Auto-load from ?src= and package EC-3 MKV when necessary
  useEffect(() => {
    const el = audioRef.current; if (!el) return;
    let qs: string | null = null;
    try {
      const sp = new URLSearchParams(typeof window !== 'undefined' ? window.location.search : '');
      qs = sp.get('src');
    } catch {}
    if (!qs) return;
    setHasQuery(true);
    let raw = qs;
    try { raw = decodeURIComponent(qs); } catch {}
    setSrc(raw);
    (async () => {
      try {
        const url = raw;
        const isEc3Like = /\.(mkv|ec3)$/i.test(url);
        if (isEc3Like) {
          if (isSafari) {
            setStatus('Packaging EC-3 for HLS...');
            const r = await fetch(`${API_BASE}/api/hls/package-ec3?src=${encodeURIComponent(url)}`);
            const j = await r.json();
            if (j?.ok && (j.master || j.hls)) {
              const hlsUrl = j.master || j.hls;
              await attachHls(el, hlsUrl);
              setStatus('Ready');
              await el.play().catch(() => {});
              return;
            } else {
              setStatus('EC-3 packaging failed');
            }
          } else {
            setStatus('Packaging AAC HLS for compatibility...');
            const r = await fetch(`${API_BASE}/api/hls/package?src=${encodeURIComponent(url)}`);
            const j = await r.json();
            if (j?.ok && j.viz) {
              await attachHls(el, j.viz);
              setStatus('Ready');
              await el.play().catch(() => {});
              return;
            } else {
              setStatus('AAC packaging failed');
            }
          }
        }
        // Non-EC3: direct play
        el.src = url;
        setStatus('Ready');
        await el.play().catch(() => {});
      } catch (e) {
        setStatus('Load failed');
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hlsOk]);

  const attachHls = useCallback(async (el: HTMLAudioElement, src: string) => {
    // If Safari, try native HLS
    if (isSafari) {
      el.src = src; return;
    }
    try {
      const Hls = (window as any).Hls;
      if (Hls?.isSupported()) {
        if (hlsRef.current) { try { hlsRef.current.destroy(); } catch {} }
        const h = new Hls({ enableWorker: true });
        h.attachMedia(el);
        h.on(Hls.Events.MEDIA_ATTACHED, () => { h.loadSource(src); });
        hlsRef.current = h;
      } else {
        // Fallback to direct src
        el.src = src;
      }
    } catch {
      el.src = src;
    }
  }, [isSafari]);

  

  useEffect(() => {
    if (!API_BASE) return;
    fetch(`${API_BASE}/api/health`).catch(() => {});
  }, []);

  const probe = useCallback(async () => {
    if (!API_BASE || !src) return;
    setStatus('Probing...');
    try { await fetch(`${API_BASE}/api/media/probe?src=${encodeURIComponent(src)}`); } catch {}
    setStatus('');
  }, [src]);

  const manualLoad = useCallback(async () => {
    const el = audioRef.current; if (!el || !src) return;
    try {
      const isEc3Like = /\.(mkv|ec3)$/i.test(src);
      if (isEc3Like) {
        if (isSafari) {
          setStatus('Packaging EC-3 for HLS...');
          const r = await fetch(`${API_BASE}/api/hls/package-ec3?src=${encodeURIComponent(src)}`);
          const j = await r.json();
          if (j?.ok && (j.master || j.hls)) {
            await attachHls(el, j.master || j.hls);
            setStatus('Ready');
            await el.play().catch(() => {});
            return;
          }
          setStatus('EC-3 packaging failed');
        } else {
          setStatus('Packaging AAC HLS for compatibility...');
          const r = await fetch(`${API_BASE}/api/hls/package?src=${encodeURIComponent(src)}`);
          const j = await r.json();
          if (j?.ok && j.viz) {
            await attachHls(el, j.viz);
            setStatus('Ready');
            await el.play().catch(() => {});
            return;
          }
          setStatus('AAC packaging failed');
        }
      } else {
        el.src = src; setStatus('Ready'); await el.play().catch(() => {});
      }
    } catch { setStatus('Load failed'); }
  }, [src, attachHls]);

  // No visualizer / WebAudio routing in minimal mode

  return null;
}
