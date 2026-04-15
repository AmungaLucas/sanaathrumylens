// src/lib/db.js
// Database abstraction layer: MySQL (primary) with SQLite fallback
import mysql from 'mysql2/promise';
import path from 'path';

let dbType = null; // 'mysql' or 'sqlite'
let pool = null;   // MySQL pool
let sqliteDb = null; // SQLite connection

// Use process.cwd() instead of import.meta.url — more compatible across
// build environments (Turbopack on Vercel, Webpack, Node, etc.)
function getSqlitePath() {
  return path.join(process.cwd(), 'sanaa_local.db');
}

/**
 * Get the database type
 */
export function getDbType() {
  return dbType;
}

/**
 * Get the database connection (MySQL pool or SQLite instance)
 */
export function getDb() {
  if (dbType === 'sqlite') return sqliteDb;
  return pool;
}

/**
 * Initialize the database connection
 * Tries MySQL first, falls back to SQLite
 */
export async function initDatabase() {
  // Try MySQL first
  try {
    pool = mysql.createPool({
      host: process.env.DB_HOST || 'vda7300.is.cc',
      port: parseInt(process.env.DB_PORT || '3306'),
      user: process.env.DB_USER || 'trustfit_sanaa_db_admin',
      password: process.env.DB_PASSWORD || 'Amush@100%',
      database: process.env.DB_NAME || 'trustfit_sanaa_db',
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
    });

    // Test connection
    const conn = await pool.getConnection();
    await conn.ping();
    conn.release();

    dbType = 'mysql';
    console.log('✅ Connected to MySQL database');

    // Create MySQL tables if they don't exist
    await createMySQLTables(pool);
    return true;
  } catch (mysqlError) {
    console.warn('⚠️  MySQL connection failed, falling back to SQLite:', mysqlError.message);
  }

  // Fallback to SQLite — dynamic import kept fully deferred
  try {
    const Database = (await import('better-sqlite3')).default;
    const SQLITE_DB_PATH = getSqlitePath();
    sqliteDb = new Database(SQLITE_DB_PATH);

    // Enable WAL mode for better performance
    sqliteDb.pragma('journal_mode = WAL');
    sqliteDb.pragma('foreign_keys = ON');

    dbType = 'sqlite';
    console.log(`✅ Connected to SQLite database at ${SQLITE_DB_PATH}`);

    // Create tables for SQLite
    createSQLiteTables(sqliteDb);
    return true;
  } catch (sqliteError) {
    console.error('❌ Both MySQL and SQLite connections failed:', sqliteError.message);
    throw sqliteError;
  }
}

/**
 * Create MySQL tables if they don't exist
 */
