"use client";
import { createContext, useContext, useEffect, useState, useRef } from "react";
import { useRouter, usePathname } from "next/navigation";

interface Playlist {
  id: string;
  name: string;
  uri: string;
}

interface Track {
  id: string;
  name: string;
  artists: string;
  uri: string;
  album: string;
}

interface SpotifyContextType {
  api: any;
  token: string | null;
  deviceId: string | null;
  playlists: Playlist[];
  tracks: Track[];
  loadingTracks: boolean;
  error: string | null;
  registerController: (id: string, controller: any) => void;
  playController: (id: string) => void;
  login: () => void;
  fetchPlaylistTracks: (playlistId: string) => Promise<void>;
  clearError: () => void;
  playTrack: (uri: string) => Promise<void>;
  registerDevice: (id: string) => void;
  pauseGlobal: () => void;
  registerGlobalPlayer: (pauseFn: () => void) => void;
}

export const SpotifyContext = createContext<SpotifyContextType>({
  api: null,
  token: null,
  deviceId: null,
  playlists: [],
  tracks: [],
  loadingTracks: false,
  error: null,
  registerController: () => {},
  playController: () => {},
  login: () => {},
  fetchPlaylistTracks: async () => {},
  clearError: () => {},
  playTrack: async () => {},
  registerDevice: () => {},
  pauseGlobal: () => {},
  registerGlobalPlayer: () => {},
});

export const useSpotify = () => useContext(SpotifyContext);

const generateRandomString = (length: number) => {
  const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  const values = crypto.getRandomValues(new Uint8Array(length));
  return values.reduce((acc, x) => acc + possible[x % possible.length], "");
};

const sha256 = async (plain: string) => {
  const encoder = new TextEncoder();
  const data = encoder.encode(plain);
  return window.crypto.subtle.digest('SHA-256', data);
};

const base64encode = (input: ArrayBuffer) => {
  return btoa(String.fromCharCode(...new Uint8Array(input)))
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
};

// Cache duration in milliseconds (30 minutes)
const CACHE_DURATION = 30 * 60 * 1000;

interface CacheData<T> {
  data: T;
  timestamp: number;
}

