const http = require('http');
const { spawn } = require('child_process');

function request(url, options = {}) {
  return new Promise((resolve, reject) => {
    const parsed = new URL(url);
    const req = http.request(
      {
        hostname: parsed.hostname,
        port: parsed.port,
        path: parsed.pathname + parsed.search,
        method: options.method || 'GET',
        headers: options.headers || {},
      },
      (res) => {
        let body = '';
        res.on('data', (chunk) => (body += chunk));
        res.on('end', () => {
          try {
            const json = body ? JSON.parse(body) : {};
            resolve({ status: res.statusCode, data: json });
          } catch (e) {
            resolve({ status: res.statusCode, body });
          }
        });
      }
    );
    req.on('error', reject);
    if (options.body) {
      req.write(typeof options.body === 'string' ? options.body : JSON.stringify(options.body));
    }
    req.end();
  });
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function run() {
  console.log('--- Starting Backend Server for Test ---');
  const serverProcess = spawn('node', ['src/server.js'], { cwd: __dirname, stdio: 'inherit' });
  await sleep(1500);

  const BASE = 'http://localhost:5000/api';

  try {
    // 1. Health check
    console.log('1. Health check...');
    const health = await request(`${BASE}/health`);
    if (health.status !== 200) throw new Error('Health check failed: ' + health.status);

    // 2. Admin Login
    console.log('2. Admin login...');
    const adminLogin = await request(`${BASE}/auth/admin/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: { username: 'admin', password: 'admin123' },
    });
    if (adminLogin.status !== 200) throw new Error('Admin login failed: ' + JSON.stringify(adminLogin.data));
    const adminToken = adminLogin.data.token;
    const authHeaders = {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${adminToken}`,
    };

    // 3. Get Sections
    console.log('3. Fetching sections...');
    const secRes = await request(`${BASE}/sections`);
    console.log('Existing sections:', secRes.data.sections);

    // 4. Create new section 'MECH-A'
    console.log('4. Creating section MECH-A...');
    const createSec = await request(`${BASE}/sections`, {
      method: 'POST',
      headers: authHeaders,
      body: { name: 'MECH-A' },
    });
    console.log('Create section response:', createSec.data);
    if (createSec.status !== 201) throw new Error('Failed to create section MECH-A');

    // 5. Add student login in 'MECH-A'
    console.log('5. Adding student login in MECH-A...');
    const addStudent = await request(`${BASE}/students`, {
      method: 'POST',
      headers: authHeaders,
      body: {
        roll_number: '22A91A0301',
        name: 'Arjun Verma',
        section: 'MECH-A',
        year: 3,
        department: 'Mechanical Engineering',
        password: 'studentpassword123',
      },
    });
    console.log('Add student response:', addStudent.data);
    if (addStudent.status !== 201) throw new Error('Failed to add student login');
    const newStudentId = addStudent.data.student.id;

    // 6. Test login with newly created student credentials
    console.log('6. Verifying student login with newly created account...');
    const studentLogin = await request(`${BASE}/auth/student/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: { roll_number: '22A91A0301', password: 'studentpassword123' },
    });
    console.log('Student login status:', studentLogin.status, 'User:', studentLogin.data.user?.name);
    if (studentLogin.status !== 200) throw new Error('Failed to log in as newly created student');

    // 7. Get students list as admin
    console.log('7. Listing students as admin...');
    const listStudents = await request(`${BASE}/students`, { headers: authHeaders });
    const found = listStudents.data.students.find((s) => s.roll_number === '22A91A0301');
    if (!found) throw new Error('Created student not found in list');
    console.log('Found student in admin list:', found.name, found.roll_number, found.section);

    // 8. Try deleting section MECH-A without force (should be rejected because student is enrolled)
    console.log('8. Testing safety check: Delete non-empty section MECH-A without force...');
    const safeDelete = await request(`${BASE}/sections/MECH-A`, {
      method: 'DELETE',
      headers: authHeaders,
    });
    console.log('Safe delete status (expected 400):', safeDelete.status, safeDelete.data.error);
    if (safeDelete.status !== 400 || !safeDelete.data.hasDependencies) {
      throw new Error('Expected 400 with hasDependencies: true');
    }

    // 9. Delete student account
    console.log('9. Deleting student account...');
    const delStudent = await request(`${BASE}/students/${newStudentId}`, {
      method: 'DELETE',
      headers: authHeaders,
    });
    console.log('Delete student response:', delStudent.data);
    if (delStudent.status !== 200) throw new Error('Failed to delete student');

    // 10. Delete section MECH-A now that it is empty
    console.log('10. Deleting section MECH-A now that it has no students...');
    const delSec = await request(`${BASE}/sections/MECH-A`, {
      method: 'DELETE',
      headers: authHeaders,
    });
    console.log('Delete section response:', delSec.data);
    if (delSec.status !== 200) throw new Error('Failed to delete section');

    console.log('\n>>> ALL NEW BACKEND FEATURES TESTED SUCCESSFULLY! <<<');
  } finally {
    serverProcess.kill();
  }
}

run().catch((err) => {
  console.error('Test error:', err);
  process.exit(1);
});
