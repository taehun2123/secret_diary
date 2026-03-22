"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import DiaryCover from "@/components/DiaryCover";
import { DiaryEntry, getEntries } from "@/utils/store";

export default function Home() {
  const [selectedCategory, setSelectedCategory] = useState("전체");
  const [entries, setEntries] = useState<DiaryEntry[]>([]);
  const categories = ["전체", "일상", "특별한 날", "우울한 날"];

  useEffect(() => {
    setEntries(getEntries());
  }, []);

  const filtered = selectedCategory === "전체" 
    ? entries 
    : entries.filter(e => e.category === selectedCategory);

  return (
    <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '20px', paddingBottom: '100px' }}>
      {/* Header */}
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Image src="/assets/main_duck.png" alt="Duck" width={60} height={60} style={{ borderRadius: '50%', mixBlendMode: 'multiply' }} priority />
          <div>
             <h1 style={{ fontSize: '2rem', margin: 0, color: 'var(--text-color)' }}>내 비밀 일기장</h1>
             <p style={{ margin: 0, color: '#9E9E9E', fontSize: '0.9rem' }}>나만의 스포티파이 플레이리스트와 함께</p>
          </div>
        </div>
        <Link href="/write" className="cute-button" style={{ textDecoration: 'none', padding: '12px 24px' }}>
          ✏️ 새 일기 쓰기
        </Link>
      </header>
      
      {/* Categories */}
      <nav style={{ display: 'flex', gap: '10px', overflowX: 'auto', paddingBottom: '10px' }}>
        {categories.map(c => (
          <button 
            key={c}
            onClick={() => setSelectedCategory(c)}
            style={{
              padding: '8px 18px',
              borderRadius: '20px',
              border: '2px solid var(--yellow-warm)',
              background: selectedCategory === c ? 'var(--yellow-warm)' : 'var(--white-sub)',
              color: 'var(--text-color)',
              fontFamily: 'inherit',
              fontSize: '1.1rem',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              transition: 'all 0.2s ease',
              boxShadow: '0 2px 4px var(--shadow-color)'
            }}
          >
            {c}
          </button>
        ))}
      </nav>

      {/* Responsive Diary Grid */}
      <div className="diary-grid">
        {filtered.map(entry => (
          <DiaryCover key={entry.id} entry={entry} />
        ))}
      </div>
      
      {filtered.length === 0 && (
        <div style={{ textAlign: 'center', padding: '40px', color: '#9E9E9E', marginTop: '20px' }}>
          <Image src="/assets/cloud.png" alt="Cloud" width={120} height={120} />
          <p style={{ fontSize: '1.2rem' }}>아직 다이어리가 없어요!<br/>새 일기를 써볼까요?</p>
        </div>
      )}
    </div>
  );
}
