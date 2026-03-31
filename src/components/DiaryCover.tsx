"use client";
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import PostPlayer from './PostPlayer';
import { useAuth } from './AuthProvider';
import { Palette, Trash2, MoreVertical, Pencil, EyeOff, Eye, Archive } from 'lucide-react';

interface Sticker {
  id: number;
  src: string;
  x: number;
  y: number;
  width?: number;
  height?: number;
  rotation?: number;
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
  isHidden: boolean;
}

interface DiaryCoverProps {
  entry: DiaryEntry;
  isPreview?: boolean;
  children?: React.ReactNode;
  onDelete?: () => void;
}

export default function DiaryCover({ entry, isPreview = false, children, onDelete }: DiaryCoverProps) {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);
  const [isHiding, setIsHiding] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const { token } = useAuth();

  // Close menu when clicking outside
  useEffect(() => {
    if (!isMenuOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isMenuOpen]);


  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();

    const confirmed = confirm(`"${entry.title}" 다이어리를 정말 삭제하시겠습니까?\n이 작업은 되돌릴 수 없습니다.`);
    if (!confirmed) return;

    if (!token) {
      alert('로그인이 필요합니다.');
      return;
    }

    setIsDeleting(true);

    try {
      const response = await fetch(`/api/diaries/${entry.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (data.success) {
        alert('다이어리가 삭제되었습니다.');
        if (onDelete) {
          onDelete();
        } else {
          router.refresh();
        }
      } else {
        alert(`삭제 실패: ${data.error?.message || '알 수 없는 오류'}`);
      }
    } catch (error) {
      console.error('Delete error:', error);
      alert('다이어리 삭제 중 오류가 발생했습니다.');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleHide = async (e: React.MouseEvent) => {
    e.stopPropagation();

    if (!token) {
      alert('로그인이 필요합니다.');
      return;
    }

    const newHiddenStatus = !entry.isHidden;
    const actionText = newHiddenStatus ? '숨김' : '숨김 해제';

    setIsHiding(true);

    try {
      const response = await fetch(`/api/diaries/${entry.id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ isHidden: newHiddenStatus }),
      });

      const data = await response.json();

      if (data.success) {
        alert(`다이어리가 ${actionText} 처리되었습니다.`);
        if (onDelete) {
          onDelete();
        } else {
          router.refresh();
        }
      } else {
        alert(`${actionText} 실패: ${data.error?.message || '알 수 없는 오류'}`);
      }
    } catch (error) {
      console.error('Hide error:', error);
      alert(`다이어리 ${actionText} 중 오류가 발생했습니다.`);
    } finally {
      setIsHiding(false);
    }
  };

  return (
    <div
      style={{
        position: 'relative',
        width: '100%',
        aspectRatio: '1 / 1.3', // Highly responsive GoodNotes proportion
        backgroundColor: '#FFF9C4',
        backgroundImage: 'url("/assets/cloud_v6.png")',
        backgroundSize: '40%', // Scales cloud pattern with cover
        backgroundRepeat: 'repeat',
        backgroundBlendMode: 'overlay',
        borderRadius: '2% 8% 8% 2%',
        boxShadow: '-4px 6px 15px rgba(0,0,0,0.12)',
        overflow: 'hidden',
        cursor: isPreview ? 'default' : 'pointer',
        transition: 'transform 0.2s, box-shadow 0.2s',
        display: 'flex',
        flexDirection: 'column',
        padding: '8% 8% 8% 12%'
      }}
      onClick={() => {
        if (!isPreview) router.push(`/read/${entry.id}`);
      }}
      onMouseEnter={(e) => { if (!isPreview) e.currentTarget.style.transform = 'translateY(-5px)' }}
      onMouseLeave={(e) => { if (!isPreview) e.currentTarget.style.transform = 'translateY(0)' }}
    >
      {/* Binder Spine */}
      <div style={{
        position: 'absolute',
        top: 0, left: 0, bottom: 0, width: '8%',
        background: 'linear-gradient(to right, #B0BEC5, #ECEFF1 20%, #FFFFFF 50%, #ECEFF1 80%, #B0BEC5)',
        borderRight: '1px solid #90A4AE',
        zIndex: 10
      }}>
        {/* Binder Rings */}
        {[10, 30, 50, 70, 90].map(top => (
          <div key={top} style={{
            position: 'absolute',
            top: `${top}%`,
            left: '30%',
            width: '80%',
            height: '4%',
            background: 'linear-gradient(to bottom, #757575, #BDBDBD)',
            borderRadius: '4px',
            boxShadow: '1px 3px 6px rgba(0,0,0,0.4)',
            zIndex: 11
          }} />
        ))}
      </div>

      {/* Render Stickers on the Cover via Display Mode */}
      {!children && entry.coverStickers.map(s => (
        <div key={s.id} className="polaroid-wrapper" style={{
          position: 'absolute',
          left: `${s.x}%`,
          top: `${s.y}%`,
          width: `${s.width || 25}%`,
          height: `${s.height || 25}%`,
          transform: `rotate(${s.rotation || 0}deg)`,
          zIndex: 1
        }}>
          <div className="polaroid-frame">
            <div className="polaroid-tape"></div>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={s.src} alt="sticker" />
          </div>
        </div>
      ))}

      {/* Editor Overlay mode */}
      {children}

      {/* Title Tag */}
      <div className="diary-cover-title-tag">
        <div style={{ flex: 1 }}>
          <h3 className="diary-cover-title">{entry.title}</h3>
          <p className="diary-cover-meta">{entry.date} · {entry.category}</p>
        </div>

        {/* Action Menu */}
        {!isPreview && (
          <div className="diary-cover-menu" ref={menuRef}>
            <button
              className="diary-cover-menu-button"
              onClick={(e) => {
                e.stopPropagation();
                setIsMenuOpen(!isMenuOpen);
              }}
            >
              <MoreVertical size={16} strokeWidth={2.5} />
            </button>

          {isMenuOpen && (
            <div className="diary-cover-menu-dropdown" onClick={(e) => e.stopPropagation()}>
              {entry.isHidden ? (
                // Menu for hidden diaries (in archive)
                <>
                  <button
                    className="diary-cover-menu-item"
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsMenuOpen(false);
                      handleHide(e);
                    }}
                    disabled={isHiding}
                  >
                    <Archive size={16} strokeWidth={2.5} />
                    <span>{isHiding ? '꺼내는 중...' : '꺼내기'}</span>
                  </button>
                  <button
                    className="diary-cover-menu-item delete"
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsMenuOpen(false);
                      handleDelete(e);
                    }}
                    disabled={isDeleting}
                  >
                    <Trash2 size={16} strokeWidth={2.5} />
                    <span>{isDeleting ? '삭제 중...' : '다이어리 삭제'}</span>
                  </button>
                </>
              ) : (
                // Menu for normal diaries
                <>
                  <button
                    className="diary-cover-menu-item"
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsMenuOpen(false);
                      router.push(`/write?edit=${entry.id}`);
                    }}
                  >
                    <Pencil size={16} strokeWidth={2.5} />
                    <span>수정</span>
                  </button>
                  <button
                    className="diary-cover-menu-item"
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsMenuOpen(false);
                      router.push(`/decorate/${entry.id}`);
                    }}
                  >
                    <Palette size={16} strokeWidth={2.5} />
                    <span>표지 꾸미기</span>
                  </button>
                  <button
                    className="diary-cover-menu-item"
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsMenuOpen(false);
                      handleHide(e);
                    }}
                    disabled={isHiding}
                  >
                    <EyeOff size={16} strokeWidth={2.5} />
                    <span>{isHiding ? '숨김 처리 중...' : '숨김'}</span>
                  </button>
                  <button
                    className="diary-cover-menu-item delete"
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsMenuOpen(false);
                      handleDelete(e);
                    }}
                    disabled={isDeleting}
                  >
                    <Trash2 size={16} strokeWidth={2.5} />
                    <span>{isDeleting ? '삭제 중...' : '다이어리 삭제'}</span>
                  </button>
                </>
              )}
            </div>
          )}
          </div>
        )}
      </div>

      {/* Music Player */}
      {entry.music && (
        <div className="diary-cover-player" onClick={e => e.stopPropagation()}>
          <PostPlayer musicJson={entry.music} id={`post-${entry.id}`} />
        </div>
      )}
    </div>
  );
}
