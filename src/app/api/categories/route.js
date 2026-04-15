// src/app/api/categories/route.js
// GET: List active categories
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
      `SELECT c.*,
              (SELECT COUNT(*) FROM posts p WHERE p.category_ids LIKE CONCAT('%"', c.id, '"%') AND p.status = 'published' AND p.is_deleted = 0) as post_count
       FROM categories c
       WHERE c.is_active = 1
       ORDER BY c.name ASC`
    );

    const categories = Array.isArray(rows)
      ? rows.map((row) => ({
          id: row.id,
          name: row.name,
          slug: row.slug,
          description: row.description,
          isActive: Boolean(row.is_active),
          postCount: row.post_count || 0,
          createdAt: row.created_at ? new Date(row.created_at).toISOString() : null,
          updatedAt: row.updated_at ? new Date(row.updated_at).toISOString() : null,
        }))
      : [];

    return successResponse({ categories });
  } catch (err) {
    console.error('Error fetching categories:', err);
    return errorResponse('Failed to fetch categories', 500);
  }
}
