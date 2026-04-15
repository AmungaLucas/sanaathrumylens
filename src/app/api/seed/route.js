// src/app/api/seed/route.js
// POST endpoint to seed the database (development only)
import { NextResponse } from 'next/server';
import { initDatabase, query, getDbType } from '@/lib/db';
import { seedDatabase } from '@/lib/seed';

export async function POST() {
  try {
    console.log('🌱 Seed API called');

    // Initialize database
    await initDatabase();
    const dbType = getDbType();

    // Seed data
    await seedDatabase();

    // Get table counts for verification
    const tables = [
      'authors', 'users', 'categories', 'posts', 'events',
      'comments', 'comment_likes', 'post_likes', 'bookmarks', 'subscribers'
    ];

    let counts = {};
    for (const table of tables) {
      try {
        const result = await query(`SELECT COUNT(*) as count FROM ${table}`);
        if (Array.isArray(result)) {
          counts[table] = result[0].count;
        }
      } catch (err) {
        counts[table] = 'error';
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Database seeded successfully',
      backend: dbType,
      counts,
    });

  } catch (error) {
    console.error('Seed error:', error);
    return NextResponse.json(
      { error: 'Failed to seed database: ' + error.message },
      { status: 500 }
    );
  }
}
