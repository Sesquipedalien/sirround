"use client";

import { useState } from "react";
import { Upload, Music } from "lucide-react";
import EC3Player from "../components/EC3Player";

type AudioFile = {
  url: string;
  name: string;
  format: string;
};

const demoFiles: AudioFile[] = [
  {
    url: "https://sirround.me/thrawn1-ec3.mkv",
    name: "Star Wars: Thrawn Ascendancy",
    format: "EC-3",
  },
];

export default function AudioDemosPage() {
  const [currentFile, setCurrentFile] = useState<AudioFile | null>(null);
  const [customUrl, setCustomUrl] = useState("");

  const handleLoadCustomUrl = () => {
    if (customUrl.trim()) {
      setCurrentFile({
        url: customUrl.trim(),
        name: "Custom File",
        format: customUrl.endsWith(".m3u8") ? "HLS" : "EC-3/MP4",
      });
    }
  };

  return (
    <section className="max-w-5xl space-y-8">
      {/* Header */}
      <div>
        <div className="mb-4 flex items-center gap-3">
          <Music className="h-10 w-10 text-blue-500" />
          <h1 className="text-4xl font-bold">Spatial Audio Demos</h1>
        </div>
        <p className="text-lg text-zinc-400">
          Stream EC-3 (Enhanced AC-3) and MP4 audio files with Dolby Atmos support
        </p>
      </div>

      {/* Custom URL Input */}
      <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-6">
        <h2 className="mb-4 text-xl font-semibold">Load Audio File</h2>
        <div className="flex gap-3">
          <input
            type="text"
            value={customUrl}
            onChange={(e) => setCustomUrl(e.target.value)}
            placeholder="Enter direct URL to .m3u8, .mp4, or .mkv file"
            className="flex-1 rounded border border-zinc-700 bg-zinc-800 px-4 py-2 text-white placeholder-zinc-500 focus:border-blue-500 focus:outline-none"
            onKeyDown={(e) => e.key === "Enter" && handleLoadCustomUrl()}
          />
          <button
            onClick={handleLoadCustomUrl}
            className="flex items-center gap-2 rounded bg-blue-600 px-6 py-2 font-medium transition-colors hover:bg-blue-700"
          >
            <Upload className="h-4 w-4" />
            Load
          </button>
        </div>
        <p className="mt-3 text-xs text-zinc-500">
          Supports: HLS streams (.m3u8), MP4 files with EC-3 audio, MKV containers with Dolby Digital Plus
        </p>
      </div>

      {/* Demo Files */}
      <div>
        <h2 className="mb-4 text-2xl font-semibold">Demo Files</h2>
        <div className="space-y-3">
          {demoFiles.map((file, index) => (
            <button
              key={index}
              onClick={() => setCurrentFile(file)}
              className="w-full rounded-lg border border-zinc-800 bg-zinc-900/30 p-4 text-left transition-colors hover:border-zinc-700 hover:bg-zinc-900/50"
            >
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium">{file.name}</div>
                  <div className="text-sm text-zinc-500">Click to load</div>
                </div>
                <span className="rounded bg-zinc-800 px-2 py-1 text-xs font-mono text-zinc-400">
                  {file.format}
                </span>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Player */}
      {currentFile && (
        <div>
          <h2 className="mb-4 text-2xl font-semibold">Now Playing</h2>
          <EC3Player
            src={currentFile.url}
            title={currentFile.name}
            format={currentFile.format}
            onError={(error) => console.error("Player error:", error)}
          />
        </div>
      )}

      {/* Info Section */}
      <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-6">
        <h2 className="mb-3 text-xl font-semibold">About EC-3 Format</h2>
        <div className="space-y-2 text-sm text-zinc-400">
          <p>
            <strong className="text-zinc-200">Enhanced AC-3 (EC-3)</strong>, also known as Dolby
            Digital Plus, is an advanced audio codec supporting:
          </p>
          <ul className="ml-6 list-disc space-y-1">
            <li>Up to 7.1 channels of surround sound</li>
            <li>Dolby Atmos object-based audio (via JOC extension)</li>
            <li>Higher bitrates and better compression than standard AC-3</li>
            <li>Spatial audio metadata for immersive playback</li>
          </ul>
          <p className="mt-4">
            <strong className="text-zinc-200">Playback Requirements:</strong>
          </p>
          <ul className="ml-6 list-disc space-y-1">
            <li>Modern browser with HLS support (Safari, Chrome, Firefox)</li>
            <li>Headphones or surround sound system for spatial audio</li>
            <li>For Dolby Atmos: Compatible hardware or virtual surround processing</li>
          </ul>
        </div>
      </div>
    </section>
  );
}
