// Backend API Types

export interface Sticker {
  id: number;
  src: string;
  x: number;
  y: number;
}

export interface DiaryEntry {
  id: string;
  userId: string;
  title: string;
  content: string;
  category: string;
  date: string;
  music: string | null;
  images: string[];
  coverStickers: Sticker[];
  createdAt: string;
  updatedAt: string;
}

export interface User {
  id: string;
  passwordHash: string;
  username?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Category {
  id: string;
  userId: string;
  name: string;
  createdAt: string;
  updatedAt: string;
}

export interface JWTPayload {
  userId: string;
  iat?: number;
  exp?: number;
}

export interface APIResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
  };
}
