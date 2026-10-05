const db = require('../config/database');

// GET /api/sections
exports.getAllSections = (req, res) => {
  try {
    const rows = db.prepare(`
      SELECT 
        s.name,
        s.created_at,
        (SELECT COUNT(*) FROM users u WHERE UPPER(u.section) = UPPER(s.name) AND u.role = 'student') AS student_count,
        (SELECT COUNT(*) FROM classworks c WHERE UPPER(c.target_section) = UPPER(s.name)) AS work_count
      FROM sections s
      ORDER BY s.name ASC
    `).all();

    const sectionNames = rows.map((r) => r.name);
    const defaultSection = sectionNames[0] || 'CSE-A';

    return res.json({
      sections: sectionNames,
      default_section: defaultSection,
      sections_detail: rows,
    });
  } catch (err) {
    console.error('Error fetching sections:', err);
    return res.status(500).json({ error: 'Failed to retrieve sections.' });
  }
};

// POST /api/sections (Admin only)
exports.createSection = (req, res) => {
  try {
    const { name } = req.body;
    if (!name || typeof name !== 'string') {
      return res.status(400).json({ error: 'Section name is required.' });
    }

    const cleanName = name.trim().toUpperCase();

    if (cleanName.length < 2 || cleanName.length > 20) {
      return res.status(400).json({ error: 'Section name must be between 2 and 20 characters.' });
    }

    if (cleanName === 'ALL') {
      return res.status(400).json({ error: '"ALL" is a reserved keyword and cannot be used as a section name.' });
    }

    // Check if already exists
    const existing = db.prepare('SELECT id FROM sections WHERE UPPER(name) = ?').get(cleanName);
    if (existing) {
      return res.status(409).json({ error: `Section "${cleanName}" already exists.` });
    }

    db.prepare('INSERT INTO sections (name) VALUES (?)').run(cleanName);

    const updatedSections = db.prepare('SELECT name FROM sections ORDER BY name ASC').all().map(r => r.name);

    return res.status(201).json({
      message: `Section "${cleanName}" created successfully!`,
      section: cleanName,
      sections: updatedSections,
    });
  } catch (err) {
    console.error('Error creating section:', err);
    return res.status(500).json({ error: 'Failed to create section.' });
  }
};

// DELETE /api/sections/:name (Admin only)
exports.deleteSection = (req, res) => {
  try {
    const { name } = req.params;
    const { force } = req.query;

    if (!name) {
      return res.status(400).json({ error: 'Section name is required.' });
    }

    const cleanName = name.trim().toUpperCase();

    // Check if section exists
    const section = db.prepare('SELECT id, name FROM sections WHERE UPPER(name) = ?').get(cleanName);
    if (!section) {
      return res.status(404).json({ error: `Section "${cleanName}" does not exist.` });
    }

    // Ensure at least one section remains in system
    const totalCount = db.prepare('SELECT COUNT(*) as count FROM sections').get().count;
    if (totalCount <= 1) {
      return res.status(400).json({ error: 'Cannot delete the only remaining section. At least one active section is required.' });
    }

    // Check dependencies (students and classworks)
    const studentCount = db.prepare("SELECT COUNT(*) as count FROM users WHERE UPPER(section) = ? AND role = 'student'").get(cleanName).count;
    const workCount = db.prepare('SELECT COUNT(*) as count FROM classworks WHERE UPPER(target_section) = ?').get(cleanName).count;

    if ((studentCount > 0 || workCount > 0) && force !== 'true') {
      return res.status(400).json({
        error: `Cannot delete section "${cleanName}". There are ${studentCount} student(s) and ${workCount} classwork(s) currently assigned to this section.`,
        hasDependencies: true,
        studentCount,
        workCount,
      });
    }

    // Delete section
    db.prepare('DELETE FROM sections WHERE id = ?').run(section.id);

    const updatedSections = db.prepare('SELECT name FROM sections ORDER BY name ASC').all().map(r => r.name);

    return res.json({
      message: `Section "${cleanName}" deleted successfully.`,
      sections: updatedSections,
    });
  } catch (err) {
    console.error('Error deleting section:', err);
    return res.status(500).json({ error: 'Failed to delete section.' });
  }
};
