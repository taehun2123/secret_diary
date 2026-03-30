"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { PenLine, Edit2, Trash2 } from "lucide-react";
import { TypeAnimation } from 'react-type-animation';
import DiaryCover from "@/components/DiaryCover";
import ArchiveModal from "@/components/ArchiveModal";
import { useAuth } from "@/components/AuthProvider";

interface Sticker {
  id: number;
  src: string;
  x: number;
  y: number;
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

interface Category {
  id: string;
  name: string;
}

interface GroupedEntries {
  [category: string]: DiaryEntry[];
}

export default function Home() {
  const [selectedCategory, setSelectedCategory] = useState("전체");
  const [entries, setEntries] = useState<DiaryEntry[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isArchiveOpen, setIsArchiveOpen] = useState(false);
  const { token, username } = useAuth();
  const ITEMS_PER_PAGE = 8;

  // Fetch categories from DB
  const fetchCategories = async () => {
    if (!token) return;

    try {
      const response = await fetch('/api/categories', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (data.success) {
        setCategories([{ id: '전체', name: '전체' } as Category, ...data.data]);
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
      setCategories([{ id: '전체', name: '전체' } as Category]); // Fallback to just "전체"
    }
  };

  useEffect(() => {
    fetchCategories();
  }, [token]);

  useEffect(() => {
    const fetchDiaries = async () => {
      if (!token) return;

      try {
        setIsLoading(true);
        const offset = (currentPage - 1) * ITEMS_PER_PAGE;
        let url = `/api/diaries?limit=${ITEMS_PER_PAGE}&offset=${offset}`;

        if (selectedCategory !== "전체") {
          url += `&category=${encodeURIComponent(selectedCategory)}`;
        }

        const response = await fetch(url, {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        const data = await response.json();

        if (data.success) {
          setEntries(data.data);
          // Calculate total pages from total count
          const total = data.total || 0;
          setTotalPages(Math.ceil(total / ITEMS_PER_PAGE));
        } else {
          console.error('Failed to fetch diaries:', data.error);
        }
      } catch (error) {
        console.error('Error fetching diaries:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDiaries();
  }, [token, selectedCategory, currentPage, ITEMS_PER_PAGE]);

  // Reset to page 1 when category changes
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedCategory]);

  const handleDiaryDeleted = () => {
    // Refetch diaries after deletion
    const fetchDiaries = async () => {
      if (!token) return;

      try {
        setIsLoading(true);
        const offset = (currentPage - 1) * ITEMS_PER_PAGE;
        let url = `/api/diaries?limit=${ITEMS_PER_PAGE}&offset=${offset}`;

        if (selectedCategory !== "전체") {
          url += `&category=${encodeURIComponent(selectedCategory)}`;
        }

        const response = await fetch(url, {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        const data = await response.json();

        if (data.success) {
          setEntries(data.data);
          const total = data.total || 0;
          setTotalPages(Math.ceil(total / ITEMS_PER_PAGE));

          // If current page is empty and not the first page, go to previous page
          if (data.data.length === 0 && currentPage > 1) {
            setCurrentPage(prev => prev - 1);
          }
        }
      } catch (error) {
        console.error('Error fetching diaries:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDiaries();
  };

  const handleEditCategory = async (category: Category) => {
    if (category.name === '전체') {
      alert('"전체" 카테고리는 수정할 수 없습니다.');
      return;
    }

    const newName = prompt(`"${category.name}" 카테고리 이름을 변경하세요:`, category.name);

    if (!newName || newName === category.name) return;

    if (!newName.trim()) {
      alert('카테고리 이름을 입력해주세요.');
      return;
    }

    if (newName.length > 50) {
      alert('카테고리 이름은 50자 이하여야 합니다.');
      return;
    }

    try {
      const response = await fetch(`/api/categories/${category.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ name: newName }),
      });

      const data = await response.json();

      if (data.success) {
        alert('카테고리가 수정되었습니다.');
        await fetchCategories();
        // If we're viewing the edited category, update selection
        if (selectedCategory === category.name) {
          setSelectedCategory(newName);
        }
      } else {
        alert(`수정 실패: ${data.error?.message || '알 수 없는 오류'}`);
      }
    } catch (error) {
      console.error('Edit category error:', error);
      alert('카테고리 수정 중 오류가 발생했습니다.');
    }
  };

  const handleDeleteCategory = async (category: Category) => {
    if (category.name === '전체') {
      alert('"전체" 카테고리는 삭제할 수 없습니다.');
      return;
    }

    const confirmed = confirm(
      `"${category.name}" 카테고리를 삭제하시겠습니까?\n이 카테고리의 모든 다이어리는 유지되며, 카테고리만 삭제됩니다.`
    );

    if (!confirmed) return;

    try {
      const response = await fetch(`/api/categories/${category.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (data.success) {
        alert('카테고리가 삭제되었습니다.');
        await fetchCategories();
        // If we're viewing the deleted category, switch to "전체"
        if (selectedCategory === category.name) {
          setSelectedCategory('전체');
        }
      } else {
        alert(`삭제 실패: ${data.error?.message || '알 수 없는 오류'}`);
      }
    } catch (error) {
      console.error('Delete category error:', error);
      alert('카테고리 삭제 중 오류가 발생했습니다.');
    }
  };

  // Group entries by category for "전체" view
  const groupedEntries: GroupedEntries = {};
  if (selectedCategory === "전체") {
    entries.forEach(entry => {
      if (!groupedEntries[entry.category]) {
        groupedEntries[entry.category] = [];
      }
      groupedEntries[entry.category].push(entry);
    });
  }

  const filtered = entries;

  return (
    <>
      {/* Landing Section with Video Background */}
      <section className="landing-section">
        <video autoPlay loop muted playsInline className="landing-video">
          <source src="/assets/landing-background.mp4" type="video/mp4" />
        </video>
        <div className="landing-overlay"></div>
        <div className="landing-content">
          <TypeAnimation
            sequence={[
              'Hello, Subin.\nWelcome to Subin World✨',
              1000,
              ' '
              ,1000,
            ]}
            wrapper="h1"
            speed={50}
            className="typing-text"
            repeat={Infinity}
          />
        </div>
      </section>

      {/* Main Diary Section */}
      <div className="main-container">
        {/* Header */}
        <header className="main-header">
        <div className="header-title-group">
          <Image
            src="/assets/duck_v8.png"
            alt="Duck"
            width={60}
            height={60}
            className="header-duck-image"
            priority
            onDoubleClick={() => setIsArchiveOpen(true)}
            style={{ cursor: 'pointer' }}
          />
          <div>
            <h1 className="main-title">{username ?? 'NoName'}'s Secret World</h1>
          </div>
        </div>
        <Link href="/write" className="cute-button write-button">
          <PenLine size={20} strokeWidth={2.5} className="lucide-icon" /> <span className="write-button-text">새 글 쓰기</span>
        </Link>
      </header>

      {/* Categories */}
      <nav className="categories-nav">
        {categories.map(c => (
          <div key={c.id} className="category-item">
            <button
              onClick={() => setSelectedCategory(c.name)}
              className={`category-button ${selectedCategory === c.name ? 'active' : ''}`}
            >
              {c.name}
            </button>
            {c.name !== '전체' && (
              <div className="category-actions">
                <button
                  className="category-action-btn edit-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleEditCategory(c);
                  }}
                  title="카테고리 수정"
                >
                  <Edit2 size={14} strokeWidth={2.5} />
                </button>
                <button
                  className="category-action-btn delete-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteCategory(c);
                  }}
                  title="카테고리 삭제"
                >
                  <Trash2 size={14} strokeWidth={2.5} />
                </button>
              </div>
            )}
          </div>
        ))}
      </nav>

      {/* Responsive Diary Grid */}
      {isLoading ? (
        <div className="empty-state">
          <p className="empty-state-text">불러오는 중...</p>
        </div>
      ) : (
        <>
          {selectedCategory === "전체" ? (
            /* Grouped by category view */
            Object.keys(groupedEntries).length === 0 ? (
              <div className="empty-state">
                <p className="empty-state-text">아직 다이어리가 없어요!<br />새 일기를 써볼까요?</p>
              </div>
            ) : (
              Object.entries(groupedEntries).map(([category, categoryEntries]) => (
                <div key={category} className="category-section">
                  <h2 className="category-section-title">{category}</h2>
                  <div className="diary-grid">
                    {categoryEntries.map(entry => (
                      <DiaryCover key={entry.id} entry={entry} onDelete={handleDiaryDeleted} />
                    ))}
                  </div>
                </div>
              ))
            )
          ) : (
            /* Single category view with pagination */
            <>
              <div className="diary-grid">
                {filtered.map(entry => (
                  <DiaryCover key={entry.id} entry={entry} onDelete={handleDiaryDeleted} />
                ))}
              </div>

              {filtered.length === 0 && (
                <div className="empty-state">
                  <p className="empty-state-text">아직 다이어리가 없어요!<br />새 일기를 써볼까요?</p>
                </div>
              )}

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="pagination-container">
                  <button
                    className="pagination-button"
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                  >
                    ← 이전
                  </button>
                  <div className="pagination-info">
                    {currentPage} / {totalPages}
                  </div>
                  <button
                    className="pagination-button"
                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                    disabled={currentPage === totalPages}
                  >
                    다음 →
                  </button>
                </div>
              )}
            </>
          )}
        </>
      )}

      {/* Archive Modal */}
      <ArchiveModal isOpen={isArchiveOpen} onClose={() => setIsArchiveOpen(false)} />
    </div>
    </>
  );
}
