import { supabase, isSupabaseConfigured } from './supabaseClient';
import { authStorage } from './api';

export const supabaseService = {
  // Student Login with Roll Number
  studentLogin: async (roll_number, password) => {
    if (!isSupabaseConfigured) throw new Error('Supabase is not configured.');

    const cleanRoll = roll_number.trim().toUpperCase();
    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .ilike('roll_number', cleanRoll)
      .eq('role', 'student')
      .maybeSingle();

    if (error) throw new Error(error.message);
    if (!user) throw new Error('Invalid Roll Number or Student not registered.');

    if (user.password !== password) {
      throw new Error('Incorrect password.');
    }

    const sessionUser = {
      id: user.id,
      roll_number: user.roll_number,
      name: user.name,
      role: user.role,
      section: user.section,
      year: user.year,
      department: user.department,
    };

    authStorage.setToken(`supabase_token_${user.id}`);
    authStorage.setUser(sessionUser);

    return {
      message: 'Student login successful',
      token: `supabase_token_${user.id}`,
      user: sessionUser,
    };
  },

  // Student Registration
  studentRegister: async (userData) => {
    if (!isSupabaseConfigured) throw new Error('Supabase is not configured.');

    const cleanRoll = userData.roll_number.trim().toUpperCase();

    // Check existing
    const { data: existing } = await supabase
      .from('users')
      .select('id')
      .ilike('roll_number', cleanRoll)
      .maybeSingle();

    if (existing) {
      throw new Error('A student with this Roll Number is already registered.');
    }

    const { data: newUser, error } = await supabase
      .from('users')
      .insert([
        {
          roll_number: cleanRoll,
          name: userData.name.trim(),
          password: userData.password,
          role: 'student',
          section: userData.section || 'CSE-A',
          year: userData.year || 3,
          department: userData.department || 'Computer Science & Engineering',
        },
      ])
      .select()
      .single();

    if (error) throw new Error(error.message);

    const sessionUser = {
      id: newUser.id,
      roll_number: newUser.roll_number,
      name: newUser.name,
      role: newUser.role,
      section: newUser.section,
      year: newUser.year,
      department: newUser.department,
    };

    authStorage.setToken(`supabase_token_${newUser.id}`);
    authStorage.setUser(sessionUser);

    return {
      message: 'Registration successful!',
      token: `supabase_token_${newUser.id}`,
      user: sessionUser,
    };
  },

  // Admin Login
  adminLogin: async (username, password) => {
    if (!isSupabaseConfigured) throw new Error('Supabase is not configured.');

    const cleanUser = username.trim().toLowerCase();
    const { data: admin, error } = await supabase
      .from('users')
      .select('*')
      .ilike('roll_number', cleanUser)
      .eq('role', 'admin')
      .maybeSingle();

    if (error) throw new Error(error.message);
    if (!admin) throw new Error('Invalid Admin credentials.');

    if (admin.password !== password) {
      throw new Error('Incorrect admin password.');
    }

    const sessionUser = {
      id: admin.id,
      roll_number: admin.roll_number,
      name: admin.name,
      role: admin.role,
      department: admin.department,
    };

    authStorage.setToken(`supabase_token_${admin.id}`);
    authStorage.setUser(sessionUser);

    return {
      message: 'Admin login successful',
      token: `supabase_token_${admin.id}`,
      user: sessionUser,
    };
  },

  getProfile: async () => {
    const user = authStorage.getUser();
    if (!user) throw new Error('Not authenticated');
    return { user };
  },

  getSections: async () => {
    if (!isSupabaseConfigured) return { sections: [], default_section: '' };

    let sectionsList = [];
    let fromTable = false;

    try {
      const { data, error } = await supabase.from('sections').select('*').order('name', { ascending: true });
      if (!error && data && data.length > 0) {
        sectionsList = data.map((s) => s.name.toUpperCase());
        fromTable = true;
      }
    } catch {
      // Table doesn't exist yet in Supabase
    }

    if (!fromTable) {
      // Collect from users and classworks (no hardcoded default)
      const found = new Set();
      try {
        const [uRes, cRes] = await Promise.all([
          supabase.from('users').select('section'),
          supabase.from('classworks').select('target_section'),
        ]);

        (uRes.data || []).forEach((u) => {
          if (u.section && u.section !== 'ALL') found.add(u.section.toUpperCase());
        });
        (cRes.data || []).forEach((c) => {
          if (c.target_section && c.target_section !== 'ALL') found.add(c.target_section.toUpperCase());
        });
      } catch {}

      try {
        const local = JSON.parse(localStorage.getItem('classwork_sections') || '[]');
        local.forEach((s) => found.add(s.toUpperCase()));
      } catch {}

      sectionsList = Array.from(found).sort();
    }

    // Calculate students and works counts per section
    const stuCounts = {};
    const workCounts = {};
    try {
      const [uAll, cAll] = await Promise.all([
        supabase.from('users').select('section').eq('role', 'student'),
        supabase.from('classworks').select('target_section'),
      ]);

      (uAll.data || []).forEach((u) => {
        const sec = (u.section || '').toUpperCase();
        stuCounts[sec] = (stuCounts[sec] || 0) + 1;
      });

      (cAll.data || []).forEach((c) => {
        const sec = (c.target_section || '').toUpperCase();
        workCounts[sec] = (workCounts[sec] || 0) + 1;
      });
    } catch {}

    const sectionsDetail = sectionsList.map((name) => ({
      name,
      student_count: stuCounts[name] || 0,
      work_count: workCounts[name] || 0,
    }));

    return {
      sections: sectionsList,
      default_section: sectionsList[0] || '',
      sections_detail: sectionsDetail,
    };
  },

  createSection: async (name) => {
    if (!isSupabaseConfigured) throw new Error('Supabase is not configured.');
    const cleanName = name.trim().toUpperCase();
    if (cleanName.length < 2 || cleanName.length > 20) {
      throw new Error('Section name must be between 2 and 20 characters.');
    }
    if (cleanName === 'ALL') {
      throw new Error('"ALL" is a reserved keyword.');
    }

    // Try inserting into sections table in Supabase
    try {
      const { error } = await supabase.from('sections').insert([{ name: cleanName }]);
      if (error && error.code === '23505') {
        throw new Error(`Section "${cleanName}" already exists.`);
      }
    } catch (err) {
      if (err.message && err.message.includes('already exists')) {
        throw err;
      }
    }

    // Save to localStorage so it is remembered seamlessly
    try {
      const local = JSON.parse(localStorage.getItem('classwork_sections') || '[]');
      if (!local.includes(cleanName)) {
        local.push(cleanName);
        localStorage.setItem('classwork_sections', JSON.stringify(local));
      }
    } catch {}

    const res = await supabaseService.getSections();
    return {
      message: `Section "${cleanName}" created successfully!`,
      section: cleanName,
      sections: res.sections,
    };
  },

  deleteSection: async (name, force = false) => {
    if (!isSupabaseConfigured) throw new Error('Supabase is not configured.');
    const cleanName = name.trim().toUpperCase();

    // Check dependencies
    const { count: studentCount } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true })
      .ilike('section', cleanName)
      .eq('role', 'student');

    const { count: workCount } = await supabase
      .from('classworks')
      .select('*', { count: 'exact', head: true })
      .ilike('target_section', cleanName);

    if ((studentCount > 0 || workCount > 0) && !force) {
      const err = new Error(
        `Cannot delete section "${cleanName}". There are ${studentCount || 0} student(s) and ${workCount || 0} classwork(s) currently assigned to this section.`
      );
      err.hasDependencies = true;
      err.studentCount = studentCount || 0;
      err.workCount = workCount || 0;
      throw err;
    }

    try {
      await supabase.from('sections').delete().ilike('name', cleanName);
    } catch {}

    try {
      const local = JSON.parse(localStorage.getItem('classwork_sections') || '[]');
      const filtered = local.filter((s) => s.toUpperCase() !== cleanName);
      localStorage.setItem('classwork_sections', JSON.stringify(filtered));
    } catch {}

    const res = await supabaseService.getSections();
    return {
      message: `Section "${cleanName}" deleted successfully.`,
      sections: res.sections,
    };
  },

  // Student Accounts Management
  getStudents: async (params = {}) => {
    if (!isSupabaseConfigured) throw new Error('Supabase is not configured.');
    let query = supabase.from('users').select('*').eq('role', 'student');
    if (params.section && params.section !== 'ALL') {
      query = query.ilike('section', params.section);
    }
    if (params.search) {
      query = query.or(`roll_number.ilike.%${params.search}%,name.ilike.%${params.search}%`);
    }
    query = query.order('roll_number', { ascending: true });
    const { data: students, error } = await query;
    if (error) throw new Error(error.message);

    const { data: completions } = await supabase.from('task_completions').select('student_id');
    const compMap = {};
    (completions || []).forEach((c) => {
      compMap[c.student_id] = (compMap[c.student_id] || 0) + 1;
    });

    return {
      students: (students || []).map((s) => ({
        ...s,
        completed_tasks_count: compMap[s.id] || 0,
      })),
    };
  },

  createStudent: async (studentData) => {
    if (!isSupabaseConfigured) throw new Error('Supabase is not configured.');
    const cleanRoll = studentData.roll_number.trim().toUpperCase();

    const { data: existing } = await supabase
      .from('users')
      .select('id')
      .ilike('roll_number', cleanRoll)
      .maybeSingle();

    if (existing) {
      throw new Error(`A student with Roll Number "${cleanRoll}" is already registered.`);
    }

    const { data: newStudent, error } = await supabase
      .from('users')
      .insert([
        {
          roll_number: cleanRoll,
          name: studentData.name.trim(),
          password: studentData.password,
          role: 'student',
          section: studentData.section || 'CSE-A',
          year: studentData.year || 3,
          department: studentData.department || 'Computer Science & Engineering',
        },
      ])
      .select()
      .single();

    if (error) throw new Error(error.message);

    return {
      message: `Student account for ${newStudent.name} (${newStudent.roll_number}) created successfully!`,
      student: {
        ...newStudent,
        completed_tasks_count: 0,
      },
    };
  },

  deleteStudent: async (id) => {
    if (!isSupabaseConfigured) throw new Error('Supabase is not configured.');
    await supabase.from('task_completions').delete().eq('student_id', id);
    const { error } = await supabase.from('users').delete().eq('id', id);
    if (error) throw new Error(error.message);
    return { message: 'Student account deleted successfully.' };
  },

  // Fetch Classworks with Completion Status for Student
  getClassworks: async (params = {}) => {
    if (!isSupabaseConfigured) throw new Error('Supabase is not configured.');

    const currentUser = authStorage.getUser();
    const isStudent = currentUser?.role === 'student';

    let query = supabase.from('classworks').select('*');

    // Section filter
    if (params.section && params.section !== 'ALL') {
      query = query.or(`target_section.eq.${params.section},target_section.eq.ALL`);
    }

    if (params.category && params.category !== 'ALL') {
      query = query.eq('category', params.category);
    }

    if (params.priority && params.priority !== 'ALL') {
      query = query.eq('priority', params.priority);
    }

    if (params.search) {
      query = query.or(`title.ilike.%${params.search}%,subject.ilike.%${params.search}%,faculty_name.ilike.%${params.search}%`);
    }

    query = query.order('due_date', { ascending: true });

    const { data: works, error } = await query;
    if (error) throw new Error(error.message);

    // Get completions for each work
    const { data: completions, error: compError } = await supabase
      .from('task_completions')
      .select('*');

    if (compError) throw new Error(compError.message);

    const formattedWorks = works.map((w) => {
      const taskCompletions = (completions || []).filter((c) => c.classwork_id === w.id);
      const studentCompletion = isStudent
        ? taskCompletions.find((c) => c.student_id === currentUser.id)
        : null;

      return {
        ...w,
        total_completions: taskCompletions.length,
        is_completed: Boolean(studentCompletion),
        completed_at: studentCompletion?.completed_at || null,
      };
    });

    return { classworks: formattedWorks };
  },

  // Student Toggle Mark Completed
  toggleComplete: async (id, notes = '') => {
    if (!isSupabaseConfigured) throw new Error('Supabase is not configured.');

    const student = authStorage.getUser();
    if (!student || student.role !== 'student') throw new Error('Students only.');

    // Check if exists
    const { data: existing } = await supabase
      .from('task_completions')
      .select('id')
      .eq('classwork_id', id)
      .eq('student_id', student.id)
      .maybeSingle();

    if (existing) {
      // Delete completion
      const { error } = await supabase
        .from('task_completions')
        .delete()
        .eq('id', existing.id);

      if (error) throw new Error(error.message);
      return {
        message: 'Marked as pending.',
        is_completed: false,
        completed_at: null,
      };
    } else {
      // Insert completion
      const { data: inserted, error } = await supabase
        .from('task_completions')
        .insert([
          {
            classwork_id: id,
            student_id: student.id,
            student_roll_number: student.roll_number,
            student_name: student.name,
            student_section: student.section || 'CSE-A',
            notes: notes || 'Marked completed by student',
          },
        ])
        .select()
        .single();

      if (error) throw new Error(error.message);
      return {
        message: 'Class work marked as completed!',
        is_completed: true,
        completed_at: inserted.completed_at,
        student_roll_number: student.roll_number,
      };
    }
  },

  // Create Assignment (Admin)
  createClasswork: async (workData) => {
    if (!isSupabaseConfigured) throw new Error('Supabase is not configured.');

    const { data, error } = await supabase
      .from('classworks')
      .insert([
        {
          title: workData.title.trim(),
          subject: workData.subject.trim(),
          faculty_name: workData.faculty_name.trim(),
          description: workData.description?.trim() || '',
          target_section: workData.target_section?.trim() || 'CSE-A',
          category: workData.category || 'Assignment',
          priority: workData.priority || 'Medium',
          due_date: workData.due_date,
          resource_url: workData.resource_url?.trim() || '',
        },
      ])
      .select()
      .single();

    if (error) throw new Error(error.message);
    return { message: 'Class work posted successfully!', classwork: data };
  },

  // Update Assignment (Admin)
  updateClasswork: async (id, workData) => {
    if (!isSupabaseConfigured) throw new Error('Supabase is not configured.');

    const { data, error } = await supabase
      .from('classworks')
      .update({
        title: workData.title.trim(),
        subject: workData.subject.trim(),
        faculty_name: workData.faculty_name.trim(),
        description: workData.description?.trim() || '',
        target_section: workData.target_section?.trim() || 'CSE-A',
        category: workData.category || 'Assignment',
        priority: workData.priority || 'Medium',
        due_date: workData.due_date,
        resource_url: workData.resource_url?.trim() || '',
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw new Error(error.message);
    return { message: 'Class work updated successfully!', classwork: data };
  },

  // Delete Assignment (Admin)
  deleteClasswork: async (id) => {
    if (!isSupabaseConfigured) throw new Error('Supabase is not configured.');

    const { error } = await supabase.from('classworks').delete().eq('id', id);
    if (error) throw new Error(error.message);
    return { message: 'Class work deleted successfully.' };
  },

  // Get Completions Roster (Admin)
  getClassworkCompletions: async (id) => {
    if (!isSupabaseConfigured) throw new Error('Supabase is not configured.');

    const { data: work, error: workErr } = await supabase
      .from('classworks')
      .select('*')
      .eq('id', id)
      .single();

    if (workErr) throw new Error(workErr.message);

    const { data: completions, error: compErr } = await supabase
      .from('task_completions')
      .select('*')
      .eq('classwork_id', id)
      .order('completed_at', { ascending: false });

    if (compErr) throw new Error(compErr.message);

    // Eligible students
    let query = supabase.from('users').select('id, roll_number, name, section').eq('role', 'student');
    if (work.target_section !== 'ALL') {
      query = query.eq('section', work.target_section);
    }
    query = query.order('roll_number', { ascending: true });

    const { data: eligibleStudents, error: studErr } = await query;
    if (studErr) throw new Error(studErr.message);

    const completedIds = new Set((completions || []).map((c) => c.student_id));
    const pendingStudents = (eligibleStudents || []).filter((s) => !completedIds.has(s.id));

    return {
      classwork: work,
      total_eligible: eligibleStudents?.length || 0,
      total_completed: completions?.length || 0,
      completion_percentage: eligibleStudents?.length
        ? Math.round(((completions?.length || 0) / eligibleStudents.length) * 100)
        : 0,
      completed_students: (completions || []).map((c) => ({
        ...c,
        completion_id: c.id,
      })),
      pending_students: pendingStudents,
    };
  },

  // Get Stats
  getStats: async () => {
    if (!isSupabaseConfigured) throw new Error('Supabase is not configured.');

    const currentUser = authStorage.getUser();
    const isStudent = currentUser?.role === 'student';

    if (isStudent) {
      const section = currentUser.section || 'CSE-A';
      const { data: works } = await supabase
        .from('classworks')
        .select('id')
        .or(`target_section.eq.${section},target_section.eq.ALL`);

      const totalTasks = works?.length || 0;

      const { data: completions } = await supabase
        .from('task_completions')
        .select('id')
        .eq('student_id', currentUser.id);

      const completedTasks = completions?.length || 0;
      const pendingTasks = Math.max(0, totalTasks - completedTasks);

      return {
        role: 'student',
        total_tasks: totalTasks,
        completed_tasks: completedTasks,
        pending_tasks: pendingTasks,
        completion_rate: totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0,
      };
    } else {
      const { count: totalWorks } = await supabase.from('classworks').select('*', { count: 'exact', head: true });
      const { count: totalStudents } = await supabase.from('users').select('*', { count: 'exact', head: true }).eq('role', 'student');
      const { count: totalCompletions } = await supabase.from('task_completions').select('*', { count: 'exact', head: true });

      return {
        role: 'admin',
        total_works: totalWorks || 0,
        total_students: totalStudents || 0,
        total_completions: totalCompletions || 0,
        active_sections: [],
      };
    }
  },
};
