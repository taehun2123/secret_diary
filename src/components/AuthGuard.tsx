"use client";
import { useState } from "react";
import Image from "next/image";
import GlobalPlayer from "./GlobalPlayer";
import { useSpotify } from "./SpotifyProvider";
import { useAuth } from "./AuthProvider";

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const [password, setPassword] = useState("");
  const [usernameInput, setUsernameInput] = useState("");
  const [error, setError] = useState("");
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const { token: spotifyToken, login: spotifyLogin } = useSpotify();
  const { isAuthenticated, isLoading, isFirstTimeSetup, login } = useAuth();

  const handleUnlock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isFirstTimeSetup && !usernameInput.trim()) {
      setError("다이어리에 사용할 이름을 입력해주세요! 🥺");
      return;
    }
    setError("");
    setIsLoggingIn(true);

    const result = await login(password, usernameInput);

    if (!result.success) {
      setError(result.error || "비밀번호가 틀렸어요 😢");
      setPassword("");
    }

    setIsLoggingIn(false);
  };

  // Show loading state while checking authentication
  if (isLoading) {
    return (
      <div className="auth-screen">
        <div className="auth-card password-card">
          <Image src="/assets/duck_v11.png" alt="Cute Duck" width={100} height={100} className="auth-duck-image" priority />
          <p className="auth-subtitle">불러오는 중...</p>
        </div>
      </div>
    );
  }

  // Show login form if not authenticated
  if (!isAuthenticated) {
    return (
      <div className="auth-screen">
        <div className="auth-card password-card">
          <Image src="/assets/duck_v11.png" alt="Cute Duck" width={100} height={100} className="auth-duck-image" priority />
          <h1 className="auth-title">비밀 일기장</h1>
          <p className="auth-subtitle">
            {isFirstTimeSetup === true 
              ? "나만의 다이어리를 생성해보세요!" 
              : "오직 나만의 소중한 공간이에요."}
          </p>
          <form onSubmit={handleUnlock} className="auth-form">
            {isFirstTimeSetup === true && (
              <input
                type="text"
                placeholder="사용할 이름 🏷️ (예: 수빈)"
                className="cute-input"
                style={{ marginBottom: '10px' }}
                value={usernameInput}
                onChange={(e) => {
                  setUsernameInput(e.target.value);
                  setError("");
                }}
                disabled={isLoggingIn}
              />
            )}
            <input
              type="password"
              placeholder={isFirstTimeSetup === true ? "새로운 비밀번호 🔒" : "비밀번호 🔒"}
              className="cute-input"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setError("");
              }}
              disabled={isLoggingIn}
            />
            {error && <p className="auth-error">{error}</p>}
            <button type="submit" className="cute-button" disabled={isLoggingIn}>
              {isLoggingIn ? "확인 중..." : (isFirstTimeSetup === true ? "생성하기" : "열기")}
            </button>
            {isFirstTimeSetup === true && (
              <p className="auth-hint" style={{ marginTop: '1rem', fontSize: '0.85rem', color: '#999' }}>
                💡 원하는 접속 비밀번호와 이름을 입력해주세요!
              </p>
            )}
          </form>
        </div>
      </div>
    );
  }

  // Authenticated - show the app (Spotify login is now optional)
  return (
    <>
      {children}
      <GlobalPlayer />
    </>
  );
}
