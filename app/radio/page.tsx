"use client";

import { useState, useEffect } from 'react';

const STREAM_URL = 'https://stream.tribalradio.com/live.mp3';

export default function RadioPage() {
  const [sound, setSound] = useState<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>("");

  useEffect(() => {
    return () => {
      if (sound) {
        sound.pause();
        sound.src = '';
      }
    };
  }, [sound]);

  async function playSound() {
    setIsLoading(true);
    setError("");
    try {
      if (sound && isPlaying) {
        sound.pause();
        setIsPlaying(false);
        setIsLoading(false);
        return;
      }

      const audio = sound || new Audio();
      audio.src = STREAM_URL;
      audio.crossOrigin = "anonymous";
      
      await audio.play();
      setSound(audio);
      setIsPlaying(true);
    } catch (err) {
      console.error('Error playing sound:', err);
      setError('Unable to connect to stream');
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-black to-blue-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo/Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">
            Tribal Productions Radio
          </h1>
          <p className="text-purple-300">Live Streaming</p>
        </div>

        {/* Player Card */}
        <div className="bg-black/40 backdrop-blur-lg rounded-3xl p-8 shadow-2xl border border-purple-500/20">
          {/* Album Art Placeholder */}
          <div className="w-full aspect-square bg-gradient-to-br from-purple-600 to-blue-600 rounded-2xl mb-6 flex items-center justify-center shadow-lg">
            <div className="text-6xl">🎵</div>
          </div>

          {/* Now Playing */}
          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold text-white mb-1">
              {isPlaying ? 'Now Playing' : 'Tribal Radio'}
            </h2>
            <p className="text-purple-300">
              {isPlaying ? 'Live Stream' : 'Press play to start'}
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-4 p-3 bg-red-500/20 border border-red-500/50 rounded-lg text-red-200 text-sm text-center">
              {error}
            </div>
          )}

          {/* Play Button */}
          <button
            onClick={playSound}
            disabled={isLoading}
            className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 disabled:from-gray-600 disabled:to-gray-700 text-white font-bold py-6 px-8 rounded-2xl transition-all duration-300 transform hover:scale-105 active:scale-95 shadow-lg disabled:cursor-not-allowed flex items-center justify-center gap-3"
          >
            {isLoading ? (
              <>
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
                <span>Connecting...</span>
              </>
            ) : isPlaying ? (
              <>
                <span className="text-2xl">⏸</span>
                <span>Pause</span>
              </>
            ) : (
              <>
                <span className="text-2xl">▶</span>
                <span>Play Live</span>
              </>
            )}
          </button>

          {/* Status Indicator */}
          <div className="mt-6 flex items-center justify-center gap-2">
            <div className={`w-2 h-2 rounded-full ${isPlaying ? 'bg-green-500 animate-pulse' : 'bg-gray-500'}`}></div>
            <span className="text-sm text-gray-400">
              {isPlaying ? 'Live' : 'Offline'}
            </span>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-6 text-purple-300 text-sm">
          <p>© 2024 Tribal Productions Radio Inc.</p>
        </div>
      </div>
    </div>
  );
}
