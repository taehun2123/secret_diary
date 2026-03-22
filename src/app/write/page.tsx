"use client";

import { useState } from "react";
import Link from "next/link";
import PostPlayer from "@/components/PostPlayer";
import { getEntries, saveEntries, DiaryEntry } from "@/utils/store";

export default function WritePage() {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [category, setCategory] = useState("일상");
  const [newCategory, setNewCategory] = useState("");
  const [photo, setPhoto] = useState<string | null>(null);
  const [music, setMusic] = useState<string | null>(null);

  const categories = ["일상", "특별한 날", "우울한 날"];

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setPhoto(URL.createObjectURL(e.target.files[0]));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newEntry: DiaryEntry = {
      id: Date.now().toString(),
      title,
      content,
      category: category === "custom" ? newCategory : category,
      date: new Date().toISOString().split('T')[0].replace(/-/g, '.'),
      music: music && music.includes("spotify") ? music : null,
      coverStickers: []
    };
    const entries = getEntries();
    saveEntries([newEntry, ...entries]);
    alert("일기가 저장되었습니다!");
    window.location.href = "/";
  };

  return (
    <div style={{ padding: '20px', maxWidth: '600px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '20px', paddingBottom: '100px' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1 style={{ fontSize: '1.8rem', margin: 0, color: 'var(--text-color)' }}>✏️ 새 다이어리 작성</h1>
        <Link href="/" style={{ textDecoration: 'none', color: '#9E9E9E', fontWeight: 'bold' }}>✕ 닫기</Link>
      </header>
      
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <div className="diary-book" style={{ padding: '25px 20px 25px 45px' }}>
          <input 
            type="text" 
            placeholder="오늘의 다이어리 제목" 
            className="cute-input" 
            style={{ marginBottom: '15px' }}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />
          
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <span style={{ fontWeight: 'bold', color: 'var(--text-color)' }}>카테고리:</span>
            <select 
              className="cute-input" 
              style={{ flex: 1 }}
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            >
              {categories.map(c => <option key={c} value={c}>{c}</option>)}
              <option value="custom">직접 입력...</option>
            </select>
            {category === "custom" && (
              <input 
                type="text" 
                placeholder="새 카테고리" 
                className="cute-input" 
                style={{ flex: 1 }}
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value)}
                required
              />
            )}
          </div>
        </div>

        <div className="rounded-card" style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          <textarea 
            placeholder="오늘 하루는 어땠나요? 솜사탕처럼 달콤했나요?" 
            className="cute-input" 
            style={{ minHeight: '200px', resize: 'vertical' }}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            required
          />
        </div>

        <div className="rounded-card" style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
            <label className="cute-button" style={{ cursor: 'pointer', background: '#FFF59D', fontSize: '1rem', padding: '8px 16px' }}>
              📷 사진 첨부
              <input type="file" accept="image/*" style={{ display: 'none' }} onChange={handlePhotoUpload} />
            </label>
            {photo && <span style={{ color: '#4CAF50', fontSize: '0.9rem' }}>✓ 사진 선택됨</span>}
          </div>
          
          {photo && (
             // eslint-disable-next-line @next/next/no-img-element
            <img src={photo} alt="Preview" style={{ width: '100%', borderRadius: '15px', maxHeight: '300px', objectFit: 'cover' }} />
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '10px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
               <span style={{ fontWeight: 'bold', color: 'var(--text-color)' }}>🎵 스포티파이:</span>
               <input 
                 type="text" 
                 placeholder="검색 후 링크를 붙여넣으세요 (예: https://open.spotify.com/track/...)" 
                 className="cute-input" 
                 style={{ flex: 1, fontSize: '0.85rem' }}
                 value={music || ""}
                 onChange={(e) => setMusic(e.target.value)}
               />
            </div>
            {music && music.includes("spotify") && (
               <PostPlayer uri={music} id="preview-post-player" />
            )}
          </div>
        </div>

        <button type="submit" className="cute-button" style={{ padding: '15px', fontSize: '1.4rem', marginTop: '10px' }}>
          다이어리 등록하기 💛
        </button>
      </form>
    </div>
  );
}
