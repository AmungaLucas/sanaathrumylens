// setup-db.js
// Database setup and seeding script
// Works with MySQL (primary) or SQLite (fallback)
import { initDatabase, query, getDbType, closeDatabase } from './src/lib/db.js';
import { seedDatabase } from './src/lib/seed.js';

async function setup() {
  console.log('🚀 Sanaathrumylens Database Setup');
  console.log('==================================\n');

  try {
    // Step 1: Initialize database (tries MySQL, falls back to SQLite)
    console.log('📡 Initializing database connection...');
    await initDatabase();
    const dbType = getDbType();
    console.log(`  Using backend: ${dbType}\n`);

    // Step 2: Seed data
    await seedDatabase();
    console.log('');

    // Step 3: Verify
    console.log('📊 Verifying data...');
    const tables = [
      'authors', 'users', 'categories', 'posts', 'events',
      'comments', 'comment_likes', 'comment_reports',
      'post_likes', 'bookmarks', 'subscribers'
    ];

    let totalRows = 0;
    for (const table of tables) {
      try {
        const result = await query(`SELECT COUNT(*) as count FROM ${table}`);
        const count = Array.isArray(result) ? result[0].count : 0;
        totalRows += count;
        console.log(`  • ${table}: ${count} rows`);
      } catch (err) {
        console.log(`  • ${table}: error (${err.message})`);
      }
    }
    console.log(`\n  Total rows across all tables: ${totalRows}`);

    console.log('\n🎉 Database setup completed successfully!');
    console.log('========================================');
    console.log('\n📝 Test User Credentials:');
    console.log('  • Email: test@sanaa.com');
    console.log('  • Password: password123');
    console.log('  • Role: user');
    console.log('');
    console.log('  • Email: admin@sanaa.com');
    console.log('  • Password: password123');
    console.log('  • Role: admin');
    console.log('');

  } catch (error) {
    console.error('\n❌ Database setup failed!');
    console.error('Error:', error.message);
    if (error.code) console.error('Error code:', error.code);
    process.exit(1);
  } finally {
    await closeDatabase();
  }
}

setup();
