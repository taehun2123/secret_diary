"use client";
import { useState, useEffect } from "react";
import Image from "next/image";
import GlobalPlayer from "./GlobalPlayer";
import { useSpotify } from "./SpotifyProvider";

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [password, setPassword] = useState("");
  const [error, setError] = useState(false);
  const { token, login } = useSpotify();

  useEffect(() => {
    if (sessionStorage.getItem("unlocked") === "true") {
      setIsUnlocked(true);
    }
  }, []);

  const handleUnlock = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === "1234" || password === "0000") { // MVP simple password
      sessionStorage.setItem("unlocked", "true");
      setIsUnlocked(true);
    } else {
      setError(true);
      setPassword("");
    }
  };

  if (isUnlocked) {
    if (!token) {
      return (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', gap: '20px' }}>
           <div style={{ background: 'var(--white-sub)', padding: '40px', borderRadius: '30px', boxShadow: '0 8px 24px var(--shadow-color)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px', maxWidth: '500px', textAlign: 'center', border: '3px solid var(--yellow-warm)' }}>
             <Image src="/assets/main_duck.png" alt="Cute Duck" width={80} height={80} style={{ borderRadius: '50%', mixBlendMode: 'multiply' }} priority />
             <h2 style={{ fontSize: '1.8rem', color: 'var(--text-color)', margin: 0 }}>🎵 스포티파이 연결 🎵</h2>
             <p style={{ color: '#9E9E9E', lineHeight: '1.6' }}>내 플레이리스트를 들으며 다이어리를 감상하려면 스포티파이 계정을 연결해주세요!</p>
             <button onClick={login} className="cute-button" style={{ background: '#1DB954', color: 'white', fontWeight: 'bold' }}>
               스포티파이로 로그인하기
             </button>
             {!process.env.NEXT_PUBLIC_SPOTIFY_CLIENT_ID && (
               <div style={{ background: '#FFEBEE', padding: '15px', borderRadius: '15px', marginTop: '10px' }}>
                 <p style={{ color: '#D32F2F', fontSize: '0.85rem', margin: 0 }}>
                   ⚠️ <b>개발자 설정 필요</b>: `.env.local` 파일에 `NEXT_PUBLIC_SPOTIFY_CLIENT_ID`를 추가해야 로그인이 가능합니다.
                 </p>
               </div>
             )}
           </div>
        </div>
      );
    }

    return (
      <>
        {children}
        <GlobalPlayer />
      </>
    );
  }

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', gap: '20px' }}>
      <div style={{ background: 'var(--white-sub)', padding: '40px', borderRadius: '30px', boxShadow: '0 8px 24px var(--shadow-color)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px', maxWidth: '400px', width: '90%' }}>
        <Image src="/assets/main_duck.png" alt="Cute Duck" width={100} height={100} style={{ borderRadius: '50%', mixBlendMode: 'multiply' }} priority />
        <h1 style={{ margin: 0, fontSize: '2rem', color: 'var(--text-color)' }}>비밀 일기장</h1>
        <p style={{ margin: 0, color: '#9E9E9E' }}>오직 나만의 소중한 공간이에요.</p>
        <form onSubmit={handleUnlock} style={{ display: 'flex', flexDirection: 'column', gap: '15px', width: '100%' }}>
          <input 
            type="password" 
            placeholder="비밀번호 🔒 (hint: 0000)" 
            className="cute-input"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              setError(false);
            }}
          />
          {error && <p style={{ color: '#FF5252', fontSize: '0.9rem', margin: '0' }}>비밀번호가 틀렸어요 😢</p>}
          <button type="submit" className="cute-button">
            열기
          </button>
        </form>
      </div>
    </div>
  );
}
