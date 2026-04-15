// src/app/api/posts/route.js
// GET: List published posts with filtering, sorting, pagination
import { query, initDatabase } from '@/lib/db';
import { buildPostQuery, buildPostCountQuery, formatPost, successResponse, errorResponse } from '@/lib/apiHelper';

let dbReady = false;
async function ensureDb() {
  if (!dbReady) {
    await initDatabase();
    dbReady = true;
  }
}

const BASE_SELECT = `
  SELECT p.*, a.name as author_name, a.slug as author_slug, a.avatar as author_avatar, a.bio as author_bio
  FROM posts p
  LEFT JOIN authors a ON p.author_id = a.id
`;

export async function GET(request) {
  try {
    await ensureDb();

    const { searchParams } = new URL(request.url);
    const params = {
      limit: searchParams.get('limit') || '',
      page: searchParams.get('page') || '',
      sort: searchParams.get('sort') || 'publishedAt',
      sortDir: searchParams.get('sortDir') || 'desc',
      category: searchParams.get('category') || '',
      tag: searchParams.get('tag') || '',
      search: searchParams.get('search') || '',
      featured: searchParams.get('featured') || '',
      status: searchParams.get('status') || 'published',
    };

    const { sql, values } = buildPostQuery(BASE_SELECT, params);
    const rows = await query(sql, values);

    // Get total count for pagination
    const { sql: countSql, values: countValues } = buildPostCountQuery(params);
    const countResult = await query(countSql, countValues);
    const total = Array.isArray(countResult) && countResult.length > 0 ? countResult[0].total : 0;

    const posts = Array.isArray(rows) ? rows.map(formatPost) : [];

    const page = params.page ? parseInt(params.page, 10) : 1;
    const limit = params.limit ? parseInt(params.limit, 10) : posts.length;
    const totalPages = limit > 0 ? Math.ceil(total / limit) : 1;

    return successResponse({
      posts,
      pagination: {
        page,
        limit,
        total,
        totalPages,
      },
    });
  } catch (err) {
    console.error('Error fetching posts:', err);
    return errorResponse('Failed to fetch posts', 500);
  }
}
