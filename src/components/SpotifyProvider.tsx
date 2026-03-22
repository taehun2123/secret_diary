"use client";
import { createContext, useContext, useEffect, useState, useRef } from "react";
import { useRouter, usePathname } from "next/navigation";

interface Playlist {
  id: string;
  name: string;
  uri: string;
}

interface SpotifyContextType {
  api: any;
  token: string | null;
  playlists: Playlist[];
  registerController: (id: string, controller: any) => void;
  playController: (id: string) => void;
  login: () => void;
}

export const SpotifyContext = createContext<SpotifyContextType>({
  api: null,
  token: null,
  playlists: [],
  registerController: () => {},
  playController: () => {},
  login: () => {},
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

export default function SpotifyProvider({ children }: { children: React.ReactNode }) {
  const [api, setApi] = useState<any>(null);
  const [token, setToken] = useState<string | null>(null);
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const controllers = useRef<{ [id: string]: any }>({});
  const activeId = useRef<string | null>(null);
  const isCodeExchanging = useRef(false);
  const router = useRouter();
  const pathname = usePathname();

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
            if (data.access_token) {
              sessionStorage.setItem("spotify_token_v2", data.access_token);
              setToken(data.access_token);
            }
          })
          .catch(err => console.error("Token exchange error:", err));
      }
    } else {
      // Fallback check session storage
      const savedToken = sessionStorage.getItem("spotify_token");
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
      // Fetch user playlists
      fetch("https://api.spotify.com/v1/me/playlists?limit=20", {
        headers: { Authorization: `Bearer ${token}` }
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
          setPlaylists(data.items.map((item: any) => ({
            id: item.id,
            name: item.name,
            uri: item.uri
          })));
        } else if (data && data.error) {
          throw new Error(data.error.message);
        }
      })
      .catch(err => {
        console.error("Playlist API error:", err);
        // 스포티파이 무료 계정(Premium 없음)의 경우 API 조회가 차단될 수 있습니다. (403 에러)
        // 이 경우 토큰을 지우지 않고 기본 플레이리스트를 제공하여 무한 로그인 루프를 방지합니다.
        if (err.message.includes('403') || err.message.includes('premium')) {
          setPlaylists([{
            id: 'default',
            name: '기본 휴식 플레이리스트 (Premium 권한 제한)',
            uri: 'spotify:playlist:37i9dQZF1DWWEJlAGA9gs0' // Spotify's "Acoustic Concentration"
          }]);
        } else {
          sessionStorage.removeItem("spotify_token");
          setToken(null);
        }
      });
    }
  }, [token]);

  const login = async () => {
    const clientId = process.env.NEXT_PUBLIC_SPOTIFY_CLIENT_ID;
    if (!clientId) {
      alert("NEXT_PUBLIC_SPOTIFY_CLIENT_ID가 설정되지 않았습니다. .env.local 파일을 확인해주세요!");
      return;
    }
    const redirectUri = process.env.NEXT_PUBLIC_REDIRECT_URI || window.location.origin + "/";
    const scope = "playlist-read-private playlist-read-collaborative user-read-private";

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
    }).toString();

    window.location.href = authUrl.toString();
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

  return (
    <SpotifyContext.Provider value={{ api, token, playlists, registerController, playController, login }}>
      {children}
    </SpotifyContext.Provider>
  );
}
