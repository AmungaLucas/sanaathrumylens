// src/app/api/subscribers/route.js
// POST: Subscribe an email address
import { query, initDatabase } from '@/lib/db';
import { successResponse, errorResponse } from '@/lib/apiHelper';

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

    const { email } = await request.json();

    if (!email || !email.trim()) {
      return errorResponse('Email is required', 400);
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      return errorResponse('Please provide a valid email address', 400);
    }

    const normalizedEmail = email.trim().toLowerCase();

    // Check if already subscribed
    const existing = await query(
      'SELECT id, is_active FROM subscribers WHERE email = ?',
      [normalizedEmail]
    );

    if (Array.isArray(existing) && existing.length > 0) {
      const subscriber = existing[0];

      if (subscriber.is_active) {
        return successResponse({ subscribed: true, message: 'You are already subscribed!' });
      }

      // Reactivate the subscription
      await query(
        'UPDATE subscribers SET is_active = 1, subscribed_at = CURRENT_TIMESTAMP WHERE id = ?',
        [subscriber.id]
      );
      return successResponse({ subscribed: true, message: 'Subscription reactivated!' });
    }

    // Insert new subscriber
    await query(
      'INSERT INTO subscribers (email) VALUES (?)',
      [normalizedEmail]
    );

    return successResponse({ subscribed: true, message: 'Successfully subscribed!' }, 201);
  } catch (err) {
    console.error('Error subscribing:', err);

    // Handle duplicate key error
    if (err.code === 'ER_DUP_ENTRY' || err.message?.includes('UNIQUE constraint')) {
      return successResponse({ subscribed: true, message: 'You are already subscribed!' });
    }

    return errorResponse('Failed to subscribe', 500);
  }
}
