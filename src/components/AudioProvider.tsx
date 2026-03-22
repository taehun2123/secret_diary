"use client";

import { useEffect, useRef, useState, createContext, useContext } from "react";

const AudioContext = createContext<{
  isPlaying: boolean;
  play: () => void;
  pause: () => void;
  toggle: () => void;
} | null>(null);

export const useAudio = () => {
  const context = useContext(AudioContext);
  if (!context) throw new Error("useAudio must be used within AudioProvider");
  return context;
};

export default function AudioProvider({ children }: { children: React.ReactNode }) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    // Create audio element only on client side
    const audio = new Audio("/assets/bgm.mp3");
    audio.loop = true;
    audioRef.current = audio;

    return () => {
      audio.pause();
      audioRef.current = null;
    };
  }, []);

  const play = () => {
    if (audioRef.current) {
      audioRef.current.play().catch(e => console.error("Audio playback failed", e));
      setIsPlaying(true);
    }
  };

  const pause = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      setIsPlaying(false);
    }
  };

  const toggle = () => {
    if (isPlaying) pause();
    else play();
  };

  return (
    <AudioContext.Provider value={{ isPlaying, play, pause, toggle }}>
      {children}
      {/* Floating Audio Controls */}
      {isPlaying && (
        <button 
          onClick={toggle}
          style={{
            position: 'fixed',
            bottom: '20px',
            right: '20px',
            background: 'var(--white-sub)',
            border: '2px solid var(--yellow-warm)',
            borderRadius: '50%',
            width: '50px',
            height: '50px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 8px var(--shadow-color)',
            cursor: 'pointer',
            zIndex: 9999,
          }}
          aria-label="Pause Music"
        >
          🎵
        </button>
      )}
    </AudioContext.Provider>
  );
}
