import { NextRequest, NextResponse } from 'next/server';
import { verifyToken, extractTokenFromHeader } from '@/lib/auth';
import { getDiaryById, updateDiary } from '@/lib/db';
import { Sticker } from '@/lib/types';

// PUT /api/diaries/:id/stickers - Update stickers
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
    const { stickers, uploadedStickers } = body;

    if (!Array.isArray(stickers)) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Stickers must be an array',
          },
        },
        { status: 400 }
      );
    }

    // Validate uploadedStickers if provided
    if (uploadedStickers !== undefined && !Array.isArray(uploadedStickers)) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'UploadedStickers must be an array',
          },
        },
        { status: 400 }
      );
    }

    // Validate stickers
    for (const sticker of stickers) {
      if (
        typeof sticker.id !== 'number' ||
        typeof sticker.src !== 'string' ||
        typeof sticker.x !== 'number' ||
        typeof sticker.y !== 'number'
      ) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: 'VALIDATION_ERROR',
              message: 'Invalid sticker data',
            },
          },
          { status: 400 }
        );
      }

      if (sticker.src.length > 500) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: 'VALIDATION_ERROR',
              message: 'Sticker src must be less than 500 characters',
            },
          },
          { status: 400 }
        );
      }

      if (sticker.x < 0 || sticker.x > 100 || sticker.y < 0 || sticker.y > 100) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: 'VALIDATION_ERROR',
              message: 'Sticker position must be between 0 and 100',
            },
          },
          { status: 400 }
        );
      }
    }

    const updateData: any = { coverStickers: stickers };

    // Only update uploadedStickers if provided
    if (uploadedStickers !== undefined) {
      updateData.uploadedStickers = uploadedStickers;
    }

    const updated = await updateDiary(id, updateData);

    return NextResponse.json({
      success: true,
      data: {
        id: updated!.id,
        coverStickers: updated!.coverStickers,
        uploadedStickers: updated!.uploadedStickers,
      },
    });
  } catch (error) {
    console.error('Update stickers error:', error);
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
