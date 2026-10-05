const bcrypt = require('bcryptjs');
const db = require('../config/database');

// GET /api/students (Admin only)
exports.getAllStudents = (req, res) => {
  try {
    const { section, search } = req.query;

    let query = `
      SELECT 
        u.id,
        u.roll_number,
        u.name,
        u.section,
        u.year,
        u.department,
        u.created_at,
        (SELECT COUNT(*) FROM task_completions tc WHERE tc.student_id = u.id) AS completed_tasks_count
      FROM users u
      WHERE u.role = 'student'
    `;
    const params = [];

    if (section && section !== 'ALL') {
      query += ` AND UPPER(u.section) = UPPER(?)`;
      params.push(section);
    }

    if (search) {
      query += ` AND (UPPER(u.roll_number) LIKE UPPER(?) OR UPPER(u.name) LIKE UPPER(?))`;
      params.push(`%${search}%`, `%${search}%`);
    }

    query += ` ORDER BY u.roll_number ASC`;

    const students = db.prepare(query).all(...params);

    return res.json({ students });
  } catch (err) {
    console.error('Error fetching students:', err);
    return res.status(500).json({ error: 'Failed to retrieve students list.' });
  }
};

// POST /api/students (Admin only)
exports.createStudent = (req, res) => {
  try {
    const { roll_number, name, section, password, year, department } = req.body;

    if (!roll_number || !name || !section || !password) {
      return res.status(400).json({ error: 'Roll number, Name, Section, and Password are required.' });
    }

    const cleanRoll = roll_number.trim().toUpperCase();
    const cleanSection = section.trim().toUpperCase();
    const cleanName = name.trim();

    if (password.length < 4) {
      return res.status(400).json({ error: 'Password must be at least 4 characters.' });
    }

    // Check if roll number already exists
    const existing = db.prepare('SELECT id FROM users WHERE UPPER(roll_number) = ?').get(cleanRoll);
    if (existing) {
      return res.status(409).json({ error: `A user with Roll Number "${cleanRoll}" is already registered.` });
    }

    // Ensure section exists in sections table (if not, add it)
    const sectionRecord = db.prepare('SELECT id FROM sections WHERE UPPER(name) = ?').get(cleanSection);
    if (!sectionRecord) {
      db.prepare('INSERT OR IGNORE INTO sections (name) VALUES (?)').run(cleanSection);
    }

    const password_hash = bcrypt.hashSync(password, 10);
    const insert = db.prepare(`
      INSERT INTO users (roll_number, name, password_hash, role, section, year, department)
      VALUES (?, ?, ?, 'student', ?, ?, ?)
    `);

    const result = insert.run(
      cleanRoll,
      cleanName,
      password_hash,
      cleanSection,
      year ? parseInt(year) : 3,
      department ? department.trim() : 'Computer Science & Engineering'
    );

    const newStudent = db.prepare(`
      SELECT id, roll_number, name, section, year, department, created_at,
        0 AS completed_tasks_count
      FROM users WHERE id = ?
    `).get(result.lastInsertRowid);

    return res.status(201).json({
      message: `Student account for ${cleanName} (${cleanRoll}) created successfully!`,
      student: newStudent,
    });
  } catch (err) {
    console.error('Error creating student:', err);
    return res.status(500).json({ error: 'Failed to create student account.' });
  }
};

// DELETE /api/students/:id (Admin only)
exports.deleteStudent = (req, res) => {
  try {
    const { id } = req.params;

    const student = db.prepare("SELECT id, roll_number, name FROM users WHERE id = ? AND role = 'student'").get(id);
    if (!student) {
      return res.status(404).json({ error: 'Student not found.' });
    }

    // Delete task completions associated with student
    db.prepare('DELETE FROM task_completions WHERE student_id = ?').run(id);

    // Delete student user
    db.prepare('DELETE FROM users WHERE id = ?').run(id);

    return res.json({
      message: `Student account for ${student.name} (${student.roll_number}) deleted successfully.`,
    });
  } catch (err) {
    console.error('Error deleting student:', err);
    return res.status(500).json({ error: 'Failed to delete student account.' });
  }
};
