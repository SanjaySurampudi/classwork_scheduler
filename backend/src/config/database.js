const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');
const bcrypt = require('bcryptjs');

const dbDir = path.join(__dirname, '../../data');
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const dbPath = path.join(dbDir, 'scheduler.db');
const db = new Database(dbPath);

// Enable foreign keys and WAL mode for better concurrency
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

function initDatabase() {
  // Create sections table
  db.exec(`
    CREATE TABLE IF NOT EXISTS sections (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT UNIQUE NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Create users table
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      roll_number TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL CHECK(role IN ('admin', 'student')),
      section TEXT,
      year INTEGER DEFAULT 3,
      department TEXT DEFAULT 'Computer Science & Engineering',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Create classworks table
  db.exec(`
    CREATE TABLE IF NOT EXISTS classworks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      subject TEXT NOT NULL,
      faculty_name TEXT NOT NULL,
      description TEXT,
      target_section TEXT NOT NULL, -- e.g., 'CSE-A', 'CSE-B', 'ECE-A', 'IT-A', or 'ALL'
      category TEXT DEFAULT 'Assignment', -- 'Assignment', 'Lab Task', 'Project Work', 'Homework', 'Seminar'
      priority TEXT DEFAULT 'Medium', -- 'Urgent', 'High', 'Medium', 'Normal'
      due_date TEXT NOT NULL, -- ISO string YYYY-MM-DDTHH:mm
      resource_url TEXT,
      created_by INTEGER REFERENCES users(id),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Create task_completions table
  db.exec(`
    CREATE TABLE IF NOT EXISTS task_completions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      classwork_id INTEGER NOT NULL REFERENCES classworks(id) ON DELETE CASCADE,
      student_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      student_roll_number TEXT NOT NULL,
      student_name TEXT NOT NULL,
      student_section TEXT NOT NULL,
      notes TEXT,
      completed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(classwork_id, student_id)
    );
  `);

  // Ensure existing sections are seeded in sections table (from existing users/works)
  try {
    const sectionCount = db.prepare('SELECT COUNT(*) as count FROM sections').get().count;
    if (sectionCount === 0) {
      const userSections = db.prepare("SELECT DISTINCT section FROM users WHERE section IS NOT NULL AND section != '' AND section != 'ALL'").all().map(r => r.section);
      const workSections = db.prepare("SELECT DISTINCT target_section FROM classworks WHERE target_section IS NOT NULL AND target_section != '' AND target_section != 'ALL'").all().map(r => r.target_section);
      const allSecs = Array.from(new Set([...userSections, ...workSections]));
      const insertSec = db.prepare('INSERT OR IGNORE INTO sections (name) VALUES (?)');
      for (const s of allSecs) {
        if (s && typeof s === 'string' && s.trim()) {
          insertSec.run(s.trim().toUpperCase());
        }
      }
    }
  } catch (err) {
    console.error('Error initializing sections table:', err);
  }

  // Seed sample data if empty
  seedInitialData();
}

function seedInitialData() {
  const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get().count;
  if (userCount > 0) {
    return;
  }

  console.log('Creating admin account for Class Work Scheduler...');

  const adminPass = bcrypt.hashSync('admin123', 10);

  const insertUser = db.prepare(`
    INSERT INTO users (roll_number, name, password_hash, role, section, year, department)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  insertUser.run(
    'admin',
    'Faculty / Admin',
    adminPass,
    'admin',
    'ALL',
    null,
    'Academic Affairs'
  );

  console.log('Admin account created. You can now add sections and student logins from the Admin Dashboard.');
}



initDatabase();

module.exports = db;
