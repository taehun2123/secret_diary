'use client';
import { useEffect, useRef, useState } from 'react';
import { useSpotify } from './SpotifyProvider';

export default function GlobalPlayer() {
  const { api, token, registerController, playlists } = useSpotify();
  const playerRef = useRef<HTMLDivElement>(null);
  const controllerRef = useRef<any>(null);
  
  const [selectedUri, setSelectedUri] = useState<string>('');
  const [isPaused, setIsPaused] = useState(true);
  const [trackName, setTrackName] = useState('');
  const [artistName, setArtistName] = useState('');

  useEffect(() => {
    if (playlists.length > 0 && !selectedUri) {
      setSelectedUri(playlists[0].uri);
    }
  }, [playlists, selectedUri]);

  useEffect(() => {
    if (api && playerRef.current && selectedUri) {
      if (!controllerRef.current && playerRef.current.childElementCount === 0) {
        // Create an inner div that Spotify can safely destroy and replace without angering React
        const innerTarget = document.createElement('div');
        playerRef.current.appendChild(innerTarget);

        const options = {
          uri: selectedUri,
          width: '100%',
          height: '80',
        };
        
        console.log("Injecting Spotify Iframe API");
        api.createController(innerTarget, options, (EmbedController: any) => {
          controllerRef.current = EmbedController;
          registerController('global', EmbedController);

          EmbedController.addListener('playback_update', (e: any) => {
            setIsPaused(e.data.isPaused);
            if (e.data.track && e.data.track.name) {
               setTrackName(e.data.track.name);
               if (e.data.track.artists && e.data.track.artists.length > 0) {
                  setArtistName(e.data.track.artists.map((a: any) => a.name).join(', '));
               }
            }
          });
        });
      } else if (controllerRef.current) {
        controllerRef.current.loadUri(selectedUri);
      }
    }
  }, [api, registerController, selectedUri]);

  const skipPrev = async () => {
    if (token) {
      await fetch("https://api.spotify.com/v1/me/player/previous", {
        method: "POST", headers: { Authorization: `Bearer ${token}` }
      });
    }
  };

  const skipNext = async () => {
    if (token) {
      await fetch("https://api.spotify.com/v1/me/player/next", {
        method: "POST", headers: { Authorization: `Bearer ${token}` }
      });
    }
  };

  if (!token) return null;

  return (
    <div style={{ position: 'fixed', bottom: 20, right: 20, zIndex: 9999, display: 'flex', flexDirection: 'column', gap: '10px', alignItems: 'flex-end' }}>
      
      {playlists.length > 0 && (
        <select 
          className="cute-input" 
          style={{ fontSize: '0.85rem', padding: '6px 12px', width: '300px', background: 'var(--white-sub)', opacity: 0.95 }}
          value={selectedUri}
          onChange={(e) => setSelectedUri(e.target.value)}
        >
          {playlists.map(p => (
            <option key={p.id} value={p.uri}>{p.name}</option>
          ))}
        </select>
      )}

      {/* Premium Hybrid Player Interface */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '15px', background: 'var(--white-sub)', padding: '10px 15px', borderRadius: '40px', boxShadow: '0 6px 20px var(--shadow-color)', border: '3px solid var(--yellow-warm)' }}>
        
        {/* Vinyl Image (V4 Anime) */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img 
          src="/assets/vinyl_v4.png" 
          alt="vinyl" 
          style={{ 
            width: '80px', height: '80px', borderRadius: '50%', objectFit: 'cover',
            animation: isPaused ? 'none' : 'spin 4s linear infinite', border: '3px solid #FFF59D', backgroundColor: '#fff',
            mixBlendMode: 'multiply'
          }}
        />

        {/* Previous Button (Via Premium Remote API) */}
        <button onClick={skipPrev} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.8rem', padding: 0, color: 'var(--yellow-warm)', transition: 'transform 0.1s' }} onMouseDown={e => e.currentTarget.style.transform='scale(0.8)'} onMouseUp={e => e.currentTarget.style.transform='scale(1)'} title="이전 음악">
          ⏮
        </button>
        
        {/* Native Compact Spotify Iframe (Visible and Clickable! Resolves browser autoplay blocks natively) */}
        <div style={{ width: '300px', height: '80px', overflow: 'hidden', borderRadius: '12px', background: '#f0f0f0' }}>
          <div ref={playerRef}></div>
        </div>

        {/* Next Button (Via Premium Remote API) */}
        <button onClick={skipNext} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.8rem', padding: 0, color: 'var(--yellow-warm)', transition: 'transform 0.1s' }} onMouseDown={e => e.currentTarget.style.transform='scale(0.8)'} onMouseUp={e => e.currentTarget.style.transform='scale(1)'} title="음악 건너뛰기">
          ⏭
        </button>

      </div>
    </div>
  );
}
