# Class Work Scheduler 🎓

A full-stack college academic task management and completion tracking platform. Faculty/Admins can post assignments, lab tasks, and project deadlines targeted at specific class sections, while students log in using their **college roll number**, view coursework for their section, and hit **"Mark Completed"** to record submissions in real-time.

---

## ✨ Key Features

### 👨‍🎓 For Students
- **Roll Number Authentication**: Log in using your college-issued roll number (e.g., `22A91A0501`) and password.
- **Student Self-Registration**: Register with Roll Number, Full Name, Class Section, Year, and Department.
- **Section Work Feed**: Automatically filters tasks assigned to your section (`CSE-A`, `CSE-B`, `ECE-A`, `IT-A`, etc.) or college-wide announcements (`ALL`).
- **Interactive "Mark Completed" Button**:
  - One-click completion marking recorded directly into the backend with your roll number and timestamp.
  - Option to undo or revert to pending if needed.
- **Progress Metrics & Urgency Indicators**:
  - Live counts of Total, Completed, and Pending tasks.
  - Progress bar showing your personal completion rate.
  - Urgency badges (`Due Today`, `Due Tomorrow`, `Deadline Passed`, `Due in X days`).

### 👩‍🏫 For Faculty & Admin
- **Faculty / Admin Login**: Dedicated administrative portal.
- **Task Publishing**:
  - Set Subject, Title, Faculty In-charge, Detailed Description, Target Section, Category (`Assignment`, `Lab Task`, `Project Work`, `Homework`), Priority (`Urgent 🔥`, `High`, `Medium`, `Normal`), Due Date & Time, and Reference Links.
- **Student Completion Roster**:
  - View real-time submission percentage for each classwork.
  - Completed student table showing Roll Number, Name, Section, and exact completion timestamp.
  - Pending student list showing students who haven't marked the work completed yet.
- **Edit & Delete**: Full control over posted coursework.

---

## 🚀 Quick Start Guide

### 1. Backend Server
```bash
cd backend
npm install
npm start
```
*Backend runs at:* `http://localhost:5000`  
*API Health check:* `http://localhost:5000/api/health`

### 2. Frontend Application
```bash
cd frontend
npm install
npm run dev
```
*Frontend runs at:* `http://localhost:5173`

---

## 🔑 Preloaded Demo Credentials

For immediate testing, sample student accounts across different sections and an admin account are pre-seeded into the SQLite database. You can also use the **Quick Switch Banner** at the top of the webpage for 1-click login:

| Role | Username / Roll Number | Password | Section | Department |
| :--- | :--- | :--- | :--- | :--- |
| **Admin / Faculty** | `admin` | `admin123` | ALL | Academic Affairs |
| **Student (CSE-A)** | `22A91A0501` | `student123` | CSE-A | Computer Science |
| **Student (CSE-A)** | `22A91A0502` | `student123` | CSE-A | Computer Science |
| **Student (CSE-B)** | `22A91A0503` | `student123` | CSE-B | Computer Science |
| **Student (CSE-B)** | `22A91A0504` | `student123` | CSE-B | Computer Science |
| **Student (ECE-A)** | `22A91A0505` | `student123` | ECE-A | Electronics & Comm |
| **Student (IT-A)** | `22A91A0506` | `student123` | IT-A | Information Tech |

---

## 🛠 Technology Stack

- **Backend**: Node.js, Express.js, SQLite (`better-sqlite3`), JWT (`jsonwebtoken`), bcryptjs, CORS
- **Frontend**: React 19, Vite, Tailwind CSS v4, Lucide React icons
- **Database**: Zero-config persistent SQLite database (`backend/data/scheduler.db`) with foreign key constraints, cascading deletes, and WAL mode.

---

## 🧪 Automated End-to-End Tests

Run the complete test suite verifying student roll-number authentication, section filtering, mark completed recording, and admin roster verification:
```bash
npm run test:e2e
```
