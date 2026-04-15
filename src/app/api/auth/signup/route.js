// src/app/api/auth/signup/route.js
import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { query, initDatabase } from '@/lib/db';
import { generateToken, createSessionCookie } from '@/lib/auth';

// Ensure database is initialized (lazy init for API routes)
let dbReady = false;
let dbAvailable = false;
async function ensureDb() {
  if (!dbReady) {
    dbAvailable = await initDatabase();
    dbReady = true;
  }
  return dbAvailable;
}

export async function POST(request) {
  try {
    const dbOk = await ensureDb();
    if (!dbOk) {
      return NextResponse.json(
        { error: 'Service temporarily unavailable' },
        { status: 503 }
      );
    }

    const { email, password, displayName } = await request.json();

    // Validate input
    if (!email || !password || !displayName) {
      return NextResponse.json(
        { error: 'Email, password, and display name are required' },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: 'Password must be at least 6 characters long' },
        { status: 400 }
      );
    }

    if (!/\S+@\S+\.\S+/.test(email)) {
      return NextResponse.json(
        { error: 'Please provide a valid email address' },
        { status: 400 }
      );
    }

    // Check if email already exists
    const existingUsers = await query('SELECT id FROM users WHERE email = ?', [email]);

    if (Array.isArray(existingUsers) && existingUsers.length > 0) {
      return NextResponse.json(
        { error: 'An account with this email already exists' },
        { status: 409 }
      );
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // Generate a slug from display name
    const slug = displayName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
      + '-' + Date.now().toString(36);

    // Create user
    const result = await query(
      `INSERT INTO users (email, password_hash, display_name, slug, roles, is_public, bookmarks_count, likes_count, comments_count)
       VALUES (?, ?, ?, ?, ?, 1, 0, 0, 0)`,
      [email, passwordHash, displayName, slug, JSON.stringify(['user'])]
    );

    const userId = result.insertId;

    // Generate JWT token
    const roles = ['user'];
    const token = generateToken({
      userId,
      email,
      displayName,
      roles,
    });

    // Set cookie and return user data
    const cookie = createSessionCookie(token);
    const response = NextResponse.json({
      success: true,
      user: {
        id: userId,
        email,
        displayName,
        avatar: null,
        bio: null,
        slug,
        roles,
        isPublic: true,
        bookmarksCount: 0,
        likesCount: 0,
        commentsCount: 0,
      },
    });

    response.cookies.set(cookie.name, cookie.value, cookie.options);
    return response;

  } catch (error) {
    console.error('Signup error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
