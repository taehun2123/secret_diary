import { NextRequest, NextResponse } from 'next/server';
import { getUserById, createUser, getUsers } from '@/lib/db';
import { comparePassword, generateToken, hashPassword } from '@/lib/auth';
import { User } from '@/lib/types';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { password, username } = body;

    if (!password) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'BAD_REQUEST',
            message: 'Password is required',
          },
        },
        { status: 400 }
      );
    }

    // Get all users
    const users = await getUsers();

    // For MVP: Single user system
    // If no users exist, create default user with provided password
    if (users.length === 0) {
      const hashedPassword = await hashPassword(password);
      const newUser: User = {
        id: 'default-user',
        passwordHash: hashedPassword,
        username: username || 'User',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      await createUser(newUser);

      const token = generateToken(newUser.id);

      return NextResponse.json({
        success: true,
        token,
        user: {
          id: newUser.id,
          username: newUser.username,
          createdAt: newUser.createdAt,
        },
      });
    }

    // Verify password with existing user
    const user = users[0]; // MVP: Only one user
    const isValid = await comparePassword(password, user.passwordHash);

    if (!isValid) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'UNAUTHORIZED',
            message: 'Invalid password',
          },
        },
        { status: 401 }
      );
    }

    const token = generateToken(user.id);

    return NextResponse.json({
      success: true,
      token,
      user: {
        id: user.id,
        username: user.username,
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
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
