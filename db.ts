import Database from 'better-sqlite3';
import path from 'path';

const db = new Database(path.join(process.cwd(), 'civic.db'));

// Initialize schema
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    uid TEXT PRIMARY KEY,
    email TEXT NOT NULL,
    displayName TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'user',
    trustScore REAL DEFAULT 50,
    photoURL TEXT,
    bio TEXT,
    location TEXT,
    joinedAt TEXT NOT NULL,
    lastActive TEXT
  );

  CREATE TABLE IF NOT EXISTS issues (
    id TEXT PRIMARY KEY,
    reporterUid TEXT NOT NULL,
    category TEXT NOT NULL,
    description TEXT NOT NULL,
    imageUrl TEXT NOT NULL,
    latitude REAL NOT NULL,
    longitude REAL NOT NULL,
    address TEXT NOT NULL,
    landmark TEXT,
    status TEXT NOT NULL DEFAULT 'Pending',
    isFake INTEGER DEFAULT 0,
    aiReasoning TEXT,
    aiConfidence REAL,
    rejectionReason TEXT,
    createdAt TEXT NOT NULL,
    updatedAt TEXT NOT NULL,
    FOREIGN KEY (reporterUid) REFERENCES users(uid)
  );

  CREATE TABLE IF NOT EXISTS upvotes (
    issueId TEXT NOT NULL,
    userId TEXT NOT NULL,
    PRIMARY KEY (issueId, userId),
    FOREIGN KEY (issueId) REFERENCES issues(id) ON DELETE CASCADE,
    FOREIGN KEY (userId) REFERENCES users(uid) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS comments (
    id TEXT PRIMARY KEY,
    issueId TEXT NOT NULL,
    authorUid TEXT NOT NULL,
    authorName TEXT NOT NULL,
    authorPhoto TEXT,
    text TEXT NOT NULL,
    createdAt TEXT NOT NULL,
    FOREIGN KEY (issueId) REFERENCES issues(id) ON DELETE CASCADE,
    FOREIGN KEY (authorUid) REFERENCES users(uid) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS notifications (
    id TEXT PRIMARY KEY,
    recipientUid TEXT NOT NULL,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type TEXT NOT NULL,
    issueId TEXT,
    read INTEGER DEFAULT 0,
    createdAt TEXT NOT NULL,
    FOREIGN KEY (recipientUid) REFERENCES users(uid) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS settings (
    id TEXT PRIMARY KEY,
    autoAiVerification INTEGER DEFAULT 1
  );
`);

// Migration: Add lastActive column if it doesn't exist
try {
  db.exec("ALTER TABLE users ADD COLUMN lastActive TEXT;");
  console.log("Migration: Added lastActive column to users table");
} catch (error: any) {
  if (!error.message.includes("duplicate column name")) {
    console.error("Migration error (lastActive):", error);
  }
}

// Migration: Add AI-related columns to issues table if they don't exist
const issueMigrations = [
  "ALTER TABLE issues ADD COLUMN isFake INTEGER DEFAULT 0;",
  "ALTER TABLE issues ADD COLUMN aiReasoning TEXT;",
  "ALTER TABLE issues ADD COLUMN aiConfidence REAL;",
  "ALTER TABLE issues ADD COLUMN rejectionReason TEXT;"
];

for (const migration of issueMigrations) {
  try {
    db.exec(migration);
    console.log(`Migration successful: ${migration}`);
  } catch (error: any) {
    if (!error.message.includes("duplicate column name")) {
      console.error(`Migration error (${migration}):`, error);
    }
  }
}

export default db;
