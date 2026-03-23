"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { PenLine } from "lucide-react";
import DiaryCover from "@/components/DiaryCover";
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
  const [categories, setCategories] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const { token, username } = useAuth();
  const ITEMS_PER_PAGE = 8;

  // Fetch categories from DB
  useEffect(() => {
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
          const categoryNames = data.data.map((cat: Category) => cat.name);
          setCategories(["전체", ...categoryNames]);
        }
      } catch (error) {
        console.error('Error fetching categories:', error);
        setCategories(["전체"]); // Fallback to just "전체"
      }
    };

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
    <div className="main-container">
      {/* Header */}
      <header className="main-header">
        <div className="header-title-group">
          <Image src="/assets/duck_v8.png" alt="Duck" width={60} height={60} className="header-duck-image" priority />
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
          <button
            key={c}
            onClick={() => setSelectedCategory(c)}
            className={`category-button ${selectedCategory === c ? 'active' : ''}`}
          >
            {c}
          </button>
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
    </div>
  );
}
