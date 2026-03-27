"use client";

import { useState, useEffect, use } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { ArrowLeft, Edit3, Palette, X, ChevronLeft, ChevronRight, Trash2 } from "lucide-react";
import PostPlayer from "@/components/PostPlayer";
import { useAuth } from "@/components/AuthProvider";

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
}

export default function ReadPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const { id } = use(params);
  const [entry, setEntry] = useState<DiaryEntry | null>(null);
  const [isOpening, setIsOpening] = useState(true);
  const { token } = useAuth();
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);
  const [isFlipping, setIsFlipping] = useState(false);
  const [flipDirection, setFlipDirection] = useState<'forward' | 'backward'>('forward');

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

    // Trigger opening animation
    const timer = setTimeout(() => {
      setIsOpening(false);
    }, 100);

    return () => clearTimeout(timer);
  }, [id, router, token]);

  const openImageModal = (index: number) => {
    setCurrentImageIndex(index);
    setIsImageModalOpen(true);
  };

  const closeImageModal = () => {
    setIsImageModalOpen(false);
  };

  const goToPrevImage = () => {
    if (!entry || entry.images.length === 0) return;
    setCurrentImageIndex((prev) => (prev === 0 ? entry.images.length - 1 : prev - 1));
  };

  const goToNextImage = () => {
    if (!entry || entry.images.length === 0) return;
    setCurrentImageIndex((prev) => (prev === entry.images.length - 1 ? 0 : prev + 1));
  };

  const handleDelete = async () => {
    if (!entry) return;

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
        router.push('/');
      } else {
        alert(`삭제 실패: ${data.error?.message || '알 수 없는 오류'}`);
        setIsDeleting(false);
      }
    } catch (error) {
      console.error('Delete error:', error);
      alert('다이어리 삭제 중 오류가 발생했습니다.');
      setIsDeleting(false);
    }
  };

  // Split content into pages (approx 800 characters per page)
  const splitContentIntoPages = (content: string): string[] => {
    const CHARS_PER_PAGE = 800;
    const pages: string[] = [];

    if (content.length <= CHARS_PER_PAGE) {
      return [content];
    }

    let remaining = content;
    while (remaining.length > 0) {
      if (remaining.length <= CHARS_PER_PAGE) {
        pages.push(remaining);
        break;
      }

      // Try to break at a sentence or paragraph
      let breakPoint = CHARS_PER_PAGE;
      const searchText = remaining.substring(0, CHARS_PER_PAGE + 100);

      // Look for paragraph break
      const paragraphBreak = searchText.lastIndexOf('\n\n');
      if (paragraphBreak > CHARS_PER_PAGE * 0.7) {
        breakPoint = paragraphBreak + 2;
      } else {
        // Look for sentence break
        const sentenceBreak = Math.max(
          searchText.lastIndexOf('. '),
          searchText.lastIndexOf('! '),
          searchText.lastIndexOf('? '),
          searchText.lastIndexOf('.\n'),
          searchText.lastIndexOf('!\n'),
          searchText.lastIndexOf('?\n')
        );
        if (sentenceBreak > CHARS_PER_PAGE * 0.7) {
          breakPoint = sentenceBreak + 2;
        }
      }

      pages.push(remaining.substring(0, breakPoint).trim());
      remaining = remaining.substring(breakPoint).trim();
    }

    return pages;
  };

  const contentPages = entry ? splitContentIntoPages(entry.content) : [];
  const totalPages = Math.max(1, contentPages.length);

  const handleNextPage = () => {
    if (currentPage < totalPages - 1 && !isFlipping) {
      setFlipDirection('forward');
      setIsFlipping(true);
      setTimeout(() => {
        setCurrentPage(prev => prev + 1);
        setIsFlipping(false);
      }, 600);
    }
  };

  const handlePrevPage = () => {
    if (currentPage > 0 && !isFlipping) {
      setFlipDirection('backward');
      setIsFlipping(true);
      setTimeout(() => {
        setCurrentPage(prev => prev - 1);
        setIsFlipping(false);
      }, 600);
    }
  };

  // Keyboard navigation for modal
  useEffect(() => {
    if (!isImageModalOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeImageModal();
      if (e.key === 'ArrowLeft') goToPrevImage();
      if (e.key === 'ArrowRight') goToNextImage();
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isImageModalOpen, entry]);

  if (!entry) {
    return (
      <div className="read-container">
        <div className="read-loading">로딩 중...</div>
      </div>
    );
  }

  const renderCover = () => (
    <>
      <div className="binder-rings-left">
        {[15, 35, 55, 75].map(top => (
          <div key={top} className="ring" style={{ top: `${top}%` }} />
        ))}
      </div>
      <div className="left-page-content">
        <div className="cover-preview">
          <div className="cover-preview-bg">
            {entry.coverStickers.map(s => (
              <div
                key={s.id}
                className="polaroid-wrapper"
                style={{
                  position: 'absolute',
                  left: `${s.x}%`,
                  top: `${s.y}%`,
                  width: `${s.width || 25}%`,
                  height: `${s.height || 25}%`,
                  transform: `rotate(${s.rotation || 0}deg)`,
                  pointerEvents: 'none'
                }}
              >
                <div className="polaroid-frame">
                  <div className="polaroid-tape"></div>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={s.src} alt="sticker" className="preview-sticker" />
                </div>
              </div>
            ))}
          </div>
          <div className="cover-info-box">
            <h2 className="cover-title">{entry.title}</h2>
            <p className="cover-date">{entry.date}</p>
            <p className="cover-category">{entry.category}</p>
          </div>
        </div>
        <div className="left-page-decoration">
          <Image
            src="/assets/duck_v8.png"
            alt="duck"
            width={80}
            height={80}
            className="decoration-duck"
          />
        </div>
      </div>
    </>
  );

  return (
    <div className={`read-container ${isOpening ? 'book-opening' : 'book-opened'}`}>
      {/* Header */}
      <header className="read-header">
        <Link href="/" className="read-back-button">
          <ArrowLeft size={20} strokeWidth={2.5} className="lucide-icon" /> <span className="back-button-text">목록으로</span>
        </Link>
        <div className="read-actions">
          <Link href={`/write?edit=${entry.id}`} className="cute-button edit-button">
            <Edit3 size={18} strokeWidth={2.5} className="lucide-icon" /> <span className="edit-button-text">수정</span>
          </Link>
          <Link href={`/decorate/${entry.id}`} className="cute-button edit-button">
            <Palette size={18} strokeWidth={2.5} className="lucide-icon" /> <span className="decorate-button-text">표지 꾸미기</span>
          </Link>
          <button
            onClick={handleDelete}
            className="cute-button delete-button"
            disabled={isDeleting}
          >
            <Trash2 size={18} strokeWidth={2.5} className="lucide-icon" />
            <span className="delete-button-text">{isDeleting ? '삭제 중...' : '삭제'}</span>
          </button>
        </div>
      </header>

      {/* Open Diary Book */}
      <div className="diary-book-open">

        {/* Magic Flap (Physical Front Cover Illusion) */}
        <div className="magic-flap">
          <div className="magic-flap-front diary-page" style={{ height: '100%', boxShadow: 'none' }}>
            {renderCover()}
          </div>
          <div className="magic-flap-back diary-page"></div>
        </div>

        {/* Left Page - Cover with stickers */}
        <div className="diary-page left-page">
          {renderCover()}
        </div>

        {/* Center Binder */}
        <div className="center-binder">
          {[10, 30, 50, 70, 90].map(top => (
            <div key={top} className="binder-ring" style={{ top: `${top}%` }} />
          ))}
        </div>

        {/* Right Page - Content */}
        <div className="diary-page right-page">
          {/* Binder Rings on Right Page */}
          <div className="binder-rings-right">
            {[15, 35, 55, 75].map(top => (
              <div key={top} className="ring" style={{ top: `${top}%` }} />
            ))}
          </div>

          <div className={`right-page-content ${isFlipping ? `flipping-${flipDirection}` : ''}`}>
            {currentPage === 0 ? (
              <>
                <div className="diary-header">
                  <h1 className="diary-title">{entry.title}</h1>
                  <div className="diary-meta">
                    <span className="meta-date">📅 {entry.date}</span>
                    <span className="meta-category">🏷️ {entry.category}</span>
                  </div>
                </div>

                {/* Images Gallery - Only on first page */}
                {entry.images && entry.images.length > 0 && (
                  <div className="diary-images-gallery">
                    {entry.images.map((img, index) => (
                      <div key={index} className="diary-image-item" onClick={() => openImageModal(index)}>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={img} alt={`Diary image ${index + 1}`} className="diary-image" />
                      </div>
                    ))}
                  </div>
                )}

                <div className="diary-content">
                  <p className="content-text">{contentPages[0]}</p>
                </div>

                {/* Music Player - Only on first page */}
                {entry.music && (
                  <div className="diary-music">
                    <div className="music-label">🎵 이 일기의 음악</div>
                    <PostPlayer musicJson={entry.music} id={`read-${entry.id}`} />
                  </div>
                )}
              </>
            ) : (
              <div className="diary-content">
                <p className="content-text">{contentPages[currentPage]}</p>
              </div>
            )}

            {/* Page number and navigation */}
            <div className="page-navigation">
              <button
                className="page-nav-button prev"
                onClick={handlePrevPage}
                disabled={currentPage === 0 || isFlipping}
                style={{ opacity: currentPage === 0 ? 0.3 : 1 }}
              >
                <ChevronLeft size={24} strokeWidth={2.5} />
              </button>
              <span className="page-number">{currentPage + 1} / {totalPages}</span>
              <button
                className="page-nav-button next"
                onClick={handleNextPage}
                disabled={currentPage === totalPages - 1 || isFlipping}
                style={{ opacity: currentPage === totalPages - 1 ? 0.3 : 1 }}
              >
                <ChevronRight size={24} strokeWidth={2.5} />
              </button>
            </div>

            {/* Cloud decoration */}
            <div className="right-page-decoration">
              <Image
                src="/assets/cloud_v6.png"
                alt="cloud"
                width={60}
                height={60}
                className="decoration-cloud"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Image Gallery Modal */}
      {isImageModalOpen && entry.images && entry.images.length > 0 && (
        <div className="image-gallery-modal" onClick={closeImageModal}>
          <div className="image-gallery-content" onClick={(e) => e.stopPropagation()}>
            {/* Close Button */}
            <button className="image-modal-close" onClick={closeImageModal}>
              <X size={24} strokeWidth={2.5} />
            </button>

            {/* Image Container */}
            <div className="image-modal-main">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={entry.images[currentImageIndex]}
                alt={`Image ${currentImageIndex + 1}`}
                className="image-modal-img"
              />
            </div>

            {/* Navigation Buttons */}
            {entry.images.length > 1 && (
              <>
                <button className="image-modal-nav prev" onClick={goToPrevImage}>
                  <ChevronLeft size={32} strokeWidth={2.5} />
                </button>
                <button className="image-modal-nav next" onClick={goToNextImage}>
                  <ChevronRight size={32} strokeWidth={2.5} />
                </button>
              </>
            )}

            {/* Image Counter */}
            <div className="image-modal-counter">
              {currentImageIndex + 1} / {entry.images.length}
            </div>

            {/* Thumbnail Strip */}
            {entry.images.length > 1 && (
              <div className="image-modal-thumbnails">
                {entry.images.map((img, index) => (
                  <div
                    key={index}
                    className={`image-thumbnail ${index === currentImageIndex ? 'active' : ''}`}
                    onClick={() => setCurrentImageIndex(index)}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={img} alt={`Thumbnail ${index + 1}`} />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