async function createMySQLTables(pool) {
  console.log('📋 Creating MySQL tables...');
  const conn = await pool.getConnection();
  try {
    const tables = [
      `CREATE TABLE IF NOT EXISTS authors (
        id INT AUTO_INCREMENT PRIMARY KEY,
        slug VARCHAR(255) NOT NULL UNIQUE, name VARCHAR(255) NOT NULL, bio TEXT, avatar VARCHAR(500),
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP, updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )`,
      `CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        email VARCHAR(255) NOT NULL UNIQUE, password_hash VARCHAR(255) NOT NULL, display_name VARCHAR(255),
        avatar VARCHAR(500), bio TEXT, slug VARCHAR(255) UNIQUE,
        roles JSON DEFAULT ('["user"]'), is_public BOOLEAN DEFAULT TRUE,
        bookmarks_count INT DEFAULT 0, likes_count INT DEFAULT 0, comments_count INT DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP, updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        last_login DATETIME
      )`,
      `CREATE TABLE IF NOT EXISTS categories (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL, slug VARCHAR(255) NOT NULL UNIQUE, description TEXT,
        is_active BOOLEAN DEFAULT TRUE,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP, updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )`,
      `CREATE TABLE IF NOT EXISTS posts (
        id INT AUTO_INCREMENT PRIMARY KEY,
        slug VARCHAR(255) NOT NULL UNIQUE, title VARCHAR(500) NOT NULL, excerpt TEXT, content LONGTEXT,
        cover_image VARCHAR(500), featured_image VARCHAR(500), author_id INT, author_snapshot JSON,
        status ENUM('draft','published','archived') DEFAULT 'draft',
        is_deleted BOOLEAN DEFAULT FALSE, is_featured BOOLEAN DEFAULT FALSE,
        category_ids JSON, tags JSON, reading_time INT DEFAULT 5,
        stats_views INT DEFAULT 0, stats_likes INT DEFAULT 0, stats_comments INT DEFAULT 0,
        published_at DATETIME,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP, updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (author_id) REFERENCES authors(id) ON DELETE SET NULL
      )`,
      `CREATE TABLE IF NOT EXISTS events (
        id INT AUTO_INCREMENT PRIMARY KEY,
        slug VARCHAR(255) NOT NULL UNIQUE, title VARCHAR(500) NOT NULL, excerpt TEXT, description LONGTEXT,
        cover_image VARCHAR(500), featured_image VARCHAR(500), location VARCHAR(255),
        is_online BOOLEAN DEFAULT FALSE,
        status ENUM('draft','published','archived') DEFAULT 'draft',
        is_deleted BOOLEAN DEFAULT FALSE, start_date DATETIME, end_date DATETIME,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP, updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )`,
      `CREATE TABLE IF NOT EXISTS comments (
        id INT AUTO_INCREMENT PRIMARY KEY,
        post_id INT NOT NULL, user_id INT, user_name VARCHAR(255), user_avatar VARCHAR(500),
        content TEXT NOT NULL, parent_id INT DEFAULT NULL,
        status ENUM('visible','hidden','pending') DEFAULT 'visible', likes INT DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP, updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        is_edited BOOLEAN DEFAULT FALSE, is_deleted BOOLEAN DEFAULT FALSE,
        FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
        FOREIGN KEY (parent_id) REFERENCES comments(id) ON DELETE SET NULL
      )`,
      `CREATE TABLE IF NOT EXISTS comment_likes (
        id INT AUTO_INCREMENT PRIMARY KEY,
        comment_id INT NOT NULL, user_id INT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        UNIQUE KEY unique_comment_like (comment_id, user_id),
        FOREIGN KEY (comment_id) REFERENCES comments(id) ON DELETE CASCADE,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )`,
      `CREATE TABLE IF NOT EXISTS comment_reports (
        id INT AUTO_INCREMENT PRIMARY KEY,
        comment_id INT NOT NULL, reporter_id INT NOT NULL, reported_user_id INT,
        status ENUM('pending','reviewed','dismissed') DEFAULT 'pending',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        UNIQUE KEY unique_report (comment_id, reporter_id),
        FOREIGN KEY (comment_id) REFERENCES comments(id) ON DELETE CASCADE,
        FOREIGN KEY (reporter_id) REFERENCES users(id) ON DELETE CASCADE
      )`,
      `CREATE TABLE IF NOT EXISTS post_likes (
        id INT AUTO_INCREMENT PRIMARY KEY,
        post_id INT NOT NULL, user_id INT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP, is_deleted BOOLEAN DEFAULT FALSE,
        UNIQUE KEY unique_post_like (post_id, user_id),
        FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )`,
      `CREATE TABLE IF NOT EXISTS bookmarks (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL, post_id INT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        UNIQUE KEY unique_bookmark (user_id, post_id),
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE
      )`,
      `CREATE TABLE IF NOT EXISTS subscribers (
        id INT AUTO_INCREMENT PRIMARY KEY,
        email VARCHAR(255) NOT NULL UNIQUE,
        is_active BOOLEAN DEFAULT TRUE, subscribed_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`,
    ];

    for (const sql of tables) {
      await conn.query(sql);
    }
    console.log('  ✅ MySQL tables created/verified');
  } finally {
    conn.release();
  }
}

/**
 * Create SQLite tables (SQLite uses different syntax than MySQL)
 */
