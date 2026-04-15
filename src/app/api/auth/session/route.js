// src/app/api/auth/session/route.js
import { NextResponse } from 'next/server';
import { query, initDatabase } from '@/lib/db';
import { getTokenFromCookie, verifyToken } from '@/lib/auth';

// Ensure database is initialized (lazy init for API routes)
let dbReady = false;
async function ensureDb() {
  if (!dbReady) {
    await initDatabase();
    dbReady = true;
  }
}

export async function GET(request) {
  try {
    await ensureDb();

    // Get token from cookie
    const token = getTokenFromCookie(request);

    if (!token) {
      return NextResponse.json({ user: null });
    }

    // Verify token
    const decoded = verifyToken(token);

    if (!decoded) {
      return NextResponse.json({ user: null });
    }

    // Query user from database
    const users = await query(
      'SELECT id, email, display_name, avatar, bio, slug, roles, is_public, bookmarks_count, likes_count, comments_count, created_at, updated_at, last_login FROM users WHERE id = ?',
      [decoded.userId]
    );

    if (!Array.isArray(users) || users.length === 0) {
      return NextResponse.json({ user: null });
    }

    const user = users[0];

    // Parse roles
    let roles = ['user'];
    try {
      roles = typeof user.roles === 'string' ? JSON.parse(user.roles) : (user.roles || ['user']);
    } catch {
      roles = ['user'];
    }

    return NextResponse.json({
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
        updatedAt: user.updated_at,
        lastLogin: user.last_login,
      },
    });

  } catch (error) {
    console.error('Session error:', error);
    return NextResponse.json({ user: null });
  }
}
