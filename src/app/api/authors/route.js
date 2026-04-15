// src/app/api/authors/route.js
// GET: List all authors
import { query, initDatabase } from '@/lib/db';
import { successResponse, errorResponse } from '@/lib/apiHelper';

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

    const rows = await query(
      `SELECT a.*, 
              (SELECT COUNT(*) FROM posts p WHERE p.author_id = a.id AND p.status = 'published' AND p.is_deleted = 0) as post_count
       FROM authors a
       ORDER BY a.name ASC`
    );

    const authors = Array.isArray(rows)
      ? rows.map((row) => ({
          id: row.id,
          slug: row.slug,
          name: row.name,
          bio: row.bio,
          avatar: row.avatar,
          postCount: row.post_count || 0,
          createdAt: row.created_at ? new Date(row.created_at).toISOString() : null,
          updatedAt: row.updated_at ? new Date(row.updated_at).toISOString() : null,
        }))
      : [];

    return successResponse({ authors });
  } catch (err) {
    console.error('Error fetching authors:', err);
    return errorResponse('Failed to fetch authors', 500);
  }
}
