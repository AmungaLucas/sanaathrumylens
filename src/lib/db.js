// src/lib/db.js
// Database abstraction layer: MySQL only (Vercel-compatible)
// Optimized for serverless: fast reconnection, minimal overhead, stale connection recovery
import mysql from 'mysql2/promise';

let pool = null;
let dbReady = false;
let dbFailedAt = 0;
let tablesVerified = false; // Only verify tables once per process

/**
 * Check if database is available
 */
export function isDbReady() {
  return dbReady;
}

/**
 * Get the MySQL connection pool
 */
export function getDb() {
  return pool;
}

/**
 * Get the database type
 */
export function getDbType() {
  return dbReady ? 'mysql' : null;
}

const DB_COOLDOWN_MS = 3_000; // Retry after 3 seconds (aggressive for better UX)

/**
 * Initialize the MySQL database connection
 * Returns true if connected, false if failed (graceful degradation)
 */
export async function initDatabase() {
  // Fast path: already connected and pool exists
  if (dbReady && pool) {
    return true;
  }

  // Failed recently — short cooldown to avoid hammering DB
  if (dbFailedAt && (Date.now() - dbFailedAt) < DB_COOLDOWN_MS) {
    return false;
  }

  // Check required env vars
  if (!process.env.DB_HOST || !process.env.DB_USER || !process.env.DB_PASSWORD || !process.env.DB_NAME) {
    console.warn('⚠️  MySQL env vars missing. Running in offline mode.');
    dbFailedAt = Date.now();
    return false;
  }

  try {
    // Clean up any stale pool
    if (pool) {
      try { await pool.end(); } catch { /* ignore */ }
      pool = null;
    }

    pool = mysql.createPool({
      host: process.env.DB_HOST,
      port: parseInt(process.env.DB_PORT || '3306'),
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      waitForConnections: true,
      connectionLimit: 3, // Conservative for serverless
      queueLimit: 0,
      connectTimeout: 10000, // 10s connect timeout
      enableKeepAlive: true,
      keepAliveInitialDelay: 5000,
      idleTimeout: 30000, // Close idle connections after 30s
      maxIdle: 1, // Keep only 1 idle connection
    });

    // Test connection with timeout
    const conn = await Promise.race([
      pool.getConnection(),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error('MySQL connection timed out')), 10000)
      ),
    ]);
    await conn.ping();
    conn.release();

    dbReady = true;
    dbFailedAt = 0;
    console.log('✅ Connected to MySQL database');

    // Only verify tables once per process lifetime (not on every reconnection)
    if (!tablesVerified) {
      await createMySQLTables(pool);
      tablesVerified = true;
    }

    return true;
  } catch (mysqlError) {
    console.warn('⚠️  MySQL connection failed:', mysqlError.message);
    try { await pool?.end(); } catch { /* ignore */ }
    pool = null;
    dbReady = false;
    dbFailedAt = Date.now();
    return false;
  }
}

/**
 * Create MySQL tables if they don't exist (runs only once per process)
 */
async function createMySQLTables(pool) {
  console.log('📋 Verifying MySQL tables...');
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
    console.log('  ✅ MySQL tables verified');
  } finally {
    conn.release();
  }
}

/**
 * Execute a query against MySQL with automatic stale connection recovery
 * Returns [rows] for SELECT, and {insertId, affectedRows} for INSERT/UPDATE/DELETE
 * Throws if database is not available after retry
 */
export async function query(sql, params = []) {
  if (!pool) {
    throw new Error('Database not available');
  }

  try {
    // Use pool.query() instead of pool.execute() — execute() uses prepared statements
    // which can fail with certain MySQL versions/configurations on LIMIT/OFFSET params
    const [result] = await pool.query(sql, params);

    // For SELECT queries, mysql2 returns [rows]
    if (Array.isArray(result)) {
      return result;
    }

    // For INSERT/UPDATE/DELETE, mysql2 returns ResultSetHeader
    return result;
  } catch (error) {
    // Detect stale connections and auto-reconnect + retry once
    const STALE_CODES = ['PROTOCOL_CONNECTION_LOST', 'ECONNRESET', 'ETIMEDOUT', 'CONN_UNUSABLE', 'ER_CON_COUNT_ERROR'];
    if (STALE_CODES.includes(error.code)) {
      console.warn('⚠️  Stale MySQL connection detected, reconnecting and retrying...');
      try { await pool.end(); } catch { /* ignore */ }
      pool = null;
      dbReady = false;
      dbFailedAt = 0;

      // Attempt to reconnect and retry the query once
      const reconnected = await initDatabase();
      if (reconnected && pool) {
        try {
          const [result] = await pool.query(sql, params);
          if (Array.isArray(result)) return result;
          return result;
        } catch (retryError) {
          console.error('⚠️  Query retry failed:', retryError.message);
        }
      }
    }
    throw error;
  }
}

/**
 * Close the database connection
 */
export async function closeDatabase() {
  if (pool) {
    await pool.end();
    console.log('🔌 MySQL connection closed.');
    pool = null;
    dbReady = false;
    dbFailedAt = 0;
  }
}

export default getDb;