function createSQLiteTables(db) {
  console.log('📋 Creating SQLite tables...');

  db.exec(`
    CREATE TABLE IF NOT EXISTS authors (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      slug TEXT NOT NULL UNIQUE,
      name TEXT NOT NULL,
      bio TEXT,
      avatar TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      display_name TEXT,
      avatar TEXT,
      bio TEXT,
      slug TEXT UNIQUE,
      roles TEXT DEFAULT '["user"]',
      is_public INTEGER DEFAULT 1,
      bookmarks_count INTEGER DEFAULT 0,
      likes_count INTEGER DEFAULT 0,
      comments_count INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      last_login DATETIME
    );

    CREATE TABLE IF NOT EXISTS categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      slug TEXT NOT NULL UNIQUE,
      description TEXT,
      is_active INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS posts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      slug TEXT NOT NULL UNIQUE,
      title TEXT NOT NULL,
      excerpt TEXT,
      content TEXT,
      cover_image TEXT,
      featured_image TEXT,
      author_id INTEGER,
      author_snapshot TEXT,
      status TEXT DEFAULT 'draft',
      is_deleted INTEGER DEFAULT 0,
      is_featured INTEGER DEFAULT 0,
      category_ids TEXT,
      tags TEXT,
      reading_time INTEGER DEFAULT 5,
      stats_views INTEGER DEFAULT 0,
      stats_likes INTEGER DEFAULT 0,
      stats_comments INTEGER DEFAULT 0,
      published_at DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (author_id) REFERENCES authors(id) ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS events (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      slug TEXT NOT NULL UNIQUE,
      title TEXT NOT NULL,
      excerpt TEXT,
      description TEXT,
      cover_image TEXT,
      featured_image TEXT,
      location TEXT,
      is_online INTEGER DEFAULT 0,
      status TEXT DEFAULT 'draft',
      is_deleted INTEGER DEFAULT 0,
      start_date DATETIME,
      end_date DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS comments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      post_id INTEGER NOT NULL,
      user_id INTEGER,
      user_name TEXT,
      user_avatar TEXT,
      content TEXT NOT NULL,
      parent_id INTEGER DEFAULT NULL,
      status TEXT DEFAULT 'visible',
      likes INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      is_edited INTEGER DEFAULT 0,
      is_deleted INTEGER DEFAULT 0,
      FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
      FOREIGN KEY (parent_id) REFERENCES comments(id) ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS comment_likes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      comment_id INTEGER NOT NULL,
      user_id INTEGER NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(comment_id, user_id),
      FOREIGN KEY (comment_id) REFERENCES comments(id) ON DELETE CASCADE,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS comment_reports (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      comment_id INTEGER NOT NULL,
      reporter_id INTEGER NOT NULL,
      reported_user_id INTEGER,
      status TEXT DEFAULT 'pending',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(comment_id, reporter_id),
      FOREIGN KEY (comment_id) REFERENCES comments(id) ON DELETE CASCADE,
      FOREIGN KEY (reporter_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS post_likes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      post_id INTEGER NOT NULL,
      user_id INTEGER NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      is_deleted INTEGER DEFAULT 0,
      UNIQUE(post_id, user_id),
      FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS bookmarks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      post_id INTEGER NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(user_id, post_id),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS subscribers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT NOT NULL UNIQUE,
      is_active INTEGER DEFAULT 1,
      subscribed_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  console.log('  ✅ SQLite tables created/verified');
}

/**
 * Unified query function that works with both MySQL and SQLite
 * Returns [rows] for SELECT, and {insertId, affectedRows} for INSERT/UPDATE/DELETE
 * to match mysql2's execute interface.
 */
export async function query(sql, params = []) {
  if (dbType === 'sqlite') {
    return sqliteQuery(sqliteDb, sql, params);
  }

  // MySQL: use execute
  const [result] = await pool.execute(sql, params);

  // For SELECT queries, mysql2 returns [rows]; wrap for consistency
  if (Array.isArray(result)) {
    return result;
  }

  // For INSERT/UPDATE/DELETE, mysql2 returns ResultSetHeader
  return result;
}

/**
 * SQLite query wrapper that mimics mysql2's execute interface
 */
function sqliteQuery(db, sql, params = []) {
  // Convert MySQL-style placeholders
  let sqliteSql = convertMySqlToSQLite(sql);

  const trimmed = sqliteSql.trim().toUpperCase();

  if (trimmed.startsWith('SELECT') || trimmed.startsWith('PRAGMA')) {
    // SELECT: return [rows] like mysql2 execute
    const rows = db.prepare(sqliteSql).all(...params);
    return rows;
  }

  // INSERT/UPDATE/DELETE: return ResultSetHeader-like object
  const info = db.prepare(sqliteSql).run(...params);
  return {
    insertId: info.lastInsertRowid,
    affectedRows: info.changes,
  };
}

/**
 * Convert MySQL-specific SQL to SQLite-compatible SQL
 */
function convertMySqlToSQLite(sql) {
  let result = sql;

  // Remove backtick quoting (SQLite uses double quotes or no quoting)
  result = result.replace(/`([^`]+)`/g, '$1');

  // Replace TRUE/FALSE with 1/0
  result = result.replace(/\bTRUE\b/g, '1');
  result = result.replace(/\bFALSE\b/g, '0');

  // Replace ON UPDATE CURRENT_TIMESTAMP (not supported in SQLite the same way)
  result = result.replace(/\s+ON\s+UPDATE\s+CURRENT_TIMESTAMP/gi, '');

  // Replace ENUM('draft', 'published', 'archived') with TEXT
  result = result.replace(/ENUM\([^)]+\)/gi, 'TEXT');

  // Replace AUTO_INCREMENT with AUTOINCREMENT
  result = result.replace(/AUTO_INCREMENT/gi, 'AUTOINCREMENT');

  // Replace UNSIGNED keyword
  result = result.replace(/\bUNSIGNED\b/gi, '');

  return result;
}

/**
 * Close the database connection
 */
export async function closeDatabase() {
  if (dbType === 'sqlite' && sqliteDb) {
    sqliteDb.close();
    console.log('🔌 SQLite connection closed.');
  } else if (dbType === 'mysql' && pool) {
    await pool.end();
    console.log('🔌 MySQL connection closed.');
  }
}

export default getDb;
