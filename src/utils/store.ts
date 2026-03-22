export interface Sticker {
  id: number;
  src: string;
  x: number;
  y: number;
}

export interface DiaryEntry {
  id: string;
  title: string;
  content: string;
  category: string;
  date: string;
  music: string | null;
  coverStickers: Sticker[];
}

export const getEntries = (): DiaryEntry[] => {
  if (typeof window === 'undefined') return [];
  const saved = localStorage.getItem('secret_diary_entries');
  if (saved) return JSON.parse(saved);
  const defaultEntries: DiaryEntry[] = [
    { id: "1", title: "나의 첫 비밀 일기", content: "안녕, 반가워!", category: "일상", date: "2026.03.22", music: "spotify:playlist:37i9dQZF1DX4aYNO8X5RpR", coverStickers: [] },
    { id: "2", title: "오리 가족을 만나다", content: "꽥꽥!", category: "특별한 날", date: "2026.03.21", music: null, coverStickers: [] }
  ];
  localStorage.setItem('secret_diary_entries', JSON.stringify(defaultEntries));
  return defaultEntries;
};

export const saveEntries = (entries: DiaryEntry[]) => {
  localStorage.setItem('secret_diary_entries', JSON.stringify(entries));
};
