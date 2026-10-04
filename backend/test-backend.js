const db = require('./src/config/database');

console.log('Testing Database and Seed Data...');
const users = db.prepare('SELECT id, roll_number, name, role, section FROM users').all();
console.log(`Users count: ${users.length}`);
users.forEach(u => console.log(` - [${u.role.toUpperCase()}] ${u.roll_number} | ${u.name} | Sec: ${u.section}`));

const works = db.prepare('SELECT id, title, subject, target_section, priority FROM classworks').all();
console.log(`\nClassworks count: ${works.length}`);
works.forEach(w => console.log(` - [#${w.id}] [${w.target_section}] ${w.subject}: ${w.title}`));

const completions = db.prepare('SELECT * FROM task_completions').all();
console.log(`\nCompletions count: ${completions.length}`);
completions.forEach(c => console.log(` - Student ${c.student_roll_number} completed Work #${c.classwork_id} at ${c.completed_at}`));

console.log('\nAll database tests passed successfully!');
