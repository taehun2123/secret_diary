"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { Edit3, PenLine, X, Camera, Music, Search, Play } from "lucide-react";
import { useSpotify } from "@/components/SpotifyProvider";
import { useAuth } from "@/components/AuthProvider";

export default function WritePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editId = searchParams.get('edit');
  const isEditMode = !!editId;

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [category, setCategory] = useState("일상");
  const [newCategory, setNewCategory] = useState("");
  const [images, setImages] = useState<string[]>([]);
  // music stored as JSON string of [{uri,name,artist}] or null
  const [music, setMusic] = useState<string | null>(null);
  const [attachedTracks, setAttachedTracks] = useState<{uri:string;name:string;artist:string}[]>([]);
  const [musicSearch, setMusicSearch] = useState("");
  const [musicResults, setMusicResults] = useState<{uri:string;name:string;artist:string;image:string|null}[]>([]);
  const [isMusicSearching, setIsMusicSearching] = useState(false);
  const musicSearchTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadingImages, setUploadingImages] = useState(false);
  const [categories, setCategories] = useState<string[]>([]);

  const { token: spotifyToken, login: spotifyLogin } = useSpotify();
  const { token } = useAuth();
  // useRef for search debounce already defined above
  const ref_musicSearchTimeout = musicSearchTimeout;

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
          const categoryNames = data.data.map((cat: {id: string; name: string}) => cat.name);
          setCategories(categoryNames);
          // Set default category if not in edit mode
          if (!isEditMode && categoryNames.length > 0) {
            setCategory(categoryNames[0]);
          }
        }
      } catch (error) {
        console.error('Error fetching categories:', error);
      }
    };

    fetchCategories();
  }, [token, isEditMode]);

  // Load existing entry if in edit mode
  useEffect(() => {
    const loadEntry = async () => {
      if (isEditMode && editId && token) {
        try {
          const response = await fetch(`/api/diaries/${editId}`, {
            headers: {
              'Authorization': `Bearer ${token}`,
            },
          });

          const data = await response.json();

          if (data.success && data.data) {
            const entry = data.data;
            setTitle(entry.title);
            setContent(entry.content);
            setCategory(entry.category);
            setMusic(entry.music);
            // Also parse into attachedTracks for edit display
            if (entry.music) {
              try {
                const parsed = JSON.parse(entry.music);
                if (Array.isArray(parsed)) setAttachedTracks(parsed);
              } catch { /* legacy string URI, leave empty */ }
            }
            setImages(entry.images || []);
          }
        } catch (error) {
          console.error('Error loading diary:', error);
          alert('일기를 불러오는데 실패했습니다.');
        }
      }
    };

    loadEntry();
  }, [isEditMode, editId, token]);

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;

    if (!token) {
      alert('로그인이 필요합니다.');
      return;
    }

    setUploadingImages(true);

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
        setImages([...images, ...uploadedUrls]);
      }
    } catch (error) {
      console.error('Upload error:', error);
      alert('이미지 업로드 중 오류가 발생했습니다.');
    } finally {
      setUploadingImages(false);
      // Reset file input
      e.target.value = '';
    }
  };

  const removeImage = (index: number) => {
    setImages(images.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!token) {
      alert('로그인이 필요합니다.');
      return;
    }

    setIsSubmitting(true);

    try {
      let finalCategory = category === "custom" ? newCategory : category;

      // If creating a new category, save it to DB first
      if (category === "custom" && newCategory.trim()) {
        try {
          const categoryResponse = await fetch('/api/categories', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`,
            },
            body: JSON.stringify({ name: newCategory.trim() }),
          });

          const categoryData = await categoryResponse.json();

          if (!categoryData.success) {
            // Category might already exist (409) - that's okay, we can still use it
            if (categoryResponse.status !== 409) {
              console.error('Failed to create category:', categoryData.error);
            }
          }

          finalCategory = newCategory.trim();
        } catch (error) {
          console.error('Error creating category:', error);
          // Continue anyway with the category name
        }
      }

      // Serialize attached tracks as JSON
      const finalMusic = attachedTracks.length > 0 ? JSON.stringify(attachedTracks) : null;

      if (isEditMode && editId) {
        // Update existing entry
        const response = await fetch(`/api/diaries/${editId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify({
            title,
            content,
            category: finalCategory,
            music: finalMusic,
            images,
          }),
        });

        const data = await response.json();

        if (data.success) {
          alert("일기가 수정되었습니다!");
          router.push(`/read/${editId}`);
        } else {
          alert(`수정 실패: ${data.error?.message || '알 수 없는 오류'}`);
        }
      } else {
        // Create new entry
        const response = await fetch('/api/diaries', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify({
            title,
            content,
            category: finalCategory,
            music: finalMusic,
            images,
          }),
        });

        const data = await response.json();

        if (data.success) {
          alert("일기가 저장되었습니다!");
          router.push("/");
        } else {
          alert(`저장 실패: ${data.error?.message || '알 수 없는 오류'}`);
        }
      }
    } catch (error) {
      console.error('Submit error:', error);
      alert('일기 저장 중 오류가 발생했습니다.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="write-container">
      <header className="write-header">
        <h1 className="write-title">
          {isEditMode ? <><Edit3 size={24} strokeWidth={2.5} className="lucide-icon" /> 다이어리 수정</> : <><PenLine size={24} strokeWidth={2.5} className="lucide-icon" /> 새 다이어리 작성</>}
        </h1>
        <Link href={isEditMode ? `/read/${editId}` : "/"} className="write-close-button">
          <X size={18} strokeWidth={2.5} className="lucide-icon" /> <span className="close-button-text">닫기</span>
        </Link>
      </header>

      <form onSubmit={handleSubmit} className="write-form">
        <div className="diary-book write-book-section">
          <input
            type="text"
            placeholder="오늘의 다이어리 제목"
            className="cute-input write-title-input"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />

          <div className="write-category-section">
            <span className="category-label">카테고리:</span>
            <select
              className="cute-input category-select"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            >
              {categories.length === 0 && <option value="">카테고리 불러오는 중...</option>}
              {categories.map(c => <option key={c} value={c}>{c}</option>)}
              <option value="custom">직접 입력...</option>
            </select>
            {category === "custom" && (
              <input
                type="text"
                placeholder="새 카테고리 이름 입력"
                className="cute-input custom-category-input"
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value)}
                required
                style={{ marginTop: '10px' }}
              />
            )}
          </div>
        </div>

        <div className="rounded-card">
          <div className="photo-upload-section" style={{ marginBottom: '1rem' }}>
            <label className={`cute-button photo-button ${uploadingImages ? 'disabled' : ''}`}>
              <Camera size={18} strokeWidth={2.5} className="lucide-icon" /> <span className="photo-button-text">{uploadingImages ? '업로드 중...' : '사진 추가'}</span>
              <input
                type="file"
                accept="image/*"
                multiple
                style={{ display: 'none' }}
                onChange={handlePhotoUpload}
                disabled={uploadingImages}
              />
            </label>
            {images.length > 0 && <span className="photo-selected-badge">✓ {images.length}개 선택됨</span>}
          </div>

          {images.length > 0 && (
            <div className="image-gallery">
              {images.map((img, index) => (
                <div key={index} className="image-gallery-item">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={img} alt={`Image ${index + 1}`} className="gallery-image" />
                  <button
                    type="button"
                    className="image-remove-btn"
                    onClick={() => removeImage(index)}
                    title="이미지 삭제"
                  >
                    <X size={14} strokeWidth={3} />
                  </button>
                </div>
              ))}
            </div>
          )}

          <textarea
            placeholder="오늘 하루는 어땠나요? 솜사탕처럼 달콤했나요?"
            className="cute-input write-textarea"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            required
            style={{ marginTop: images.length > 0 ? '1rem' : '0' }}
          />
        </div>

        <div className="rounded-card write-media-section">
          <div className="music-section">
            <div className="music-label"><Music size={18} strokeWidth={2.5} className="lucide-icon" /> 음악 첨부</div>

            {!spotifyToken ? (
              <div className="spotify-login-section">
                <p className="spotify-login-description">Spotify에 로그인하면 음악을 첨부할 수 있어요!</p>
                <button
                  type="button"
                  onClick={spotifyLogin}
                  className="cute-button"
                  style={{
                    marginTop: '10px',
                    background: 'linear-gradient(135deg, var(--yellow-warm), #FFB300)',
                    border: '2px solid #FFB300'
                  }}
                >
                  <Music size={18} strokeWidth={2.5} className="lucide-icon" /> Spotify 로그인
                </button>
              </div>
            ) : (
              <>
                {/* Search input */}
                <div className="music-search-row">
                  <Search size={15} strokeWidth={2.5} style={{ color: '#c07090', flexShrink: 0 }} />
                  <input
                    type="text"
                    className="cute-input music-search-input"
                    placeholder="곡 검색 (예: 아이유, 뉴진스...)"
                    value={musicSearch}
                    onChange={async (e) => {
                      const q = e.target.value;
                      setMusicSearch(q);
                      if (ref_musicSearchTimeout.current) clearTimeout(ref_musicSearchTimeout.current);
                      if (!q.trim()) { setMusicResults([]); return; }
                      ref_musicSearchTimeout.current = setTimeout(async () => {
                        setIsMusicSearching(true);
                        try {
                          const t = localStorage.getItem('spotify_token_v2') || spotifyToken;
                          const res = await fetch(
                            `https://api.spotify.com/v1/search?q=${encodeURIComponent(q)}&type=track&limit=8`,
                            { headers: { Authorization: `Bearer ${t}` } }
                          );
                          const data = await res.json();
                          setMusicResults(
                            (data.tracks?.items || []).map((item: any) => ({
                              uri: item.uri,
                              name: item.name,
                              artist: item.artists?.map((a: any) => a.name).join(', ') || '',
                              image: item.album?.images?.[2]?.url || item.album?.images?.[0]?.url || null,
                            }))
                          );
                        } catch { setMusicResults([]); }
                        finally { setIsMusicSearching(false); }
                      }, 400);
                    }}
                  />
                  {musicSearch && <button type="button" className="music-search-clear" onClick={() => { setMusicSearch(''); setMusicResults([]); }}><X size={13} /></button>}
                </div>

                {/* Search results */}
                {(isMusicSearching || musicResults.length > 0) && (
                  <div className="music-search-results">
                    {isMusicSearching && <p className="music-search-hint">검색 중...</p>}
                    {musicResults.map(r => {
                      const already = attachedTracks.some(t => t.uri === r.uri);
                      return (
                        <button
                          key={r.uri}
                          type="button"
                          className={`music-result-item ${already ? 'selected' : ''}`}
                          onClick={() => {
                            if (already) {
                              setAttachedTracks(prev => prev.filter(t => t.uri !== r.uri));
                            } else {
                              setAttachedTracks(prev => [...prev, { uri: r.uri, name: r.name, artist: r.artist }]);
                            }
                          }}
                        >
                          {r.image
                            /* eslint-disable-next-line @next/next/no-img-element */
                            ? <img src={r.image} alt={r.name} className="music-result-thumb" />
                            : <div className="music-result-thumb music-result-thumb-empty"><Music size={12} /></div>}
                          <div className="music-result-info">
                            <span className="music-result-name">{r.name}</span>
                            <span className="music-result-artist">{r.artist}</span>
                          </div>
                          <span className="music-result-action">{already ? '✓ 추가됨' : '+ 추가'}</span>
                        </button>
                      );
                    })}
                  </div>
                )}

                {/* Attached chips */}
                {attachedTracks.length > 0 && (
                  <div className="music-attached-list">
                    <p className="music-attached-label">첨부된 곡 ({attachedTracks.length}개)</p>
                    {attachedTracks.map((t, i) => (
                      <div key={t.uri + i} className="music-chip">
                        <Play size={10} strokeWidth={2.5} style={{ flexShrink: 0 }} />
                        <span className="music-chip-name">{t.name}</span>
                        <span className="music-chip-artist"> · {t.artist}</span>
                        <button
                          type="button"
                          className="music-chip-remove"
                          onClick={() => setAttachedTracks(prev => prev.filter((_, idx) => idx !== i))}
                        ><X size={11} /></button>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
        <button type="submit" className="cute-button submit-button" disabled={isSubmitting}>
          {isSubmitting
            ? "저장 중..."
            : isEditMode
            ? "수정 완료 💛"
            : "다이어리 등록하기 💛"}
        </button>
      </form>
    </div>
  );
}
