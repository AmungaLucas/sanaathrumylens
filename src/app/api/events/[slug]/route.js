// src/app/api/events/[slug]/route.js
// GET: Fetch a single event by slug
import { query, initDatabase } from '@/lib/db';
import { formatEvent, successResponse, errorResponse } from '@/lib/apiHelper';

let dbReady = false;
let dbAvailable = false;
async function ensureDb() {
  if (!dbReady) {
    dbAvailable = await initDatabase();
    dbReady = true;
  }
  return dbAvailable;
}

export async function GET(request, { params }) {
  try {
    const dbOk = await ensureDb();
    if (!dbOk) {
      return errorResponse('Event not found', 404);
    }
    const { slug } = await params;

    if (!slug) {
      return errorResponse('Event slug is required', 400);
    }

    const rows = await query(
      `SELECT * FROM events
       WHERE slug = ? AND status = 'published' AND is_deleted = 0
       LIMIT 1`,
      [slug]
    );

    if (!Array.isArray(rows) || rows.length === 0) {
      return errorResponse('Event not found', 404);
    }

    const event = formatEvent(rows[0]);

    return successResponse(event);
  } catch (err) {
    console.error('Error fetching event:', err);
    return errorResponse('Failed to fetch event', 500);
  }
}
