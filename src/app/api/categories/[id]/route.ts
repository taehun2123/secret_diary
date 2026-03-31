import { NextRequest, NextResponse } from 'next/server';
import { verifyToken, extractTokenFromHeader } from '@/lib/auth';
import { deleteCategory, updateCategory } from '@/lib/db';
import { supabase } from '@/lib/supabase';

// PUT /api/categories/:id - Update category
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

    // Verify category ownership
    const { data: category, error: fetchError } = await supabase
      .from('categories')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError || !category) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Category not found',
          },
        },
        { status: 404 }
      );
    }

    if (category.userId !== payload.userId) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'FORBIDDEN',
            message: 'Not authorized to update this category',
          },
        },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { name } = body;

    // Validation
    if (!name || typeof name !== 'string') {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Category name is required',
          },
        },
        { status: 400 }
      );
    }

    if (name.length > 50) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Category name must be less than 50 characters',
          },
        },
        { status: 400 }
      );
    }

    const updated = await updateCategory(id, {
      name,
      updatedAt: new Date().toISOString(),
    });

    if (!updated) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Category not found',
          },
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: updated,
    });
  } catch (error: any) {
    console.error('Update category error:', error);

    // Handle unique constraint violation
    if (error?.code === '23505') {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'DUPLICATE_CATEGORY',
            message: 'Category with this name already exists',
          },
        },
        { status: 409 }
      );
    }

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

// DELETE /api/categories/:id - Delete category
export async function DELETE(
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

    // Verify category ownership
    const { data: category, error: fetchError } = await supabase
      .from('categories')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError || !category) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Category not found',
          },
        },
        { status: 404 }
      );
    }

    if (category.userId !== payload.userId) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'FORBIDDEN',
            message: 'Not authorized to delete this category',
          },
        },
        { status: 403 }
      );
    }

    await deleteCategory(id);

    return NextResponse.json({
      success: true,
      message: 'Category deleted successfully',
    });
  } catch (error) {
    console.error('Delete category error:', error);
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
