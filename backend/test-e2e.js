const http = require('http');

// Wait for a bit
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function request(url, options = {}) {
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

async function runTests() {
  console.log('=== STARTING END-TO-END INTEGRATION TEST ===\n');
  const BASE_URL = 'http://localhost:5000/api';

  // 1. Health check
  console.log('1. Checking Backend API Health...');
  const health = await request(`${BASE_URL}/health`);
  console.log(`Status: ${health.status}, Response:`, health.data);
  if (health.status !== 200) throw new Error('Health check failed');

  // 2. Student login with Roll Number
  console.log('\n2. Testing Student Login with Roll Number (22A91A0501)...');
  const studentLoginRes = await request(`${BASE_URL}/auth/student/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: { roll_number: '22A91A0501', password: 'student123' },
  });
  console.log(`Status: ${studentLoginRes.status}, User: ${studentLoginRes.data.user?.name} (Sec: ${studentLoginRes.data.user?.section})`);
  if (studentLoginRes.status !== 200 || !studentLoginRes.data.token) {
    throw new Error('Student login failed');
  }
  const studentToken = studentLoginRes.data.token;

  // 3. Fetch classworks for CSE-A
  console.log('\n3. Fetching Classworks for Student (CSE-A)...');
  const worksRes = await request(`${BASE_URL}/classworks?section=CSE-A`, {
    headers: { Authorization: `Bearer ${studentToken}` },
  });
  console.log(`Found ${worksRes.data.classworks?.length} classworks for CSE-A`);
  worksRes.data.classworks.forEach(w => {
    console.log(` - Work #${w.id} [${w.subject}] "${w.title}": is_completed = ${w.is_completed}`);
  });

  // 4. Mark Completed: Student marks Work #3 as completed
  console.log('\n4. Student hits "Mark Completed" for Work #3 (Knapsack Analysis)...');
  const toggleRes = await request(`${BASE_URL}/classworks/3/complete`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${studentToken}`,
    },
    body: { notes: 'Finished benchmarking code & chart' },
  });
  console.log('Mark Completed Response:', toggleRes.data);
  if (!toggleRes.data.is_completed) {
    throw new Error('Expected work #3 to be marked completed');
  }

  // 5. Admin Login
  console.log('\n5. Testing Admin Login (admin / admin123)...');
  const adminLoginRes = await request(`${BASE_URL}/auth/admin/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: { username: 'admin', password: 'admin123' },
  });
  console.log(`Status: ${adminLoginRes.status}, Admin Name: ${adminLoginRes.data.user?.name}`);
  if (adminLoginRes.status !== 200 || !adminLoginRes.data.token) {
    throw new Error('Admin login failed');
  }
  const adminToken = adminLoginRes.data.token;

  // 6. Admin checks Completion Roster for Work #3
  console.log('\n6. Admin inspects Student Completion Roster for Work #3...');
  const rosterRes = await request(`${BASE_URL}/classworks/3/completions`, {
    headers: { Authorization: `Bearer ${adminToken}` },
  });
  console.log(`Classwork: "${rosterRes.data.classwork.title}"`);
  console.log(`Completed Count: ${rosterRes.data.total_completed} / ${rosterRes.data.total_eligible} (${rosterRes.data.completion_percentage}%)`);
  console.log('Completed Students:');
  rosterRes.data.completed_students.forEach(s => {
    console.log(`   * Roll No: ${s.student_roll_number} | ${s.student_name} | Section: ${s.student_section} | Time: ${s.completed_at}`);
  });

  const foundAarav = rosterRes.data.completed_students.some(s => s.student_roll_number === '22A91A0501');
  if (!foundAarav) {
    throw new Error('Roll Number 22A91A0501 was not found in completed roster!');
  }
  console.log('✓ VERIFIED: Student 22A91A0501 successfully registered in completion roster!');

  // 7. Admin creates a new classwork
  console.log('\n7. Admin posts a brand new Class Work for CSE-A...');
  const newWorkRes = await request(`${BASE_URL}/classworks`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${adminToken}`,
    },
    body: {
      title: 'Cloud Computing AWS EC2 & S3 Deployment Lab',
      subject: 'Cloud Computing',
      faculty_name: 'Dr. V. Ramanathan',
      description: 'Deploy a Node.js microservice on an AWS EC2 instance and configure S3 static asset bucket with IAM policies.',
      target_section: 'CSE-A',
      category: 'Lab Task',
      priority: 'High',
      due_date: new Date(Date.now() + 86400000 * 4).toISOString().slice(0, 16),
      resource_url: 'https://aws.amazon.com',
    },
  });
  console.log(`Created new classwork with ID #${newWorkRes.data.classwork?.id}: "${newWorkRes.data.classwork?.title}"`);

  // 8. Student retrieves the new classwork
  const verifyStudentWorks = await request(`${BASE_URL}/classworks?section=CSE-A`, {
    headers: { Authorization: `Bearer ${studentToken}` },
  });
  const foundNew = verifyStudentWorks.data.classworks.find(w => w.id === newWorkRes.data.classwork?.id);
  if (!foundNew) {
    throw new Error('Newly created classwork not visible to student');
  }
  console.log(`✓ VERIFIED: Student in CSE-A sees new classwork "${foundNew.title}" (Status: is_completed = ${foundNew.is_completed})`);

  console.log('\n=== ALL END-TO-END TESTS PASSED FLAWLESSLY! ===\n');
}

runTests().catch(err => {
  console.error('\n❌ Test failed:', err);
  process.exit(1);
});
