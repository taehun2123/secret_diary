import { NextRequest, NextResponse } from 'next/server';
import { verifyToken, extractTokenFromHeader } from '@/lib/auth';
import { getDiaryById, updateDiary, deleteDiary } from '@/lib/db';
import { createClient } from '@supabase/supabase-js';

function getAdminSupabase() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error('Missing Supabase admin environment variables');
  }

  return createClient(supabaseUrl, serviceRoleKey);
}

// GET /api/diaries/:id - Get specific diary
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
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

    const diary = await getDiaryById(id);

    if (!diary) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Diary not found',
          },
        },
        { status: 404 }
      );
    }

    if (diary.userId !== payload.userId) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'FORBIDDEN',
            message: 'Not authorized to access this diary',
          },
        },
        { status: 403 }
      );
    }

    return NextResponse.json({
      success: true,
      data: diary,
    });
  } catch (error) {
    console.error('Get diary error:', error);
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

// PUT /api/diaries/:id - Update diary
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
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

    const diary = await getDiaryById(id);

    if (!diary) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Diary not found',
          },
        },
        { status: 404 }
      );
    }

    if (diary.userId !== payload.userId) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'FORBIDDEN',
            message: 'Not authorized to update this diary',
          },
        },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { title, content, category, music, images, isHidden } = body;

    // Validation
    if (title && title.length > 200) {
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

    if (content && content.length > 10000) {
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

    if (isHidden !== undefined && typeof isHidden !== 'boolean') {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'isHidden must be a boolean',
          },
        },
        { status: 400 }
      );
    }

    const updates: any = {};
    if (title !== undefined) updates.title = title;
    if (content !== undefined) updates.content = content;
    if (category !== undefined) updates.category = category;
    if (music !== undefined) updates.music = music;
    if (images !== undefined) updates.images = images;
    if (isHidden !== undefined) updates.isHidden = isHidden;

    const updated = await updateDiary(id, updates);

    return NextResponse.json({
      success: true,
      data: updated,
    });
  } catch (error) {
    console.error('Update diary error:', error);
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

// DELETE /api/diaries/:id - Delete diary
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = getAdminSupabase();
    const { id } = await params;
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

    const diary = await getDiaryById(id);

    if (!diary) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Diary not found',
          },
        },
        { status: 404 }
      );
    }

    if (diary.userId !== payload.userId) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'FORBIDDEN',
            message: 'Not authorized to delete this diary',
          },
        },
        { status: 403 }
      );
    }

    // Delete images from Supabase Storage if they exist
    if (diary.images && diary.images.length > 0) {
      const imagePaths: string[] = [];

      for (const imageUrl of diary.images) {
        // Extract path from Supabase Storage URL
        // URL format: https://xxx.supabase.co/storage/v1/object/public/diary-images/userId/filename.jpg
        const match = imageUrl.match(/diary-images\/(.+)$/);
        if (match && match[1]) {
          imagePaths.push(match[1]);
        }
      }

      if (imagePaths.length > 0) {
        const { error: storageError } = await supabase.storage
          .from('diary-images')
          .remove(imagePaths);

        if (storageError) {
          console.error('Error deleting images from storage:', storageError);
          // Continue with diary deletion even if image deletion fails
        }
      }
    }

    await deleteDiary(id);

    return NextResponse.json({
      success: true,
      message: 'Diary entry deleted successfully',
    });
  } catch (error) {
    console.error('Delete diary error:', error);
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
