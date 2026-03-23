import { NextResponse } from 'next/server';
import { getUsers } from '@/lib/db';

export async function GET() {
  try {
    const users = await getUsers();
    return NextResponse.json({
      success: true,
      hasUser: users.length > 0,
    });
  } catch (error) {
    console.error('Auth status check error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
