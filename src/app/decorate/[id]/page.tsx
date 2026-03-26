"use client";

import { useState, useRef, useEffect, use } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Save, Trash2, Plus, X, Palette, ChevronsUp, ChevronsDown, ChevronUp, ChevronDown } from "lucide-react";
import DiaryCover from "@/components/DiaryCover";
import { useAuth } from "@/components/AuthProvider";

interface Sticker {
  id: number;
  src: string;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
}

interface DiaryEntry {
  id: string;
  title: string;
  content: string;
  category: string;
  date: string;
  music: string | null;
  images: string[];
  coverStickers: Sticker[];
}

export default function DecoratePage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const { id } = use(params);

  const [entry, setEntry] = useState<DiaryEntry | null>(null);
  const [stickers, setStickers] = useState<Sticker[]>([]);
  const [uploadedImages, setUploadedImages] = useState<string[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const { token } = useAuth();

  useEffect(() => {
    const fetchEntry = async () => {
      if (!token) return;

      try {
        const response = await fetch(`/api/diaries/${id}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        const data = await response.json();

        if (data.success && data.data) {
          setEntry(data.data);
          setStickers(data.data.coverStickers || []);
          setUploadedImages(data.data.uploadedStickers || []);
        } else {
          console.error('Failed to fetch diary:', data.error);
          router.push("/");
        }
      } catch (error) {
        console.error('Error fetching diary:', error);
        router.push("/");
      }
    };

    fetchEntry();
  }, [id, token, router]);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;

    if (!token) {
      alert('로그인이 필요합니다.');
      return;
    }

    setIsUploading(true);

    try {
      const files = Array.from(e.target.files);
      const uploadedUrls: string[] = [];

      for (const file of files) {
        // Validate file size (max 5MB)
        if (file.size > 5 * 1024 * 1024) {
          alert(`${file.name}은(는) 5MB를 초과합니다. 건너뜁니다.`);
          continue;
        }

        // Upload to Supabase Storage
        const formData = new FormData();
        formData.append('file', file);

        const response = await fetch('/api/upload', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
          body: formData,
        });

        const data = await response.json();

        if (data.success && data.data.url) {
          uploadedUrls.push(data.data.url);
        } else {
          console.error('Upload failed:', data.error);
          alert(`${file.name} 업로드 실패: ${data.error?.message || '알 수 없는 오류'}`);
        }
      }

      if (uploadedUrls.length > 0) {
        setUploadedImages([...uploadedImages, ...uploadedUrls]);
      }
    } catch (error) {
      console.error('Upload error:', error);
      alert('이미지 업로드 중 오류가 발생했습니다.');
    } finally {
      setIsUploading(false);
      // Reset file input
      e.target.value = '';
    }
  };

  const addStickerToDiary = (src: string) => {
    setStickers([...stickers, {
      id: Date.now(),
      src,
      x: 40,
      y: 40,
      width: 25,
      height: 25,
      rotation: 0
    }]); // Default to center-ish with 25% size
  };

  const removeSticker = (stickerId: number) => {
    setStickers(stickers.filter(s => s.id !== stickerId));
  };

  const removeAllStickers = () => {
    if (stickers.length === 0) {
      alert("삭제할 스티커가 없습니다!");
      return;
    }
    if (confirm(`모든 스티커 ${stickers.length}개를 삭제하시겠습니까?`)) {
      setStickers([]);
    }
  };

  // Layer order functions
  const bringToFront = (stickerId: number) => {
    setStickers(prev => {
      const index = prev.findIndex(s => s.id === stickerId);
      if (index === -1 || index === prev.length - 1) return prev;
      const newStickers = [...prev];
      const [sticker] = newStickers.splice(index, 1);
      newStickers.push(sticker);
      return newStickers;
    });
  };

  const sendToBack = (stickerId: number) => {
    setStickers(prev => {
      const index = prev.findIndex(s => s.id === stickerId);
      if (index === -1 || index === 0) return prev;
      const newStickers = [...prev];
      const [sticker] = newStickers.splice(index, 1);
      newStickers.unshift(sticker);
      return newStickers;
    });
  };

  const bringForward = (stickerId: number) => {
    setStickers(prev => {
      const index = prev.findIndex(s => s.id === stickerId);
      if (index === -1 || index === prev.length - 1) return prev;
      const newStickers = [...prev];
      [newStickers[index], newStickers[index + 1]] = [newStickers[index + 1], newStickers[index]];
      return newStickers;
    });
  };

  const sendBackward = (stickerId: number) => {
    setStickers(prev => {
      const index = prev.findIndex(s => s.id === stickerId);
      if (index === -1 || index === 0) return prev;
      const newStickers = [...prev];
      [newStickers[index], newStickers[index - 1]] = [newStickers[index - 1], newStickers[index]];
      return newStickers;
    });
  };

  const handleSave = async () => {
    if (!token) {
      alert('로그인이 필요합니다.');
      return;
    }

    setIsSaving(true);

    try {
      // Ensure all stickers have valid positions (0-100 range)
      const validatedStickers = stickers.map(s => ({
        ...s,
        x: Math.max(0, Math.min(100, s.x)),
        y: Math.max(0, Math.min(100, s.y)),
      }));

      const response = await fetch(`/api/diaries/${id}/stickers`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          stickers: validatedStickers,
          uploadedStickers: uploadedImages,
        }),
      });

      const data = await response.json();

      if (data.success) {
        alert("다이어리 표지가 예쁘게 꾸며졌어요! 💛");
        router.push("/");
      } else {
        alert(`저장 실패: ${data.error?.message || '알 수 없는 오류'}`);
      }
    } catch (error) {
      console.error('Save error:', error);
      alert('저장 중 오류가 발생했습니다.');
    } finally {
      setIsSaving(false);
    }
  };

  // Dragging logic with Percentages
  const [draggingId, setDraggingId] = useState<number | null>(null);
  const [offsetPct, setOffsetPct] = useState({ x: 0, y: 0 });
  const [isOverDeleteZone, setIsOverDeleteZone] = useState(false);
  const deleteZoneRef = useRef<HTMLDivElement>(null);

  // Resizing logic
  const [resizingId, setResizingId] = useState<number | null>(null);
  const [resizeStart, setResizeStart] = useState({ x: 0, y: 0, width: 0, height: 0 });

  // Rotating logic
  const [rotatingId, setRotatingId] = useState<number | null>(null);
  const [rotateStart, setRotateStart] = useState({ x: 0, y: 0, rotation: 0 });


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
    if (resizingId !== null) {
      handleResizeMove(e);
      return;
    }

    if (rotatingId !== null) {
      handleRotateMove(e);
      return;
    }

    if (draggingId === null || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();

    // Calculate new top/left percentage
    let percentX = ((e.clientX - rect.left) / rect.width) * 100 - offsetPct.x;
    let percentY = ((e.clientY - rect.top) / rect.height) * 100 - offsetPct.y;

    // Clamp to 0-100 range to prevent validation errors
    percentX = Math.max(0, Math.min(100, percentX));
    percentY = Math.max(0, Math.min(100, percentY));

    setStickers(prev => prev.map(s =>
      s.id === draggingId ? { ...s, x: percentX, y: percentY } : s
    ));

    // Check if over delete zone
    if (deleteZoneRef.current) {
      const deleteRect = deleteZoneRef.current.getBoundingClientRect();
      const isOver = (
        e.clientX >= deleteRect.left &&
        e.clientX <= deleteRect.right &&
        e.clientY >= deleteRect.top &&
        e.clientY <= deleteRect.bottom
      );
      setIsOverDeleteZone(isOver);
    }
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    const target = e.currentTarget as HTMLElement;
    target.releasePointerCapture(e.pointerId);

    // Delete sticker if dropped in delete zone
    if (isOverDeleteZone && draggingId !== null) {
      removeSticker(draggingId);
    }

    setDraggingId(null);
    setResizingId(null);
    setRotatingId(null);
    setIsOverDeleteZone(false);
  };

  const handleResizeStart = (e: React.PointerEvent, s_id: number) => {
    e.stopPropagation();
    e.preventDefault();
    const target = e.currentTarget as HTMLElement;
    target.setPointerCapture(e.pointerId);

    const sticker = stickers.find(s => s.id === s_id);
    if (!sticker) return;

    setResizingId(s_id);
    setResizeStart({
      x: e.clientX,
      y: e.clientY,
      width: sticker.width,
      height: sticker.height,
    });
  };

  const handleResizeMove = (e: React.PointerEvent) => {
    if (resizingId === null || !containerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    const deltaX = e.clientX - resizeStart.x;
    const deltaY = e.clientY - resizeStart.y;

    // Use the larger delta for proportional scaling
    const delta = Math.max(deltaX, deltaY);
    const scaleFactor = (delta / rect.width) * 100;

    const newWidth = Math.max(10, Math.min(50, resizeStart.width + scaleFactor));
    const newHeight = Math.max(10, Math.min(50, resizeStart.height + scaleFactor));

    setStickers(prev => prev.map(s =>
      s.id === resizingId ? { ...s, width: newWidth, height: newHeight } : s
    ));
  };

  const handleRotateStart = (e: React.PointerEvent, s_id: number) => {
    e.stopPropagation();
    e.preventDefault();
    const target = e.currentTarget as HTMLElement;
    target.setPointerCapture(e.pointerId);

    const sticker = stickers.find(s => s.id === s_id);
    if (!sticker || !containerRef.current) return;

    setRotatingId(s_id);
    setRotateStart({
      x: e.clientX,
      y: e.clientY,
      rotation: sticker.rotation
    });
  };

  const handleRotateMove = (e: React.PointerEvent) => {
    if (rotatingId === null || !containerRef.current) return;

    const deltaX = e.clientX - rotateStart.x;

    // Rotate 1 degree per pixel moved horizontally
    const newRotation = rotateStart.rotation + deltaX;

    setStickers(prev => prev.map(s =>
      s.id === rotatingId ? { ...s, rotation: newRotation % 360 } : s
    ));
  };


  if (!entry) return <div style={{ padding: 20 }}>로딩중...</div>;

  return (
    <div className="decorate-container">
      <header className="decorate-header">
        <h1 className="decorate-title"><Palette size={24} strokeWidth={2.5} className="lucide-icon" /> '<span className="entry-title-text">{entry.title}</span>' 표지 꾸미기</h1>
        <div className="decorate-actions">
          <button className="cute-button remove-all-button" onClick={removeAllStickers}>
            <Trash2 size={18} strokeWidth={2.5} className="lucide-icon" /> <span className="remove-all-text">모두 삭제</span>
          </button>
          <button className="cute-button save-button" onClick={handleSave} disabled={isSaving}>
            {isSaving ? "저장 중..." : <><Save size={18} strokeWidth={2.5} className="lucide-icon" /> 저장하기</>}
          </button>
          <Link href="/" className="decorate-cancel-button"><X size={18} strokeWidth={2.5} className="lucide-icon" /> <span className="cancel-button-text">취소</span></Link>
        </div>
      </header>

      {/* Diary Canvas (1:1 with Home DiaryCover via Wrapper) */}
      <div
        ref={containerRef}
        className="decorate-canvas"
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
      >
        <DiaryCover entry={entry} isPreview={true}>
          <div className="sticker-hint">
            여기에 스티커를 붙여보세요!
          </div>

          {stickers.map(sticker => (
            <div
              key={sticker.id}
              className="polaroid-wrapper"
              style={{
                position: 'absolute',
                left: `${sticker.x}%`,
                top: `${sticker.y}%`,
                width: `${sticker.width}%`,
                height: `${sticker.height}%`,
                transform: `rotate(${sticker.rotation}deg)`,
                zIndex: draggingId === sticker.id || resizingId === sticker.id || rotatingId === sticker.id ? 100 : 1,
              }}
            >
              {/* Polaroid Frame */}
              <div className="polaroid-frame">
                {/* Tape */}
                <div className="polaroid-tape"></div>

                {/* Action Buttons */}
                <div className="sticker-action-buttons">
                  <button
                    className="sticker-action-btn layer-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      bringToFront(sticker.id);
                    }}
                    title="맨 앞으로"
                  >
                    <ChevronsUp size={12} strokeWidth={3} />
                  </button>
                  <button
                    className="sticker-action-btn layer-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      bringForward(sticker.id);
                    }}
                    title="한 단계 앞으로"
                  >
                    <ChevronUp size={12} strokeWidth={3} />
                  </button>
                  <button
                    className="sticker-action-btn layer-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      sendBackward(sticker.id);
                    }}
                    title="한 단계 뒤로"
                  >
                    <ChevronDown size={12} strokeWidth={3} />
                  </button>
                  <button
                    className="sticker-action-btn layer-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      sendToBack(sticker.id);
                    }}
                    title="맨 뒤로"
                  >
                    <ChevronsDown size={12} strokeWidth={3} />
                  </button>
                  <button
                    className="sticker-action-btn delete-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      removeSticker(sticker.id);
                    }}
                    title="스티커 삭제"
                  >
                    <X size={12} strokeWidth={3} />
                  </button>
                </div>

                {/* Image */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={sticker.src}
                  alt="sticker"
                  className="draggable-sticker"
                  style={{
                    cursor: draggingId === sticker.id ? 'grabbing' : 'grab',
                    userSelect: 'none',
                  }}
                  onPointerDown={(e) => handlePointerDown(e, sticker.id)}
                  draggable="false"
                />
              </div>

              {/* Resize handle */}
              <div
                className="sticker-resize-handle"
                onPointerDown={(e) => handleResizeStart(e, sticker.id)}
                title="크기 조절"
              />

              {/* Rotate handle */}
              <div
                className="sticker-rotate-handle"
                onPointerDown={(e) => handleRotateStart(e, sticker.id)}
                title="회전"
              />
            </div>
          ))}
        </DiaryCover>
      </div>

      {/* Delete Zone */}
      <div
        ref={deleteZoneRef}
        className={`delete-zone ${isOverDeleteZone ? 'delete-zone-active' : ''}`}
      >
        <div className="delete-zone-content">
          <Trash2 size={20} strokeWidth={2.5} className="lucide-icon" /> <span className="delete-zone-text">여기로 드래그하여 삭제</span>
        </div>
      </div>

      {/* Sticker Palette */}
      <div className="rounded-card sticker-palette">
        <div className="palette-header">
          <span className="palette-title">내 스티커</span>
          <label className={`cute-button add-sticker-button ${isUploading ? 'disabled' : ''}`}>
            <Plus size={18} strokeWidth={3} className="lucide-icon" /> <span className="add-sticker-text">{isUploading ? '업로드 중...' : '이미지 추가'}</span>
            <input type="file" accept="image/*" multiple style={{ display: 'none' }} onChange={handleUpload} disabled={isUploading} />
          </label>
        </div>
        <div className="sticker-list">
          <Image src="/assets/duck_v11.png" alt="duck" width={60} height={60} className="sticker-item" onClick={() => addStickerToDiary("/assets/duck_v11.png")} />
          <Image src="/assets/cotton_candy_v5.png" alt="candy" width={60} height={60} className="sticker-item" onClick={() => addStickerToDiary("/assets/cotton_candy_v5.png")} />
          <Image src="/assets/cloud_v6.png" alt="cloud" width={60} height={60} className="sticker-item" onClick={() => addStickerToDiary("/assets/cloud_v6.png")} />

          {uploadedImages.map((src, i) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img key={i} src={src} alt="uploaded" className="sticker-item uploaded-sticker" onClick={() => addStickerToDiary(src)} />
          ))}
        </div>
      </div>
    </div>
  );
}
