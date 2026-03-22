"use client";

import { useState, useRef, useEffect, use } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { DiaryEntry, getEntries, saveEntries, Sticker } from "@/utils/store";
import DiaryCover from "@/components/DiaryCover";

export default function DecoratePage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const { id } = use(params);

  const [entry, setEntry] = useState<DiaryEntry | null>(null);
  const [stickers, setStickers] = useState<Sticker[]>([]);
  const [uploadedImages, setUploadedImages] = useState<string[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const entries = getEntries();
    const target = entries.find(e => e.id === id);
    if (target) {
      setEntry(target);
      setStickers(target.coverStickers || []);
    }
  }, [id]);

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const url = URL.createObjectURL(e.target.files[0]);
      setUploadedImages([...uploadedImages, url]);
    }
  };

  const addStickerToDiary = (src: string) => {
    setStickers([...stickers, { id: Date.now(), src, x: 40, y: 40 }]); // Default to center-ish
  };

  const handleSave = () => {
    const entries = getEntries();
    const newEntries = entries.map(e => e.id === id ? { ...e, coverStickers: stickers } : e);
    saveEntries(newEntries);
    alert("다이어리 표지가 예쁘게 꾸며졌어요! 💛");
    router.push("/");
  };

  // Dragging logic with Percentages
  const [draggingId, setDraggingId] = useState<number | null>(null);
  const [offsetPct, setOffsetPct] = useState({ x: 0, y: 0 });

  const handlePointerDown = (e: React.PointerEvent, s_id: number) => {
    e.preventDefault(); 
    const target = e.currentTarget as HTMLElement;
    target.setPointerCapture(e.pointerId);
    
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const stickerRect = target.getBoundingClientRect();
    
    // offset mapping: cursor position inside the sticker element mapping to percentage
    const offsetX = e.clientX - stickerRect.left;
    const offsetY = e.clientY - stickerRect.top;
    
    setDraggingId(s_id);
    setOffsetPct({ 
       x: (offsetX / rect.width) * 100, 
       y: (offsetY / rect.height) * 100 
    });
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (draggingId === null || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    
    // Calculate new top/left percentage
    const percentX = ((e.clientX - rect.left) / rect.width) * 100 - offsetPct.x;
    const percentY = ((e.clientY - rect.top) / rect.height) * 100 - offsetPct.y;

    setStickers(prev => prev.map(s => 
      s.id === draggingId ? { ...s, x: percentX, y: percentY } : s
    ));
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    const target = e.currentTarget as HTMLElement;
    target.releasePointerCapture(e.pointerId);
    setDraggingId(null);
  };

  if (!entry) return <div style={{ padding: 20 }}>로딩중...</div>;

  return (
    <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '20px', minHeight: '100vh', overflow: 'hidden' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1 style={{ fontSize: '1.6rem', margin: 0, color: 'var(--text-color)' }}>🎨 '{entry.title}' 표지 꾸미기</h1>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button className="cute-button" onClick={handleSave}>저장하기</button>
          <Link href="/" style={{ textDecoration: 'none', color: '#9E9E9E', fontWeight: 'bold', alignSelf: 'center' }}>✕ 취소</Link>
        </div>
      </header>

      {/* Diary Canvas (1:1 with Home DiaryCover via Wrapper) */}
      <div 
        ref={containerRef}
        style={{ 
          margin: '0 auto',
          width: '100%', 
          maxWidth: '350px', // Exact max-width to simulate Home grid sizes nicely
          touchAction: 'none' // Prevent scrolling
        }}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
      >
        <DiaryCover entry={entry} isPreview={true}>
          <div style={{ position: 'absolute', top: '15%', right: '10%', color: '#A1887F', fontSize: '1rem', opacity: 0.6, pointerEvents: 'none', zIndex: 1, fontFamily: 'var(--font-geist-sans), sans-serif' }}>
            여기에 스티커를 붙여보세요!
          </div>

          {stickers.map(sticker => (
            // eslint-disable-next-line @next/next/no-img-element
            <img 
              key={sticker.id}
              src={sticker.src}
              alt="sticker"
              style={{
                position: 'absolute',
                left: `${sticker.x}%`,
                top: `${sticker.y}%`,
                width: '25%', // Matches DiaryCover width exactly
                cursor: draggingId === sticker.id ? 'grabbing' : 'grab',
                zIndex: draggingId === sticker.id ? 100 : 1,
                userSelect: 'none',
                mixBlendMode: 'multiply', // Transparent illusion
                filter: 'drop-shadow(2px 4px 6px rgba(0,0,0,0.15))'
              }}
              onPointerDown={(e) => handlePointerDown(e, sticker.id)}
              draggable="false"
            />
          ))}
        </DiaryCover>
      </div>

      {/* Sticker Palette */}
      <div className="rounded-card" style={{ display: 'flex', flexDirection: 'column', gap: '10px', flexShrink: 0, marginTop: 'auto', marginBottom: '40px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontWeight: 'bold', color: 'var(--text-color)' }}>내 스티커</span>
          <label className="cute-button" style={{ cursor: 'pointer', background: '#FFF59D', fontSize: '1rem', padding: '8px 16px' }}>
            + 이미지 추가
            <input type="file" accept="image/*" style={{ display: 'none' }} onChange={handleUpload} />
          </label>
        </div>
        <div style={{ display: 'flex', gap: '15px', overflowX: 'auto', padding: '10px 0', alignItems: 'center' }}>
          <Image src="/assets/main_duck.png" alt="duck" width={60} height={60} style={{ cursor: 'pointer', borderRadius: '10px', mixBlendMode: 'multiply' }} onClick={() => addStickerToDiary("/assets/main_duck.png")} />
          <Image src="/assets/cotton_candy_v3.png" alt="candy" width={60} height={60} style={{ cursor: 'pointer', borderRadius: '10px', mixBlendMode: 'multiply' }} onClick={() => addStickerToDiary("/assets/cotton_candy_v3.png")} />
          <Image src="/assets/cloud_v4.png" alt="cloud" width={60} height={60} style={{ cursor: 'pointer', borderRadius: '10px', mixBlendMode: 'multiply' }} onClick={() => addStickerToDiary("/assets/cloud_v4.png")} />
          
          {uploadedImages.map((src, i) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img key={i} src={src} alt="uploaded" style={{ width: '60px', height: '60px', cursor: 'pointer', objectFit: 'cover', borderRadius: '10px', mixBlendMode: 'multiply' }} onClick={() => addStickerToDiary(src)} />
          ))}
        </div>
      </div>
    </div>
  );
}
