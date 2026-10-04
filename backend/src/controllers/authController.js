const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../config/database');
const { JWT_SECRET } = require('../middleware/auth');
const { ACTIVE_SECTIONS, DEFAULT_SECTION } = require('../config/sections');

exports.studentLogin = (req, res) => {
  try {
    const { roll_number, password } = req.body;
    if (!roll_number || !password) {
      return res.status(400).json({ error: 'Please provide both Roll Number and Password.' });
    }

    const cleanRoll = roll_number.trim().toUpperCase();
    const user = db.prepare("SELECT * FROM users WHERE UPPER(roll_number) = ? AND role = 'student'").get(cleanRoll);

    if (!user) {
      return res.status(401).json({ error: 'Invalid Roll Number or Student not registered.' });
    }

    const isMatch = bcrypt.compareSync(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({ error: 'Incorrect password.' });
    }

    const token = jwt.sign(
      {
        id: user.id,
        roll_number: user.roll_number,
        name: user.name,
        role: user.role,
        section: user.section,
        year: user.year,
        department: user.department,
      },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    return res.json({
      message: 'Student login successful',
      token,
      user: {
        id: user.id,
        roll_number: user.roll_number,
        name: user.name,
        role: user.role,
        section: user.section,
        year: user.year,
        department: user.department,
      },
    });
  } catch (err) {
    console.error('Student login error:', err);
    return res.status(500).json({ error: 'Internal server error during login.' });
  }
};

exports.studentRegister = (req, res) => {
  try {
    const { roll_number, name, password, section, year, department } = req.body;

    if (!roll_number || !name || !password || !section) {
      return res.status(400).json({ error: 'Roll number, Name, Section, and Password are required.' });
    }

    const cleanRoll = roll_number.trim().toUpperCase();

    // Check if roll number already exists
    const existing = db.prepare('SELECT id FROM users WHERE UPPER(roll_number) = ?').get(cleanRoll);
    if (existing) {
      return res.status(409).json({ error: 'A user with this Roll Number is already registered.' });
    }

    const password_hash = bcrypt.hashSync(password, 10);
    const insert = db.prepare(`
      INSERT INTO users (roll_number, name, password_hash, role, section, year, department)
      VALUES (?, ?, ?, 'student', ?, ?, ?)
    `);

    const result = insert.run(
      cleanRoll,
      name.trim(),
      password_hash,
      section.trim().toUpperCase(),
      year ? parseInt(year) : 3,
      department ? department.trim() : 'Computer Science & Engineering'
    );

    const token = jwt.sign(
      {
        id: result.lastInsertRowid,
        roll_number: cleanRoll,
        name: name.trim(),
        role: 'student',
        section: section.trim().toUpperCase(),
        year: year ? parseInt(year) : 3,
        department: department ? department.trim() : 'Computer Science & Engineering',
      },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    return res.status(201).json({
      message: 'Registration successful! Welcome to Class Work Scheduler.',
      token,
      user: {
        id: result.lastInsertRowid,
        roll_number: cleanRoll,
        name: name.trim(),
        role: 'student',
        section: section.trim().toUpperCase(),
        year: year ? parseInt(year) : 3,
        department: department ? department.trim() : 'Computer Science & Engineering',
      },
    });
  } catch (err) {
    console.error('Registration error:', err);
    return res.status(500).json({ error: 'Internal server error during registration.' });
  }
};

exports.adminLogin = (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ error: 'Admin username and password are required.' });
    }

    const cleanUser = username.trim().toLowerCase();
    const admin = db.prepare("SELECT * FROM users WHERE LOWER(roll_number) = ? AND role = 'admin'").get(cleanUser);

    if (!admin) {
      return res.status(401).json({ error: 'Invalid admin credentials.' });
    }

    const isMatch = bcrypt.compareSync(password, admin.password_hash);
    if (!isMatch) {
      return res.status(401).json({ error: 'Incorrect admin password.' });
    }

    const token = jwt.sign(
      {
        id: admin.id,
        roll_number: admin.roll_number,
        name: admin.name,
        role: admin.role,
        department: admin.department,
      },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    return res.json({
      message: 'Admin login successful',
      token,
      user: {
        id: admin.id,
        roll_number: admin.roll_number,
        name: admin.name,
        role: admin.role,
        department: admin.department,
      },
    });
  } catch (err) {
    console.error('Admin login error:', err);
    return res.status(500).json({ error: 'Internal server error during admin login.' });
  }
};

exports.getCurrentUser = (req, res) => {
  try {
    const user = db.prepare('SELECT id, roll_number, name, role, section, year, department, created_at FROM users WHERE id = ?').get(req.user.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }
    return res.json({ user });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to retrieve profile.' });
  }
};

exports.getSections = (req, res) => {
  try {
    return res.json({ sections: ACTIVE_SECTIONS, default_section: DEFAULT_SECTION });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to retrieve sections.' });
  }
};
