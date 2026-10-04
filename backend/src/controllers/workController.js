const db = require('../config/database');

// GET /api/classworks
// Query params: section (e.g. 'CSE-A', 'CSE-B', 'ALL')
exports.getAllClassworks = (req, res) => {
  try {
    const { section, category, priority, search } = req.query;
    const currentUserId = req.user ? req.user.id : null;
    const isStudent = req.user && req.user.role === 'student';

    let query = `
      SELECT 
        c.*,
        (SELECT COUNT(*) FROM task_completions tc WHERE tc.classwork_id = c.id) AS total_completions
    `;

    if (isStudent && currentUserId) {
      query += `,
        (SELECT CASE WHEN COUNT(*) > 0 THEN 1 ELSE 0 END 
         FROM task_completions tc 
         WHERE tc.classwork_id = c.id AND tc.student_id = ?) AS is_completed,
        (SELECT tc.completed_at 
         FROM task_completions tc 
         WHERE tc.classwork_id = c.id AND tc.student_id = ?) AS completed_at
      `;
    }

    query += ` FROM classworks c WHERE 1=1`;
    const params = isStudent && currentUserId ? [currentUserId, currentUserId] : [];

    // Filter by section: include works specifically targeting this section OR targeted at 'ALL'
    if (section && section !== 'ALL') {
      query += ` AND (c.target_section = ? OR c.target_section = 'ALL')`;
      params.push(section);
    }

    if (category && category !== 'ALL') {
      query += ` AND c.category = ?`;
      params.push(category);
    }

    if (priority && priority !== 'ALL') {
      query += ` AND c.priority = ?`;
      params.push(priority);
    }

    if (search) {
      query += ` AND (c.title LIKE ? OR c.subject LIKE ? OR c.faculty_name LIKE ?)`;
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }

    query += ` ORDER BY c.due_date ASC, c.id DESC`;

    const works = db.prepare(query).all(...params);

    // Convert is_completed to boolean
    const formattedWorks = works.map(w => ({
      ...w,
      is_completed: Boolean(w.is_completed),
    }));

    return res.json({ classworks: formattedWorks });
  } catch (err) {
    console.error('Error fetching classworks:', err);
    return res.status(500).json({ error: 'Failed to fetch class works.' });
  }
};

// GET /api/classworks/:id
exports.getClassworkById = (req, res) => {
  try {
    const { id } = req.params;
    const work = db.prepare('SELECT * FROM classworks WHERE id = ?').get(id);
    if (!work) {
      return res.status(404).json({ error: 'Class work not found.' });
    }
    return res.json({ classwork: work });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to retrieve class work.' });
  }
};

