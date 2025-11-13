"use client";
import { useEffect, useMemo, useRef, useState } from "react";

type Props = {
  src: string;
  apiBase?: string;
  autoplay?: boolean;
};

export default function InlineAudio({ src, apiBase = process.env.NEXT_PUBLIC_API_BASE || "", autoplay = true }: Props) {
  const [m3u8, setM3u8] = useState<string>("");
  const [error, setError] = useState<string>("");
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const normalizedApi = useMemo(() => (apiBase || "").replace(/\/$/, ""), [apiBase]);
  const encodedSrc = useMemo(() => encodeURI(src.trim()), [src]);

  useEffect(() => {
    let cancelled = false;
    setError("");
    setM3u8("");
    const go = async () => {
      if (!normalizedApi) { setError("API_BASE missing"); return; }
      const url = `${normalizedApi}/api/hls/package-ec3?src=${encodeURIComponent(encodedSrc)}`;
      const r = await fetch(url);
      if (!r.ok) { setError(`package failed: ${r.status}`); return; }
      const j = await r.json();
      if (!cancelled) setM3u8(j?.hls || j?.viz || "");
    };
    go();
    return () => { cancelled = true; };
  }, [normalizedApi, encodedSrc]);

  useEffect(() => {
    const audio = audioRef.current as any;
    if (!audio || !m3u8) return;
    const canNative = audio.canPlayType && audio.canPlayType("application/vnd.apple.mpegurl");
    if (canNative) {
      audio.src = m3u8;
      if (autoplay) audio.play?.().catch?.(() => {});
      return;
    }
    let destroyed = false;
    const useHls = (Hls: any) => {
      if (destroyed) return;
      if (Hls && Hls.isSupported && Hls.isSupported()) {
        const hls = new Hls({ enableWorker: true, lowLatencyMode: false });
        hls.loadSource(m3u8);
        hls.attachMedia(audio);
    };
    
    media.addEventListener('canplay', handleCanPlay);
    media.addEventListener('error', handleError);
    
    return () => {
      media.removeEventListener('canplay', handleCanPlay);
      media.removeEventListener('error', handleError);
    };
  }, [src, autoplay]);

  if (error) {
    return (
      <div className="rounded border border-red-700 bg-red-950/40 p-3 text-sm text-red-200">
        {error}
      </div>
    );
  }

  return (
    <div className="w-full rounded border border-zinc-800 bg-zinc-900 p-4">
      <video
        ref={mediaRef}
        controls
        className="w-full"
        style={{ maxHeight: '80px' }}
      />
    </div>
  );
}
