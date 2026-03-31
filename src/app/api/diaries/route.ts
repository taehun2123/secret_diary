import { NextRequest, NextResponse } from 'next/server';
import { verifyToken, extractTokenFromHeader } from '@/lib/auth';
import { getDiariesByUserId, createDiary } from '@/lib/db';
import { DiaryEntry } from '@/lib/types';

// GET /api/diaries - Get all diaries for authenticated user
export async function GET(request: NextRequest) {
  try {
    const authorization = request.headers.get('authorization');
    const token = extractTokenFromHeader(authorization);

    if (!token) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'UNAUTHORIZED',
            message: 'Authentication required',
          },
        },
        { status: 401 }
      );
    }

    const payload = verifyToken(token);
    if (!payload) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'UNAUTHORIZED',
            message: 'Invalid or expired token',
          },
        },
        { status: 401 }
      );
    }

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');
    const category = searchParams.get('category') || undefined;
    const isHiddenParam = searchParams.get('isHidden');
    const isHidden = isHiddenParam === 'true' ? true : isHiddenParam === 'false' ? false : undefined;

    const { diaries, total } = await getDiariesByUserId(payload.userId, {
      limit,
      offset,
      category,
      isHidden,
    });

    return NextResponse.json({
      success: true,
      data: diaries,
      total,
      limit,
      offset,
    });
  } catch (error) {
    console.error('Get diaries error:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Internal server error',
        },
      },
      { status: 500 }
    );
  }
}

// POST /api/diaries - Create new diary
export async function POST(request: NextRequest) {
  try {
    const authorization = request.headers.get('authorization');
    const token = extractTokenFromHeader(authorization);

    if (!token) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'UNAUTHORIZED',
            message: 'Authentication required',
          },
        },
        { status: 401 }
      );
    }

    const payload = verifyToken(token);
    if (!payload) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'UNAUTHORIZED',
            message: 'Invalid or expired token',
          },
        },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { title, content, category, date, music, images } = body;

    // Validation
    if (!title || !content || !category) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Title, content, and category are required',
          },
        },
        { status: 400 }
      );
    }

    if (title.length > 200) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Title must be less than 200 characters',
          },
        },
        { status: 400 }
      );
    }

    if (content.length > 10000) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Content must be less than 10000 characters',
          },
        },
        { status: 413 }
      );
    }

    const now = new Date();
    const diaryDate = date || now.toISOString().split('T')[0].replace(/-/g, '.');

    const newDiary: DiaryEntry = {
      id: Date.now().toString(),
      userId: payload.userId,
      title,
      content,
      category,
      date: diaryDate,
      music: music || null,
      images: images || [],
      coverStickers: [],
      uploadedStickers: [],
      isHidden: false,
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
    };

    const created = await createDiary(newDiary);

    return NextResponse.json(
      {
        success: true,
        data: created,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Create diary error:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Internal server error',
        },
      },
      { status: 500 }
    );
  }
}
