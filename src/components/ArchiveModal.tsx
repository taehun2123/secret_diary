"use client";
import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import DiaryCover from './DiaryCover';
import { useAuth } from './AuthProvider';

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

interface ArchiveModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ArchiveModal({ isOpen, onClose }: ArchiveModalProps) {
  const [hiddenEntries, setHiddenEntries] = useState<DiaryEntry[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { token } = useAuth();

  useEffect(() => {
    if (!isOpen || !token) return;

    const fetchHiddenDiaries = async () => {
      setIsLoading(true);
      try {
        // Fetch hidden diaries by adding isHidden=true parameter
        const response = await fetch('/api/diaries?isHidden=true&limit=100', {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        const data = await response.json();

        if (data.success) {
          setHiddenEntries(data.data);
        } else {
          console.error('Failed to fetch hidden diaries:', data.error);
        }
      } catch (error) {
        console.error('Error fetching hidden diaries:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchHiddenDiaries();
  }, [isOpen, token]);

  const handleDiaryRestored = () => {
    // Refetch hidden diaries after restoration
    const fetchHiddenDiaries = async () => {
      if (!token) return;

      setIsLoading(true);
      try {
        const response = await fetch('/api/diaries?isHidden=true&limit=100', {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        const data = await response.json();

        if (data.success) {
          setHiddenEntries(data.data);
        }
      } catch (error) {
        console.error('Error fetching hidden diaries:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchHiddenDiaries();
  };

  if (!isOpen) return null;

  return (
    <div className="archive-modal-overlay" onClick={onClose}>
      <div className="archive-modal-content" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="archive-modal-header">
          <h2 className="archive-modal-title">📦 보관함</h2>
          <button className="archive-modal-close" onClick={onClose}>
            <X size={24} strokeWidth={2.5} />
          </button>
        </div>

        {/* Content */}
        <div className="archive-modal-body">
          {isLoading ? (
            <div className="archive-loading">불러오는 중...</div>
          ) : hiddenEntries.length === 0 ? (
            <div className="archive-empty">
              <p>숨김 처리된 다이어리가 없습니다.</p>
            </div>
          ) : (
            <div className="archive-grid">
              {hiddenEntries.map(entry => (
                <DiaryCover
                  key={entry.id}
                  entry={entry}
                  onDelete={handleDiaryRestored}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
