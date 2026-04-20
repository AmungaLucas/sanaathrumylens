// src/app/api/events/route.js
// GET: List upcoming events
import { query, initDatabase } from '@/lib/db';
import { formatEvent, successResponse, errorResponse } from '@/lib/apiHelper';

// ISR: Revalidate cached responses every 60 seconds
export const revalidate = 60;

let dbReady = false;
let dbAvailable = false;
async function ensureDb() {
  if (!dbReady) {
    dbAvailable = await initDatabase();
    dbReady = true;
  }
  return dbAvailable;
}

export async function GET(request) {
  try {
    const dbOk = await ensureDb();
    if (!dbOk) {
      return successResponse({ events: [] });
    }

    const { searchParams } = new URL(request.url);
    const limit = searchParams.get('limit') || '';
    const status = searchParams.get('status') || 'published';

    let sql = `
      SELECT *
      FROM events
      WHERE status = ? AND is_deleted = 0
    `;
    const values = [status];

    // Only show events with start_date in the future by default
    const upcomingOnly = searchParams.get('upcoming') !== 'false';
    if (upcomingOnly) {
      sql += ' AND start_date >= CURRENT_TIMESTAMP';
    }

    sql += ' ORDER BY start_date ASC';

    if (limit) {
      sql += ' LIMIT ?';
      values.push(parseInt(limit, 10));
    }

    const rows = await query(sql, values);
    const events = Array.isArray(rows) ? rows.map(formatEvent) : [];

    return successResponse({ events });
  } catch (err) {
    console.error('Error fetching events:', err);
    return errorResponse('Failed to fetch events', 500);
  }
}
