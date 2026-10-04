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

  // Seed sample data if empty
  seedInitialData();
}

function seedInitialData() {
  const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get().count;
  if (userCount > 0) {
    return;
  }

  console.log('Seeding initial data for Class Work Scheduler...');

  const adminPass = bcrypt.hashSync('admin123', 10);
  const studentPass = bcrypt.hashSync('student123', 10);

  // Insert Admin
  const insertUser = db.prepare(`
    INSERT INTO users (roll_number, name, password_hash, role, section, year, department)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  const adminResult = insertUser.run(
    'admin',
    'Faculty Coordinator / Admin',
    adminPass,
    'admin',
    'ALL',
    null,
    'Academic Affairs'
  );
  const adminId = adminResult.lastInsertRowid;

  // Insert Students
  const students = [
    { roll: '22A91A0501', name: 'Aarav Sharma', sec: 'CSE-A', year: 3, dept: 'Computer Science & Engineering' },
    { roll: '22A91A0502', name: 'Ananya Patel', sec: 'CSE-A', year: 3, dept: 'Computer Science & Engineering' },
    { roll: '22A91A0503', name: 'Rohan Reddy', sec: 'CSE-B', year: 3, dept: 'Computer Science & Engineering' },
    { roll: '22A91A0504', name: 'Sneha Iyer', sec: 'CSE-B', year: 3, dept: 'Computer Science & Engineering' },
    { roll: '22A91A0505', name: 'Vikram Rao', sec: 'ECE-A', year: 3, dept: 'Electronics & Communication' },
    { roll: '22A91A0506', name: 'Pooja Verma', sec: 'IT-A', year: 3, dept: 'Information Technology' },
  ];

  const studentMap = {};
  for (const s of students) {
    const res = insertUser.run(s.roll, s.name, studentPass, 'student', s.sec, s.year, s.dept);
    studentMap[s.roll] = { id: res.lastInsertRowid, ...s };
  }

  // Insert sample classworks with relative dates
  const insertWork = db.prepare(`
    INSERT INTO classworks (title, subject, faculty_name, description, target_section, category, priority, due_date, resource_url, created_by)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const today = new Date();
  const dateOffset = (days, hours = 17) => {
    const d = new Date(today.getTime() + days * 24 * 60 * 60 * 1000);
    d.setHours(hours, 0, 0, 0);
    return d.toISOString().slice(0, 16);
  };

  const works = [
    {
      title: 'Deadlock Detection & Banker Algorithm Implementation',
      subject: 'Operating Systems',
      faculty_name: 'Dr. K. Srinivas',
      description: 'Implement the Banker’s Algorithm for deadlock avoidance in C/C++ or Python. Submit your source code along with a test report containing 3 test matrices with safe state sequences.',
      target_section: 'CSE-A',
      category: 'Lab Task',
      priority: 'Urgent',
      due_date: dateOffset(1, 18),
      resource_url: 'https://en.wikipedia.org/wiki/Banker%27s_algorithm',
    },
    {
      title: 'Normalization (1NF, 2NF, 3NF, BCNF) Problem Set 4',
      subject: 'Database Management Systems',
      faculty_name: 'Prof. Sunita Nair',
      description: 'Solve the 5 relational schema decomposition problems attached in the department portal. Clearly show functional dependencies, candidate keys, and lossless join verification.',
      target_section: 'ALL',
      category: 'Assignment',
      priority: 'High',
      due_date: dateOffset(2, 23),
      resource_url: 'https://www.geeksforgeeks.org/database-normalization-introduction/',
    },
    {
      title: 'Greedy vs Dynamic Programming: 0/1 Knapsack Analysis',
      subject: 'Design & Analysis of Algorithms',
      faculty_name: 'Dr. M. Venkatesh',
      description: 'Write a comparative analysis and benchmark report between the Fractional Knapsack (Greedy) and 0/1 Knapsack (DP) algorithms for input size n=1000 items.',
      target_section: 'CSE-A',
      category: 'Assignment',
      priority: 'Medium',
      due_date: dateOffset(4, 16),
      resource_url: '',
    },
    {
      title: 'Socket Programming Client-Server Chat Application',
      subject: 'Computer Networks',
      faculty_name: 'Prof. Rajesh Kumar',
      description: 'Build a multi-client TCP chat server using BSD sockets or Python socket library. Demonstrate simultaneous message broadcasting and client disconnect handling.',
      target_section: 'CSE-B',
      category: 'Project Work',
      priority: 'High',
      due_date: dateOffset(3, 17),
      resource_url: 'https://docs.python.org/3/library/socket.html',
    },
    {
      title: '8086 Assembly Language Arithmetic & Array Operations',
      subject: 'Microprocessors & Interfacing',
      faculty_name: 'Dr. P. Swaminathan',
      description: 'Assemble and execute MASM/TASM programs to sort an array of 10 hexadecimal numbers in ascending order and compute their parity sum.',
      target_section: 'ECE-A',
      category: 'Lab Task',
      priority: 'Medium',
      due_date: dateOffset(5, 15),
      resource_url: '',
    },
    {
      title: 'Software Requirement Specification (SRS) Document for Mini Project',
      subject: 'Software Engineering',
      faculty_name: 'Prof. Anitha Rao',
      description: 'Submit IEEE 830 compliant SRS document for your semester mini-project, including Functional & Non-functional requirements, Use Case diagrams, and Data Flow Diagrams.',
      target_section: 'IT-A',
      category: 'Homework',
      priority: 'Normal',
      due_date: dateOffset(6, 20),
      resource_url: '',
    },
  ];

  const workIds = [];
  for (const w of works) {
    const res = insertWork.run(
      w.title,
      w.subject,
      w.faculty_name,
      w.description,
      w.target_section,
      w.category,
      w.priority,
      w.due_date,
      w.resource_url,
      adminId
    );
    workIds.push(res.lastInsertRowid);
  }

  // Pre-seed some completions so admin can immediately observe real student completions
  const insertCompletion = db.prepare(`
    INSERT INTO task_completions (classwork_id, student_id, student_roll_number, student_name, student_section, notes)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  // Aarav completed work 1 and work 2
  insertCompletion.run(workIds[0], studentMap['22A91A0501'].id, '22A91A0501', 'Aarav Sharma', 'CSE-A', 'Completed C++ code & submitted report');
  insertCompletion.run(workIds[1], studentMap['22A91A0501'].id, '22A91A0501', 'Aarav Sharma', 'CSE-A', 'Finished all 5 normalization proofs');

  // Rohan completed work 2
  insertCompletion.run(workIds[1], studentMap['22A91A0503'].id, '22A91A0503', 'Rohan Reddy', 'CSE-B', 'Completed assignment problems');

  console.log('Sample database successfully initialized and seeded!');
}

initDatabase();

module.exports = db;