// POST /api/classworks (Admin only)
exports.createClasswork = (req, res) => {
  try {
    const { title, subject, faculty_name, description, target_section, category, priority, due_date, resource_url } = req.body;

    if (!title || !subject || !faculty_name || !target_section || !due_date) {
      return res.status(400).json({ error: 'Title, Subject, Faculty Name, Target Section, and Due Date are required.' });
    }

    const insert = db.prepare(`
      INSERT INTO classworks (title, subject, faculty_name, description, target_section, category, priority, due_date, resource_url, created_by)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const result = insert.run(
      title.trim(),
      subject.trim(),
      faculty_name.trim(),
      description ? description.trim() : '',
      target_section.trim().toUpperCase(),
      category || 'Assignment',
      priority || 'Medium',
      due_date,
      resource_url ? resource_url.trim() : '',
      req.user.id
    );

    const createdWork = db.prepare('SELECT * FROM classworks WHERE id = ?').get(result.lastInsertRowid);
    return res.status(201).json({
      message: 'Class work posted successfully!',
      classwork: { ...createdWork, total_completions: 0 },
    });
  } catch (err) {
    console.error('Error creating classwork:', err);
    return res.status(500).json({ error: 'Failed to create class work.' });
  }
};

// PUT /api/classworks/:id (Admin only)
exports.updateClasswork = (req, res) => {
  try {
    const { id } = req.params;
    const { title, subject, faculty_name, description, target_section, category, priority, due_date, resource_url } = req.body;

    const existing = db.prepare('SELECT id FROM classworks WHERE id = ?').get(id);
    if (!existing) {
      return res.status(404).json({ error: 'Class work not found.' });
    }

    const update = db.prepare(`
      UPDATE classworks 
      SET title = ?, subject = ?, faculty_name = ?, description = ?, target_section = ?, category = ?, priority = ?, due_date = ?, resource_url = ?
      WHERE id = ?
    `);

    update.run(
      title.trim(),
      subject.trim(),
      faculty_name.trim(),
      description ? description.trim() : '',
      target_section.trim().toUpperCase(),
      category || 'Assignment',
      priority || 'Medium',
      due_date,
      resource_url ? resource_url.trim() : '',
      id
    );

    const updatedWork = db.prepare('SELECT * FROM classworks WHERE id = ?').get(id);
    return res.json({
      message: 'Class work updated successfully!',
      classwork: updatedWork,
    });
  } catch (err) {
    console.error('Error updating classwork:', err);
    return res.status(500).json({ error: 'Failed to update class work.' });
  }
};

// DELETE /api/classworks/:id (Admin only)
exports.deleteClasswork = (req, res) => {
  try {
    const { id } = req.params;
    const existing = db.prepare('SELECT id FROM classworks WHERE id = ?').get(id);
    if (!existing) {
      return res.status(404).json({ error: 'Class work not found.' });
    }

    db.prepare('DELETE FROM classworks WHERE id = ?').run(id);
    return res.json({ message: 'Class work deleted successfully.' });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to delete class work.' });
  }
};

// POST /api/classworks/:id/complete (Student only)
// Toggles or sets completion status for current student
exports.toggleComplete = (req, res) => {
  try {
    const { id } = req.params;
    const { notes } = req.body;
    const student = req.user;

    const work = db.prepare('SELECT id, title, target_section FROM classworks WHERE id = ?').get(id);
    if (!work) {
      return res.status(404).json({ error: 'Class work not found.' });
    }

    // Check if already completed
    const existingCompletion = db.prepare(
      'SELECT id FROM task_completions WHERE classwork_id = ? AND student_id = ?'
    ).get(id, student.id);

    if (existingCompletion) {
      // Toggle to incomplete
      db.prepare('DELETE FROM task_completions WHERE id = ?').run(existingCompletion.id);
      return res.json({
        message: 'Class work marked as pending / incomplete.',
        is_completed: false,
        completed_at: null,
      });
    } else {
      // Mark as completed
      const insert = db.prepare(`
        INSERT INTO task_completions (classwork_id, student_id, student_roll_number, student_name, student_section, notes)
        VALUES (?, ?, ?, ?, ?, ?)
      `);

      insert.run(
        id,
        student.id,
        student.roll_number,
        student.name,
        student.section || 'General',
        notes || 'Marked completed by student'
      );

      const completionRecord = db.prepare(
        'SELECT completed_at FROM task_completions WHERE classwork_id = ? AND student_id = ?'
      ).get(id, student.id);

      return res.json({
        message: 'Class work marked as completed!',
        is_completed: true,
        completed_at: completionRecord.completed_at,
        student_roll_number: student.roll_number,
      });
    }
  } catch (err) {
    console.error('Error toggling completion:', err);
    return res.status(500).json({ error: 'Failed to update completion status.' });
  }
};

// GET /api/classworks/:id/completions (Admin or view)
// Returns list of students who completed and who haven't completed
exports.getClassworkCompletions = (req, res) => {
  try {
    const { id } = req.params;
    const work = db.prepare('SELECT * FROM classworks WHERE id = ?').get(id);
    if (!work) {
      return res.status(404).json({ error: 'Class work not found.' });
    }

    // List of completed students
    const completedStudents = db.prepare(`
      SELECT 
        tc.id AS completion_id,
        tc.student_id,
        tc.student_roll_number,
        tc.student_name,
        tc.student_section,
        tc.completed_at,
        tc.notes
      FROM task_completions tc
      WHERE tc.classwork_id = ?
      ORDER BY tc.completed_at DESC
    `).all(id);

    // List of eligible students for this target section (to show pending students)
    let eligibleStudentsQuery = `SELECT id, roll_number, name, section FROM users WHERE role = 'student'`;
    const eligibleParams = [];
    if (work.target_section !== 'ALL') {
      eligibleStudentsQuery += ` AND section = ?`;
      eligibleParams.push(work.target_section);
    }
    eligibleStudentsQuery += ` ORDER BY roll_number ASC`;

    const allEligibleStudents = db.prepare(eligibleStudentsQuery).all(...eligibleParams);

    const completedIds = new Set(completedStudents.map(c => c.student_id));
    const pendingStudents = allEligibleStudents.filter(s => !completedIds.has(s.id));

    return res.json({
      classwork: work,
      total_eligible: allEligibleStudents.length,
      total_completed: completedStudents.length,
      completion_percentage: allEligibleStudents.length > 0 
        ? Math.round((completedStudents.length / allEligibleStudents.length) * 100) 
        : 0,
      completed_students: completedStudents,
      pending_students: pendingStudents,
    });
  } catch (err) {
    console.error('Error fetching completions:', err);
    return res.status(500).json({ error: 'Failed to retrieve completion report.' });
  }
};

// GET /api/stats (Overview metrics)
exports.getOverviewStats = (req, res) => {
  try {
    const isStudent = req.user && req.user.role === 'student';
    const student = req.user;

    if (isStudent) {
      // Student-specific statistics
      const section = student.section;
      const totalWorks = db.prepare(`
        SELECT COUNT(*) as count FROM classworks 
        WHERE (target_section = ? OR target_section = 'ALL')
      `).get(section).count;

      const completedWorks = db.prepare(`
        SELECT COUNT(tc.id) as count FROM task_completions tc
        JOIN classworks c ON tc.classwork_id = c.id
        WHERE tc.student_id = ? AND (c.target_section = ? OR c.target_section = 'ALL')
      `).get(student.id, section).count;

      const pendingWorks = Math.max(0, totalWorks - completedWorks);

      return res.json({
        role: 'student',
        total_tasks: totalWorks,
        completed_tasks: completedWorks,
        pending_tasks: pendingWorks,
        completion_rate: totalWorks > 0 ? Math.round((completedWorks / totalWorks) * 100) : 0,
      });
    } else {
      // Admin overall statistics
      const totalWorks = db.prepare('SELECT COUNT(*) as count FROM classworks').get().count;
      const totalStudents = db.prepare("SELECT COUNT(*) as count FROM users WHERE role = 'student'").get().count;
      const totalCompletions = db.prepare('SELECT COUNT(*) as count FROM task_completions').get().count;
      
      const sections = db.prepare(`
        SELECT DISTINCT target_section FROM classworks WHERE target_section != 'ALL'
      `).all().map(s => s.target_section);

      return res.json({
        role: 'admin',
        total_works: totalWorks,
        total_students: totalStudents,
        total_completions: totalCompletions,
        active_sections: sections,
      });
    }
  } catch (err) {
    console.error('Error fetching stats:', err);
    return res.status(500).json({ error: 'Failed to fetch overview stats.' });
  }
};
