"use client";
import { useEffect, useRef, useState } from "react";
import { useSpotify } from "./SpotifyProvider";

export default function PostPlayer({ uri, id }: { uri: string, id: string }) {
  const { api, registerController } = useSpotify();
  const playerRef = useRef<HTMLDivElement>(null);
  const [isSpinning, setIsSpinning] = useState(false);
  const isInitialized = useRef(false);

  useEffect(() => {
    // Basic conversion if user pasted a url instead of URI
    let formattedUri = uri;
    if (uri.includes("open.spotify.com")) {
      const match = uri.match(/(track|album|playlist|episode)\/([a-zA-Z0-9]+)/);
      if (match) {
        formattedUri = `spotify:${match[1]}:${match[2]}`;
      }
    }

    if (api && playerRef.current && !isInitialized.current && formattedUri) {
      isInitialized.current = true;
      const options = {
        uri: formattedUri,
        width: '100%',
        height: '80', // compact
      };
      
      const callback = (EmbedController: any) => {
        registerController(id, EmbedController);
        
        EmbedController.addListener('playback_update', (e: any) => {
          setIsSpinning(!e.data.isPaused);
        });
      };
      
      api.createController(playerRef.current, options, callback);
    }
  }, [api, registerController, uri, id]);

  if (!uri) return null;

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '15px', background: 'var(--yellow-base)', padding: '10px', borderRadius: '20px', border: '2px solid var(--yellow-warm)' }}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img 
        src="/assets/vinyl_record.png" 
        alt="vinyl" 
        className={isSpinning ? "spin-anim" : ""}
        style={{ width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover' }}
      />
      <div style={{ flex: 1, height: '80px', overflow: 'hidden', borderRadius: '12px' }}>
        <div ref={playerRef}></div>
      </div>
    </div>
  );
}
