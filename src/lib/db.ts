import { supabase } from './supabase';
import { DiaryEntry, User, Category } from './types';

// User operations
export async function getUsers(): Promise<User[]> {
  const { data, error } = await supabase
    .from('users')
    .select('*');

  if (error) {
    console.error('Error fetching users:', error);
    throw error;
  }

  return data || [];
}

export async function getUserById(userId: string): Promise<User | null> {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', userId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      // No rows returned
      return null;
    }
    console.error('Error fetching user:', error);
    throw error;
  }

  return data;
}

export async function createUser(user: User): Promise<User> {
  const { data, error } = await supabase
    .from('users')
    .insert([user])
    .select()
    .single();

  if (error) {
    console.error('Error creating user:', error);
    throw error;
  }

  return data;
}

export async function updateUser(userId: string, updates: Partial<User>): Promise<User | null> {
  const { data, error } = await supabase
    .from('users')
    .update(updates)
    .eq('id', userId)
    .select()
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return null;
    }
    console.error('Error updating user:', error);
    throw error;
  }

  return data;
}

// Diary operations
export async function getDiaries(): Promise<DiaryEntry[]> {
  const { data, error } = await supabase
    .from('diaries')
    .select('*')
    .order('createdAt', { ascending: false });

  if (error) {
    console.error('Error fetching diaries:', error);
    throw error;
  }

  return data || [];
}

export async function getDiariesByUserId(
  userId: string,
  options?: { limit?: number; offset?: number; category?: string }
): Promise<{ diaries: DiaryEntry[]; total: number }> {
  let query = supabase
    .from('diaries')
    .select('*', { count: 'exact' })
    .eq('userId', userId);

  // Filter by category if provided
  if (options?.category) {
    query = query.eq('category', options.category);
  }

  // Apply sorting
  query = query.order('createdAt', { ascending: false });

  // Apply pagination
  const offset = options?.offset || 0;
  const limit = options?.limit || 50;
  query = query.range(offset, offset + limit - 1);

  const { data, error, count } = await query;

  if (error) {
    console.error('Error fetching diaries:', error);
    throw error;
  }

  return {
    diaries: data || [],
    total: count || 0,
  };
}

export async function getDiaryById(diaryId: string): Promise<DiaryEntry | null> {
  const { data, error } = await supabase
    .from('diaries')
    .select('*')
    .eq('id', diaryId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return null;
    }
    console.error('Error fetching diary:', error);
    throw error;
  }

  return data;
}

export async function createDiary(diary: DiaryEntry): Promise<DiaryEntry> {
  const { data, error } = await supabase
    .from('diaries')
    .insert([diary])
    .select()
    .single();

  if (error) {
    console.error('Error creating diary:', error);
    throw error;
  }

  return data;
}

export async function updateDiary(
  diaryId: string,
  updates: Partial<DiaryEntry>
): Promise<DiaryEntry | null> {
  const { data, error } = await supabase
    .from('diaries')
    .update(updates)
    .eq('id', diaryId)
    .select()
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return null;
    }
    console.error('Error updating diary:', error);
    throw error;
  }

  return data;
}

export async function deleteDiary(diaryId: string): Promise<boolean> {
  const { error } = await supabase
    .from('diaries')
    .delete()
    .eq('id', diaryId);

  if (error) {
    console.error('Error deleting diary:', error);
    return false;
  }

  return true;
}

// Category operations
export async function getCategoriesByUserId(userId: string): Promise<Category[]> {
  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .eq('userId', userId)
    .order('createdAt', { ascending: true });

  if (error) {
    console.error('Error fetching categories:', error);
    throw error;
  }

  return data || [];
}

export async function createCategory(category: Category): Promise<Category> {
  const { data, error } = await supabase
    .from('categories')
    .insert([category])
    .select()
    .single();

  if (error) {
    console.error('Error creating category:', error);
    throw error;
  }

  return data;
}

export async function updateCategory(
  categoryId: string,
  updates: Partial<Category>
): Promise<Category | null> {
  const { data, error } = await supabase
    .from('categories')
    .update(updates)
    .eq('id', categoryId)
    .select()
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return null;
    }
    console.error('Error updating category:', error);
    throw error;
  }

  return data;
}

export async function deleteCategory(categoryId: string): Promise<boolean> {
  const { error } = await supabase
    .from('categories')
    .delete()
    .eq('id', categoryId);

  if (error) {
    console.error('Error deleting category:', error);
    return false;
  }

  return true;
}
