'use client';
import { useEffect, useRef, useState, useCallback } from 'react';
import { SkipBack, SkipForward, Play, Pause, Music, Search, X, ListMusic, Repeat, Plus } from 'lucide-react';
import { useSpotify } from './SpotifyProvider';

interface CurrentTrack {
  name: string;
  artist: string;
  albumArt: string | null;
}

interface SearchResult {
  id: string;
  name: string;
  subtitle: string;
  uri: string;
  type: 'track' | 'playlist';
  image: string | null;
}

export default function GlobalPlayer() {
  const { token, playlists, registerDevice, registerGlobalPlayer, login } = useSpotify();
  const playerRef = useRef<any>(null);
  const deviceIdRef = useRef<string | null>(null);

  const [isPaused, setIsPaused] = useState(true);
  const [isReady, setIsReady] = useState(false);
  const [currentTrack, setCurrentTrack] = useState<CurrentTrack | null>(null);
  const [isPremiumError, setIsPremiumError] = useState(false);
  const [selectedPlaylistUri, setSelectedPlaylistUri] = useState('');
  const [repeatMode, setRepeatMode] = useState<'off' | 'context' | 'track'>('context'); // 기본값: context (반복재생)
  const previousTrackUriRef = useRef<string | null>(null);

  // Search state
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const searchTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Queue state - manually added tracks only
  const [queueTracks, setQueueTracks] = useState<SearchResult[]>([]);

  // Auto-select first playlist
  useEffect(() => {
    if (playlists.length > 0 && !selectedPlaylistUri) {
      setSelectedPlaylistUri(playlists[0].uri);
    }
  }, [playlists, selectedPlaylistUri]);

  // Set repeat mode when player is ready
  useEffect(() => {
    if (isReady && repeatMode === 'context') {
      setRepeat('context');
    }
  }, [isReady]); // eslint-disable-line react-hooks/exhaustive-deps


  // Load Web Playback SDK and create player
  useEffect(() => {
    if (!token) return;

    const initPlayer = () => {
      if (playerRef.current) return;

      const player = new (window as any).Spotify.Player({
        name: '비밀 일기장 플레이어 🎵',
        getOAuthToken: (cb: (token: string) => void) => {
          const t = localStorage.getItem('spotify_token_v2') || token;
          cb(t || '');
        },
        volume: 0.7,
      });

      player.addListener('ready', ({ device_id }: { device_id: string }) => {
        deviceIdRef.current = device_id;
        localStorage.setItem('spotify_device_id', device_id); // for PostPlayer access
        registerDevice(device_id);
        setIsReady(true);
      });

      player.addListener('not_ready', () => setIsReady(false));

      player.addListener('player_state_changed', (state: any) => {
        if (!state) return;
        setIsPaused(state.paused);
        const track = state.track_window?.current_track;
        if (track) {
          const currentUri = track.uri;

          // Check if track changed (not just paused/resumed)
          if (previousTrackUriRef.current && previousTrackUriRef.current !== currentUri) {
            // Track changed - remove first item from queue
            setQueueTracks(prev => prev.length > 0 ? prev.slice(1) : prev);
          }

          previousTrackUriRef.current = currentUri;

          setCurrentTrack({
            name: track.name,
            artist: track.artists?.map((a: any) => a.name).join(', ') || '',
            albumArt: track.album?.images?.[0]?.url || null,
          });
        }
      });

      player.addListener('initialization_error', () => setIsPremiumError(true));
      player.addListener('authentication_error', ({ message }: { message: string }) => {
        console.warn('SDK Authentication warning (non-fatal):', message);
      });
      player.addListener('account_error', () => setIsPremiumError(true));

      player.connect();
      playerRef.current = player;

      // Register pause fn so PostPlayer can pause us remotely
      registerGlobalPlayer(() => {
        player.pause?.();
        setIsPaused(true);
      });
    };

    if ((window as any).Spotify) {
      initPlayer();
    } else {
      (window as any).onSpotifyWebPlaybackSDKReady = initPlayer;
      if (!document.getElementById('spotify-sdk-script')) {
        const script = document.createElement('script');
        script.id = 'spotify-sdk-script';
        script.src = 'https://sdk.scdn.co/spotify-player.js';
        script.async = true;
        document.body.appendChild(script);
      }
    }

    return () => {
      if (playerRef.current) {
        playerRef.current.disconnect();
        playerRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  // Debounced search
  const handleSearchInput = useCallback((query: string) => {
    setSearchQuery(query);
    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }
    searchTimeout.current = setTimeout(async () => {
      setIsSearching(true);
      try {
        const t = localStorage.getItem('spotify_token_v2') || token;
        const res = await fetch(
          `https://api.spotify.com/v1/search?q=${encodeURIComponent(query)}&type=track,playlist&limit=8`,
          { headers: { Authorization: `Bearer ${t}` } }
        );
        const data = await res.json();
        const results: SearchResult[] = [];

        data.tracks?.items?.forEach((item: any) => {
          results.push({
            id: item.id,
            name: item.name,
            subtitle: item.artists?.map((a: any) => a.name).join(', '),
            uri: item.uri,
            type: 'track',
            image: item.album?.images?.[1]?.url || item.album?.images?.[0]?.url || null,
          });
        });

        data.playlists?.items?.filter(Boolean)?.forEach((item: any) => {
          results.push({
            id: item.id,
            name: item.name,
            subtitle: `플레이리스트 · ${item.tracks?.total ?? '?'}곡`,
            uri: item.uri,
            type: 'playlist',
            image: item.images?.[0]?.url || null,
          });
        });

        setSearchResults(results);
      } catch (err) {
        console.error('Search error:', err);
      } finally {
        setIsSearching(false);
      }
    }, 400);
  }, [token]);

  // Set repeat mode
  const setRepeat = async (mode: 'off' | 'context' | 'track') => {
    const t = localStorage.getItem('spotify_token_v2') || token;
    if (!t) return;

    try {
      await fetch(`https://api.spotify.com/v1/me/player/repeat?state=${mode}`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${t}` },
      });
      setRepeatMode(mode);
    } catch (err) {
      console.error('Failed to set repeat mode:', err);
    }
  };

  // Toggle repeat mode
  const toggleRepeat = () => {
    const nextMode = repeatMode === 'off' ? 'context' : repeatMode === 'context' ? 'track' : 'off';
    setRepeat(nextMode);
  };

  // Remove from local queue
  const removeFromQueue = (index: number) => {
    const confirmed = confirm('대기열에서 제거하시겠습니까?');
    if (!confirmed) return;

    setQueueTracks(prev => prev.filter((_, i) => i !== index));
  };

  // Add track to queue
  const addToQueue = async (uri: string, trackInfo: SearchResult) => {
    const t = localStorage.getItem('spotify_token_v2') || token;
    if (!t) return;

    try {
      // Check if there's a currently playing track
      const playbackRes = await fetch('https://api.spotify.com/v1/me/player', {
        headers: { Authorization: `Bearer ${t}` },
      });

      let isPlayingNow = false;

      // Handle empty response (204 No Content)
      if (playbackRes.status === 204 || playbackRes.status === 404) {
        isPlayingNow = false;
      } else if (playbackRes.ok) {
        const playbackData = await playbackRes.json();
        isPlayingNow = playbackData && playbackData.item && playbackData.is_playing;
      }

      if (!isPlayingNow && !currentTrack) {
        // No track playing, start playing this track immediately
        await fetch(`https://api.spotify.com/v1/me/player/play?device_id=${deviceIdRef.current}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${t}` },
          body: JSON.stringify({ uris: [uri] }),
        });
        alert('재생을 시작합니다!');
      } else {
        // Add to Spotify queue
        await fetch(`https://api.spotify.com/v1/me/player/queue?uri=${encodeURIComponent(uri)}`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${t}` },
        });

        // Add to local queue state
        setQueueTracks(prev => [...prev, trackInfo]);
        alert('대기열에 추가되었습니다!');
      }
    } catch (err) {
      console.error('Failed to add to queue:', err);
      alert('대기열 추가에 실패했습니다.');
    }
  };

  const playUri = async (uri: string, type: 'track' | 'playlist') => {
    if (!deviceIdRef.current) return;
    const t = localStorage.getItem('spotify_token_v2') || token;
    if (!t) return;

    const body = type === 'track'
      ? { uris: [uri] }
      : { context_uri: uri };

    await fetch(`https://api.spotify.com/v1/me/player/play?device_id=${deviceIdRef.current}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${t}` },
      body: JSON.stringify(body),
    });

    setShowSearch(false);
    setSearchQuery('');
    setSearchResults([]);
  };

  const togglePlay = async () => {
    if (!playerRef.current) return;
    if (isPaused && !currentTrack && selectedPlaylistUri) {
      const t = localStorage.getItem('spotify_token_v2') || token;
      await fetch(`https://api.spotify.com/v1/me/player/play?device_id=${deviceIdRef.current}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${t}` },
        body: JSON.stringify({ context_uri: selectedPlaylistUri }),
      });
    } else {
      playerRef.current.togglePlay();
    }
  };

  const skipPrev = () => playerRef.current?.previousTrack();
  const skipNext = () => {
    playerRef.current?.nextTrack();
    // Remove first item from queue when skipping
    if (queueTracks.length > 0) {
      setQueueTracks(prev => prev.slice(1));
    }
  };

  if (!token) {
    return (
      <div className="global-player-wrapper">
        <div className="global-player-container" style={{ justifyContent: 'center', gap: '10px', padding: '12px' }}>
          <Music size={20} strokeWidth={2} style={{ color: '#c07090' }} />
          <button
            onClick={login}
            className="cute-button"
            style={{
              padding: '8px 16px',
              fontSize: '0.85rem',
              background: 'linear-gradient(135deg, var(--yellow-warm), #FFB300)',
              border: '2px solid #FFB300',
              whiteSpace: 'nowrap'
            }}
          >
            Spotify 로그인
          </button>
        </div>
      </div>
    );
  }

  if (isPremiumError) {
    return (
      <div className="global-player-wrapper">
        <div className="global-player-container" style={{ justifyContent: 'center', fontSize: '0.8rem', color: '#aaa', padding: '12px' }}>
          <Music size={16} strokeWidth={2} style={{ marginRight: 6 }} />
          Spotify Premium이 필요합니다
        </div>
      </div>
    );
  }

  return (
    <div className="global-player-wrapper">
      {/* Search Panel */}
      {showSearch && (
        <div className="player-search-panel">
          <div className="player-search-input-row">
            <Search size={15} strokeWidth={2.5} className="player-search-icon" />
            <input
              type="text"
              className="player-search-input"
              placeholder="곡 또는 플레이리스트 검색..."
              value={searchQuery}
              onChange={e => handleSearchInput(e.target.value)}
              autoFocus
            />
            {searchQuery && (
              <button className="player-search-clear" onClick={() => { setSearchQuery(''); setSearchResults([]); }}>
                <X size={13} strokeWidth={2.5} />
              </button>
            )}
          </div>

          <div className="player-search-results">
            {isSearching && <p className="player-search-hint">검색 중...</p>}
            {!isSearching && searchQuery && searchResults.length === 0 && (
              <p className="player-search-hint">결과 없음</p>
            )}
            {searchResults.map(r => (
              <div key={r.id} className="player-search-result-item">
                {r.image
                  /* eslint-disable-next-line @next/next/no-img-element */
                  ? <img src={r.image} alt={r.name} className="player-result-thumb" />
                  : <div className="player-result-thumb player-result-thumb-empty">
                      {r.type === 'playlist' ? <ListMusic size={14} /> : <Music size={14} />}
                    </div>
                }
                <div className="player-result-info">
                  <span className="player-result-name">{r.name}</span>
                  <span className="player-result-sub">{r.subtitle}</span>
                </div>
                <div className="player-result-actions">
                  <button
                    className="player-result-action-btn play-btn"
                    onClick={() => playUri(r.uri, r.type)}
                    title="재생"
                  >
                    <Play size={13} strokeWidth={2.5} />
                  </button>
                  {r.type === 'track' && (
                    <button
                      className="player-result-action-btn queue-btn"
                      onClick={() => addToQueue(r.uri, r)}
                      title="대기열에 추가"
                    >
                      <Plus size={13} strokeWidth={2.5} />
                    </button>
                  )}
                </div>
              </div>
            ))}

            {/* My playlists section (when no search typed) */}
            {!searchQuery && playlists.length > 0 && (
              <>
                <p className="player-search-hint" style={{ marginBottom: 4 }}>내 플레이리스트</p>
                {playlists.map(p => (
                  <div key={p.id} className="player-search-result-item">
                    <div className="player-result-thumb player-result-thumb-empty">
                      <ListMusic size={14} />
                    </div>
                    <div className="player-result-info">
                      <span className="player-result-name">{p.name}</span>
                      <span className="player-result-sub">플레이리스트</span>
                    </div>
                    <div className="player-result-actions">
                      <button
                        className="player-result-action-btn play-btn"
                        onClick={() => playUri(p.uri, 'playlist')}
                        title="재생"
                      >
                        <Play size={13} strokeWidth={2.5} />
                      </button>
                    </div>
                  </div>
                ))}
              </>
            )}

            {/* Queue section (when no search typed) */}
            {!searchQuery && (
              <>
                <p className="player-search-hint" style={{ marginBottom: 4, marginTop: 12 }}>현재 대기열 곡 목록</p>
                {queueTracks.length === 0 ? (
                  <p className="player-search-hint" style={{ padding: '20px 0', color: '#999' }}>대기열이 없습니다!</p>
                ) : (
                  queueTracks.map((track, index) => (
                    <div key={track.id + index} className="player-search-result-item queue-item">
                      <span className="queue-number">{index + 1}</span>
                      {track.image
                        /* eslint-disable-next-line @next/next/no-img-element */
                        ? <img src={track.image} alt={track.name} className="player-result-thumb" />
                        : <div className="player-result-thumb player-result-thumb-empty">
                            <Music size={14} />
                          </div>
                      }
                      <div className="player-result-info">
                        <span className="player-result-name">{track.name}</span>
                        <span className="player-result-sub">{track.subtitle}</span>
                      </div>
                      <button
                        className="queue-remove-btn"
                        onClick={() => removeFromQueue(index)}
                        title="대기열에서 제거"
                      >
                        <X size={14} strokeWidth={2.5} />
                      </button>
                    </div>
                  ))
                )}
              </>
            )}
          </div>
        </div>
      )}

      {/* Main player bar */}
      <div className="global-player-container">
        {/* Vinyl */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/assets/vinyl_v6.png" alt="vinyl" className={`vinyl-image ${isPaused ? '' : 'spinning'}`} />

        <button onClick={skipPrev} className="player-control-button prev-button" title="이전 곡" disabled={!isReady}>
          <SkipBack size={20} strokeWidth={3} />
        </button>

        <button onClick={togglePlay} className="player-control-button play-button" title={isPaused ? '재생' : '일시정지'} disabled={!isReady && playlists.length === 0}>
          {isPaused ? <Play size={22} strokeWidth={2.5} /> : <Pause size={22} strokeWidth={2.5} />}
        </button>

        {/* Track info */}
        <div className="player-track-info" style={{ cursor: 'pointer' }} onClick={() => setShowSearch(s => !s)}>
          {currentTrack ? (
            <>
              <span className="player-track-name">{currentTrack.name}</span>
              <span className="player-artist-name">{currentTrack.artist}</span>
            </>
          ) : (
            <span className="player-track-name" style={{ color: '#aaa', fontSize: '0.75rem' }}>
              {isReady ? '곡 검색하기 🔍' : '연결 중...'}
            </span>
          )}
        </div>

        {/* Search toggle */}
        <button
          onClick={() => setShowSearch(s => !s)}
          className="player-control-button"
          title={showSearch ? '닫기' : '검색'}
          style={{ color: showSearch ? 'var(--point-color, #f4a0c0)' : undefined }}
        >
          {showSearch ? <X size={18} strokeWidth={2.5} /> : <Search size={18} strokeWidth={2.5} />}
        </button>

        <button onClick={skipNext} className="player-control-button next-button" title="다음 곡" disabled={!isReady}>
          <SkipForward size={20} strokeWidth={3} />
        </button>

        {/* Repeat button */}
        <button
          onClick={toggleRepeat}
          className="player-control-button repeat-button"
          title={repeatMode === 'off' ? '반복 끄기' : repeatMode === 'context' ? '전체 반복' : '한 곡 반복'}
          disabled={!isReady}
          style={{
            color: repeatMode !== 'off' ? 'var(--point-color, #f4a0c0)' : undefined,
            opacity: repeatMode === 'off' ? 0.5 : 1,
          }}
        >
          <Repeat size={18} strokeWidth={2.5} />
          {repeatMode === 'track' && (
            <span style={{ position: 'absolute', fontSize: '0.6rem', fontWeight: 'bold', top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }}>1</span>
          )}
        </button>
      </div>
    </div>
  );
}