export default function SpotifyProvider({ children }: { children: React.ReactNode }) {
  const [api, setApi] = useState<any>(null);
  const [token, setToken] = useState<string | null>(null);
  const [deviceId, setDeviceId] = useState<string | null>(null);
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const globalPauseFn = useRef<(() => void) | null>(null);
  const [tracks, setTracks] = useState<Track[]>([]);
  const [loadingTracks, setLoadingTracks] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const controllers = useRef<{ [id: string]: any }>({});
  const activeId = useRef<string | null>(null);
  const isCodeExchanging = useRef(false);
  const tracksCache = useRef<Map<string, CacheData<Track[]>>>(new Map());
  const inflightRequests = useRef<Map<string, Promise<void>>>(new Map());
  const router = useRouter();
  const pathname = usePathname();

  const clearError = () => setError(null);

  useEffect(() => {
    // Parse token code from Query (PKCE Flow)
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');

    if (code && !isCodeExchanging.current) {
      isCodeExchanging.current = true;
      // Clean up URL parameters safely matching Next App Router conventions
      router.replace(pathname);
      
      const codeVerifier = localStorage.getItem('code_verifier');
      if (codeVerifier) {
        fetch("https://accounts.spotify.com/api/token", {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: new URLSearchParams({
            client_id: process.env.NEXT_PUBLIC_SPOTIFY_CLIENT_ID || "",
            grant_type: 'authorization_code',
            code,
            redirect_uri: process.env.NEXT_PUBLIC_REDIRECT_URI || window.location.origin + "/",
            code_verifier: codeVerifier,
          }),
        })
          .then(async res => {
            if (!res.ok) {
              const text = await res.text();
              throw new Error(`Token API failed (${res.status}): ${text.substring(0, 50)}...`);
            }
            return res.json();
          })
          .then(data => {
            // 🔍 DIAGNOSTIC: log exactly what scopes Spotify granted
            console.log('🎵 Spotify token exchange response:', {
              has_access_token: !!data.access_token,
              granted_scope: data.scope, // e.g. "streaming user-read-private ..."
              expires_in: data.expires_in,
            });
            if (data.access_token) {
              localStorage.setItem("spotify_token_v2", data.access_token);
              setToken(data.access_token);

              // Store refresh token and expiry time
              if (data.refresh_token) {
                localStorage.setItem("spotify_refresh_token", data.refresh_token);
              }
              if (data.expires_in) {
                const expiryTime = Date.now() + (data.expires_in * 1000);
                localStorage.setItem("spotify_token_expiry", expiryTime.toString());
              }
            } else {
              console.error('🎵 Token exchange failed — response:', data);
            }
          })
          .catch(err => console.error("Token exchange error:", err));
      }
    } else {
      // Fallback: check localStorage for saved token
      const savedToken = localStorage.getItem("spotify_token_v2");
      console.log('🎵 No OAuth code — using saved token:', savedToken ? 'found' : 'NOT found');
      if (savedToken) setToken(savedToken);
    }

    (window as any).onSpotifyIframeApiReady = (IFrameAPI: any) => {
      setApi(IFrameAPI);
    };
    if (!document.getElementById("spotify-iframe-api")) {
      const s = document.createElement("script");
      s.id = "spotify-iframe-api";
      s.src = "https://open.spotify.com/iframe-api/v1";
      s.async = true;
      document.body.appendChild(s);
    }
  }, []);

  useEffect(() => {
    if (token) {
      // Check cache first
      const cachedPlaylists = localStorage.getItem('spotify_playlists_cache');
      const cacheTimestamp = localStorage.getItem('spotify_playlists_timestamp');

      if (cachedPlaylists && cacheTimestamp) {
        const age = Date.now() - parseInt(cacheTimestamp, 10);
        if (age < CACHE_DURATION) {
          // Use cached data
          setPlaylists(JSON.parse(cachedPlaylists));
          return;
        }
      }

      // Check token validity and refresh if needed
      const fetchPlaylists = async () => {
        await checkAndRefreshToken();

        // Get current token (may have been refreshed)
        const currentToken = localStorage.getItem("spotify_token_v2") || token;

        // Fetch user playlists
        fetch("https://api.spotify.com/v1/me/playlists?limit=20", {
          headers: { Authorization: `Bearer ${currentToken}` }
        })
        .then(async res => {
          if (!res.ok) {
            const text = await res.text();
            throw new Error(`Playlist API failed (${res.status}): ${text.substring(0, 50)}...`);
          }
          return res.json();
        })
        .then(data => {
          if (data && data.items) {
            const playlistData = data.items.map((item: any) => ({
              id: item.id,
              name: item.name,
              uri: item.uri
            }));
            setPlaylists(playlistData);
            // Cache the playlists
            localStorage.setItem('spotify_playlists_cache', JSON.stringify(playlistData));
            localStorage.setItem('spotify_playlists_timestamp', Date.now().toString());
          } else if (data && data.error) {
            throw new Error(data.error.message);
          }
        })
        .catch(err => {
          console.error("Playlist API error:", err);
          // 스포티파이 무료 계정(Premium 없음)의 경우 API 조회가 차단될 수 있습니다. (403 에러)
          // Rate limit(429)나 기타 API 제한도 처리합니다.
          // 이 경우 토큰을 지우지 않고 기본 플레이리스트를 제공하여 무한 로그인 루프를 방지합니다.
          if (err.message.includes('403') || err.message.includes('premium') || err.message.includes('429')) {
            const fallbackPlaylists = [{
              id: 'default',
              name: '기본 휴식 플레이리스트 (API 제한)',
              uri: 'spotify:playlist:37i9dQZF1DWWEJlAGA9gs0' // Spotify's "Acoustic Concentration"
            }];
            setPlaylists(fallbackPlaylists);
            // Cache fallback playlists too
            localStorage.setItem('spotify_playlists_cache', JSON.stringify(fallbackPlaylists));
            localStorage.setItem('spotify_playlists_timestamp', Date.now().toString());
          } else {
            localStorage.removeItem("spotify_token");
            localStorage.removeItem("spotify_token_v2");
            setToken(null);
          }
        });
      };

      fetchPlaylists();
    }
  }, [token]);

  const refreshToken = async () => {
    const refresh = localStorage.getItem("spotify_refresh_token");
    if (!refresh) {
      console.warn("No refresh token available");
      return false;
    }

    try {
      const response = await fetch("https://accounts.spotify.com/api/token", {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          client_id: process.env.NEXT_PUBLIC_SPOTIFY_CLIENT_ID || "",
          grant_type: 'refresh_token',
          refresh_token: refresh,
        }),
      });

      if (!response.ok) {
        throw new Error(`Token refresh failed (${response.status})`);
      }

      const data = await response.json();
      if (data.access_token) {
        localStorage.setItem("spotify_token_v2", data.access_token);
        setToken(data.access_token);

        // Update refresh token if provided
        if (data.refresh_token) {
          localStorage.setItem("spotify_refresh_token", data.refresh_token);
        }

        // Update expiry time
        if (data.expires_in) {
          const expiryTime = Date.now() + (data.expires_in * 1000);
          localStorage.setItem("spotify_token_expiry", expiryTime.toString());
        }

        return true;
      }
    } catch (err) {
      console.error("Token refresh error:", err);
      // Clear tokens on refresh failure
      localStorage.removeItem("spotify_token_v2");
      localStorage.removeItem("spotify_refresh_token");
      localStorage.removeItem("spotify_token_expiry");
      setToken(null);
    }
    return false;
  };

  const checkAndRefreshToken = async () => {
    const expiryStr = localStorage.getItem("spotify_token_expiry");
    if (!expiryStr) return true; // No expiry info, assume valid

    const expiry = parseInt(expiryStr, 10);
    const now = Date.now();

    // Refresh if token expires in less than 5 minutes
    if (now >= expiry - (5 * 60 * 1000)) {
      return await refreshToken();
    }

    return true;
  };

  const login = async () => {
    const clientId = process.env.NEXT_PUBLIC_SPOTIFY_CLIENT_ID;
    if (!clientId) {
      alert("NEXT_PUBLIC_SPOTIFY_CLIENT_ID가 설정되지 않았습니다. .env.local 파일을 확인해주세요!");
      return;
    }
    const redirectUri = process.env.NEXT_PUBLIC_REDIRECT_URI || window.location.origin + "/";
    const scope = "playlist-read-private playlist-read-collaborative user-read-private streaming user-read-playback-state user-modify-playback-state";

    const codeVerifier = generateRandomString(64);
    window.localStorage.setItem('code_verifier', codeVerifier);
    const hashed = await sha256(codeVerifier);
    const codeChallenge = base64encode(hashed);

    const authUrl = new URL("https://accounts.spotify.com/authorize");
    authUrl.search = new URLSearchParams({
      response_type: 'code',
      client_id: clientId,
      scope,
      code_challenge_method: 'S256',
      code_challenge: codeChallenge,
      redirect_uri: redirectUri,
      show_dialog: 'true', // Force re-consent to apply updated scopes
    }).toString();

    window.location.href = authUrl.toString();
  };

  const playTrack = async (uri: string) => {
    const currentToken = localStorage.getItem("spotify_token_v2") || token;
    const currentDeviceId = deviceId;
    if (!currentToken || !currentDeviceId) {
      console.warn('playTrack: no token or deviceId', { currentToken: !!currentToken, currentDeviceId });
      return;
    }
    await fetch(`https://api.spotify.com/v1/me/player/play?device_id=${currentDeviceId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${currentToken}`,
      },
      body: JSON.stringify({ uris: [uri] }),
    });
  };

  const registerDevice = (id: string) => {
    setDeviceId(id);
  };

  const registerGlobalPlayer = (pauseFn: () => void) => {
    globalPauseFn.current = pauseFn;
  };

  const pauseGlobal = () => {
    globalPauseFn.current?.();
  };

  const registerController = (id: string, controller: any) => {
    controllers.current[id] = controller;
    controller.addListener('playback_update', (e: any) => {
      if (!e.data.isPaused && activeId.current !== id) {
        if (activeId.current && controllers.current[activeId.current]) {
          controllers.current[activeId.current].pause();
        }
        activeId.current = id;
      }
    });
  };

  const playController = (id: string) => {
    if (controllers.current[id]) {
      controllers.current[id].play();
    }
  };

  const fetchPlaylistTracks = async (playlistId: string) => {
    if (!token) return;

    // Check in-memory cache first
    const cached = tracksCache.current.get(playlistId);
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      setTracks(cached.data);
      return;
    }

    // Check if request is already in-flight
    const inflight = inflightRequests.current.get(playlistId);
    if (inflight) {
      await inflight;
      return;
    }

    // Check and refresh token if needed
    await checkAndRefreshToken();
    const currentToken = localStorage.getItem("spotify_token_v2") || token;

    setLoadingTracks(true);

    // Create and track the request promise
    const requestPromise = (async () => {
      try {
        const response = await fetch(`https://api.spotify.com/v1/playlists/${playlistId}/tracks?limit=50`, {
          headers: { Authorization: `Bearer ${currentToken}` }
        });

        if (!response.ok) {
          // Handle 403 error for free accounts
          if (response.status === 403) {
            const errorMsg = "Spotify Premium이 필요합니다. 무료 계정은 플레이리스트 전체만 선택 가능합니다.";
            console.warn(errorMsg);
            setError(errorMsg);
            setTracks([]); // Empty tracks means we'll fall back to playlist selection
            // Cache empty result to avoid repeated requests
            tracksCache.current.set(playlistId, { data: [], timestamp: Date.now() });
            setLoadingTracks(false);
            return;
          }
          // Handle 429 error for rate limiting
          if (response.status === 429) {
            const errorMsg = "API 요청 한도를 초과했습니다. 잠시 후 다시 시도해주세요.";
            console.warn(errorMsg);
            setError(errorMsg);
            setTracks([]); // Fall back to playlist selection
            // Cache empty result with shorter duration for rate limiting
            tracksCache.current.set(playlistId, { data: [], timestamp: Date.now() });
            setLoadingTracks(false);
            return;
          }
          throw new Error(`Failed to fetch tracks: ${response.status}`);
        }

        const data = await response.json();

        if (data && data.items) {
          const trackList: Track[] = data.items
            .filter((item: any) => item.track) // Filter out null tracks
            .map((item: any) => ({
              id: item.track.id,
              name: item.track.name,
              artists: item.track.artists.map((a: any) => a.name).join(', '),
              uri: item.track.uri,
              album: item.track.album.name
            }));

          setTracks(trackList);
          // Cache the tracks
          tracksCache.current.set(playlistId, { data: trackList, timestamp: Date.now() });
        }
      } catch (err) {
        console.error("Failed to fetch playlist tracks:", err);
        setTracks([]);
      } finally {
        setLoadingTracks(false);
        // Remove from in-flight requests
        inflightRequests.current.delete(playlistId);
      }
    })();

    // Track the in-flight request
    inflightRequests.current.set(playlistId, requestPromise);
    await requestPromise;
  };

  return (
    <SpotifyContext.Provider value={{
      api,
      token,
      deviceId,
      playlists,
      tracks,
      loadingTracks,
      error,
      registerController,
      playController,
      login,
      fetchPlaylistTracks,
      clearError,
      playTrack,
      registerDevice,
      pauseGlobal,
      registerGlobalPlayer,
    }}>
      {children}
    </SpotifyContext.Provider>
  );
}
