"use client";
import { useEffect, useRef, useState, useCallback } from "react";
import { Play, Pause, SkipBack, SkipForward, Music, X, ChevronDown, ChevronUp } from "lucide-react";
import { useSpotify } from "./SpotifyProvider";

interface AttachedTrack {
  uri: string;
  name: string;
  artist: string;
}

export default function PostPlayer({
  musicJson,
  id,
}: {
  musicJson: string | null;
  id: string;
}) {
  const { token, pauseGlobal, login } = useSpotify();

  const [tracks, setTracks] = useState<AttachedTrack[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showList, setShowList] = useState(false);

  // Parse attached tracks from JSON or legacy single URI
  useEffect(() => {
    if (!musicJson) { setTracks([]); return; }
    try {
      const parsed = JSON.parse(musicJson);
      if (Array.isArray(parsed)) {
        // New format: [{uri, name, artist}, ...]
        setTracks(parsed);
      } else if (typeof parsed === 'string') {
        setTracks([{ uri: parsed, name: '첨부된 음악', artist: '' }]);
      }
    } catch {
      // Legacy: plain URI string
      if (musicJson.startsWith('spotify:')) {
        setTracks([{ uri: musicJson, name: '첨부된 음악', artist: '' }]);
      }
    }
  }, [musicJson]);

  const playTrackAt = useCallback(async (index: number) => {
    if (!tracks[index]) return;

    if (!token) {
      const confirmed = confirm('Spotify에 로그인하시겠습니까?');
      if (confirmed) {
        login();
      }
      return;
    }

    const t = localStorage.getItem('spotify_token_v2') || token;
    const deviceId = localStorage.getItem('spotify_device_id');
    if (!deviceId) {
      alert('Spotify SDK 디바이스가 준비되지 않았습니다. 잠시 후 다시 시도해 주세요.');
      return;
    }

    await fetch(`https://api.spotify.com/v1/me/player/play?device_id=${deviceId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${t}` },
      body: JSON.stringify({ uris: [tracks[index].uri] }),
    });

    setCurrentIndex(index);
    setIsPlaying(true);
    pauseGlobal(); // Pause the GlobalPlayer when post player plays
  }, [token, tracks, pauseGlobal, login]);

  const handlePause = async () => {
    const t = localStorage.getItem('spotify_token_v2') || token;
    if (!t) return;
    await fetch('https://api.spotify.com/v1/me/player/pause', {
      method: 'PUT',
      headers: { Authorization: `Bearer ${t}` },
    });
    setIsPlaying(false);
  };

  const handleToggle = () => {
    if (isPlaying) handlePause();
    else playTrackAt(currentIndex);
  };

  const handlePrev = () => {
    const next = Math.max(0, currentIndex - 1);
    playTrackAt(next);
  };

  const handleNext = () => {
    const next = Math.min(tracks.length - 1, currentIndex + 1);
    playTrackAt(next);
  };

  if (!musicJson || tracks.length === 0) return null;

  const current = tracks[currentIndex];

  return (
    <div className="post-player-container">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/assets/vinyl_v6.png"
        alt="vinyl"
        className={`post-player-vinyl ${isPlaying ? "spin-anim" : ""}`}
      />

      <div className="post-player-embed">
        {/* Track Info */}
        <div className="post-player-info">
          <span className="post-player-track-name">{current?.name || '음악'}</span>
          {current?.artist && <span className="post-player-artist">{current.artist}</span>}
        </div>

        {/* Controls */}
        <div className="post-player-controls">
          {tracks.length > 1 && (
            <button
              className="post-player-ctrl-btn"
              onClick={handlePrev}
              disabled={currentIndex === 0}
              title="이전 곡"
            >
              <SkipBack size={14} strokeWidth={2.5} />
            </button>
          )}

          <button
            onClick={handleToggle}
            className="post-player-play-btn"
            title={isPlaying ? '일시정지' : '재생'}
          >
            {isPlaying ? <Pause size={18} strokeWidth={2.5} /> : <Play size={18} strokeWidth={2.5} />}
          </button>

          {tracks.length > 1 && (
            <button
              className="post-player-ctrl-btn"
              onClick={handleNext}
              disabled={currentIndex === tracks.length - 1}
              title="다음 곡"
            >
              <SkipForward size={14} strokeWidth={2.5} />
            </button>
          )}

          {tracks.length > 1 && (
            <button
              className="post-player-ctrl-btn"
              onClick={() => setShowList(s => !s)}
              title="곡 목록"
            >
              {showList ? <ChevronUp size={14} strokeWidth={2.5} /> : <ChevronDown size={14} strokeWidth={2.5} />}
              <span style={{ fontSize: '0.7rem', marginLeft: 2 }}>{currentIndex + 1}/{tracks.length}</span>
            </button>
          )}
        </div>

      </div>

      {/* Track list modal */}
      {showList && tracks.length > 1 && (
        <div className="post-player-modal-overlay" onClick={() => setShowList(false)}>
          <div className="post-player-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="post-player-modal-header">
              <h3 className="post-player-modal-title">첨부된 곡 목록</h3>
              <button
                className="post-player-modal-close"
                onClick={() => setShowList(false)}
                title="닫기"
              >
                <X size={20} strokeWidth={2.5} />
              </button>
            </div>
            <div className="post-player-tracklist">
              {tracks.map((t, i) => (
                <button
                  key={t.uri + i}
                  className={`post-player-track-item ${i === currentIndex ? 'active' : ''}`}
                  onClick={() => {
                    playTrackAt(i);
                    setShowList(false);
                  }}
                >
                  {i === currentIndex && isPlaying
                    ? <Pause size={14} strokeWidth={2.5} />
                    : <Play size={14} strokeWidth={2.5} />
                  }
                  <div className="post-player-track-item-info">
                    <span className="post-player-track-item-name">{t.name}</span>
                    {t.artist && <span className="post-player-track-item-artist">{t.artist}</span>}
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
