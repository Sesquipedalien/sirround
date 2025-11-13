"use client";

import { useEffect, useRef, useState } from "react";
import { Play, Pause, Volume2, VolumeX, Loader2 } from "lucide-react";

type EC3PlayerProps = {
  src: string;
  title?: string;
  format?: string;
  onError?: (error: string) => void;
};

export default function EC3Player({ src, title, format, onError }: EC3PlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>("");
  const hlsRef = useRef<any>(null);

  // Setup video player with HLS.js or native support
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !src) return;

    setLoading(true);
    setError("");

    const cleanup = () => {
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
    };

    // Check if source is HLS
    const isHLS = src.endsWith(".m3u8");

    // Check for native HLS support (Safari, iOS)
    const canPlayNative = video.canPlayType("application/vnd.apple.mpegurl");

    if (isHLS && canPlayNative) {
      // Native HLS support
      video.src = src;
      setLoading(false);
    } else if (isHLS) {
      // Use HLS.js for browsers without native support
      const loadHls = async () => {
        try {
          const Hls = (await import("hls.js")).default;

          if (Hls.isSupported()) {
            const hls = new Hls({
              enableWorker: true,
              lowLatencyMode: false,
            });

            hlsRef.current = hls;
            hls.loadSource(src);
            hls.attachMedia(video);

            hls.on(Hls.Events.MANIFEST_PARSED, () => {
              setLoading(false);
            });

            hls.on(Hls.Events.ERROR, (event, data) => {
              if (data.fatal) {
                const errorMsg = `HLS error: ${data.type} - ${data.details}`;
                setError(errorMsg);
                setLoading(false);
                onError?.(errorMsg);
              }
            });
          } else {
            const errorMsg = "HLS is not supported in this browser";
            setError(errorMsg);
            setLoading(false);
            onError?.(errorMsg);
          }
        } catch (err) {
          const errorMsg = "Failed to load HLS.js library";
          setError(errorMsg);
          setLoading(false);
          onError?.(errorMsg);
        }
      };

      loadHls();
    } else {
      // Direct MP4/EC3 playback
      video.src = src;
      setLoading(false);
    }

    // Event listeners
    const handleLoadedMetadata = () => {
      setDuration(video.duration);
    };

    const handleTimeUpdate = () => {
      setCurrentTime(video.currentTime);
    };

    const handleEnded = () => {
      setIsPlaying(false);
    };

    const handleError = () => {
      const errorMsg = "Failed to load media";
      setError(errorMsg);
      setLoading(false);
      onError?.(errorMsg);
    };

    video.addEventListener("loadedmetadata", handleLoadedMetadata);
    video.addEventListener("timeupdate", handleTimeUpdate);
    video.addEventListener("ended", handleEnded);
    video.addEventListener("error", handleError);

    return () => {
      cleanup();
      video.removeEventListener("loadedmetadata", handleLoadedMetadata);
      video.removeEventListener("timeupdate", handleTimeUpdate);
      video.removeEventListener("ended", handleEnded);
      video.removeEventListener("error", handleError);
    };
  }, [src, onError]);

  const togglePlayPause = () => {
    const video = videoRef.current;
    if (!video) return;

    if (isPlaying) {
      video.pause();
    } else {
      video.play();
    }
    setIsPlaying(!isPlaying);
  };

  const toggleMute = () => {
    const video = videoRef.current;
    if (!video) return;

    video.muted = !isMuted;
    setIsMuted(!isMuted);
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const video = videoRef.current;
    if (!video) return;

    const newVolume = parseFloat(e.target.value);
    video.volume = newVolume;
    setVolume(newVolume);
    setIsMuted(newVolume === 0);
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const video = videoRef.current;
    if (!video) return;

    const newTime = parseFloat(e.target.value);
    video.currentTime = newTime;
    setCurrentTime(newTime);
  };

  const formatTime = (seconds: number) => {
    if (isNaN(seconds)) return "0:00";
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  if (error) {
    return (
      <div className="w-full rounded-lg border border-red-700 bg-red-950/40 p-6">
        {title && <h3 className="mb-2 text-lg font-semibold text-red-200">{title}</h3>}
        <div className="text-sm text-red-300">
          <strong>Error:</strong> {error}
        </div>
      </div>
    );
  }

  return (
    <div className="w-full rounded-lg border border-zinc-700 bg-zinc-900 p-6">
      {title && (
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold">{title}</h3>
          {format && (
            <span className="rounded bg-zinc-800 px-2 py-1 text-xs font-mono text-zinc-400">
              {format}
            </span>
          )}
        </div>
      )}

      {/* Hidden video element for audio playback */}
      <video
        ref={videoRef}
        className="hidden"
        playsInline
      />

      {/* Custom Controls */}
      <div className="space-y-4">
        {/* Progress Bar */}
        <div className="space-y-1">
          <input
            type="range"
            min="0"
            max={duration || 0}
            value={currentTime}
            onChange={handleSeek}
            disabled={loading}
            className="w-full cursor-pointer"
          />
          <div className="flex justify-between text-xs text-zinc-400">
            <span>{formatTime(currentTime)}</span>
            <span>{formatTime(duration)}</span>
          </div>
        </div>

        {/* Control Buttons */}
        <div className="flex items-center gap-4">
          <button
            onClick={togglePlayPause}
            disabled={loading}
            className="rounded-full bg-blue-600 p-3 text-white transition-colors hover:bg-blue-700 disabled:opacity-50"
            aria-label={isPlaying ? "Pause" : "Play"}
          >
            {loading ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : isPlaying ? (
              <Pause className="h-5 w-5" />
            ) : (
              <Play className="h-5 w-5" />
            )}
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={toggleMute}
              disabled={loading}
              className="text-zinc-400 transition-colors hover:text-white disabled:opacity-50"
              aria-label={isMuted ? "Unmute" : "Mute"}
            >
              {isMuted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
            </button>
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={isMuted ? 0 : volume}
              onChange={handleVolumeChange}
              disabled={loading}
              className="w-24 cursor-pointer"
            />
          </div>
        </div>
      </div>

      <div className="mt-4 text-xs text-zinc-500">
        Enhanced AC-3 (Dolby Digital Plus) • Spatial Audio Support
      </div>
    </div>
  );
}
