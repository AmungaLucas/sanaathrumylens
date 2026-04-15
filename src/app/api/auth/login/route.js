// src/app/api/auth/login/route.js
import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { query, getDbType, initDatabase } from '@/lib/db';
import { generateToken, createSessionCookie } from '@/lib/auth';

// Ensure database is initialized (lazy init for API routes)
let dbReady = false;
async function ensureDb() {
  if (!dbReady) {
    await initDatabase();
    dbReady = true;
  }
}

export async function POST(request) {
  try {
    await ensureDb();

    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    // Find user by email
    const users = await query('SELECT * FROM users WHERE email = ?', [email]);

    if (!Array.isArray(users) || users.length === 0) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    const user = users[0];

    // Compare password
    const isPasswordValid = await bcrypt.compare(password, user.password_hash);
    if (!isPasswordValid) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    // Parse roles (stored as JSON string in SQLite, or JSON in MySQL)
    let roles = ['user'];
    try {
      roles = typeof user.roles === 'string' ? JSON.parse(user.roles) : (user.roles || ['user']);
    } catch {
      roles = ['user'];
    }

    // Generate JWT token
    const token = generateToken({
      userId: user.id,
      email: user.email,
      displayName: user.display_name,
      roles,
      avatar: user.avatar,
    });

    // Update last_login timestamp
    await query('UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = ?', [user.id]);

    // Set cookie and return user data
    const cookie = createSessionCookie(token);
    const response = NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        displayName: user.display_name,
        avatar: user.avatar,
        bio: user.bio,
        slug: user.slug,
        roles,
        isPublic: Boolean(user.is_public),
        bookmarksCount: user.bookmarks_count,
        likesCount: user.likes_count,
        commentsCount: user.comments_count,
        createdAt: user.created_at,
        lastLogin: user.last_login,
      },
    });

    response.cookies.set(cookie.name, cookie.value, cookie.options);
    return response;

  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
