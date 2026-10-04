# Deployment Guide: Class Work Scheduler 🚀

This application is architected as a **unified full-stack Node.js application**. The Express backend serves both the REST API routes (`/api/...`) and the production-built React frontend assets (`frontend/dist`) on a **single port**. This makes deploying to any cloud provider simple with zero complex multi-domain CORS configurations.

---

## 1. How Sections Work (Currently Set to 1 Section)

The application is now configured to focus on **one single section**: `CSE-A`.

All configuration is located in:
👉 [`backend/src/config/sections.js`](backend/src/config/sections.js)

```javascript
// Currently set to 1 section as requested:
const ACTIVE_SECTIONS = ['CSE-A'];

module.exports = {
  ACTIVE_SECTIONS,
  DEFAULT_SECTION: ACTIVE_SECTIONS[0] || 'CSE-A',
};
```

### ➕ How to add more sections in the future:
Whenever you are ready to expand to other sections, simply add them to the array:
```javascript
const ACTIVE_SECTIONS = ['CSE-A', 'CSE-B', 'ECE-A', 'IT-A'];
```
The entire application (Student registration dropdown, Admin assignment creator, and Dashboard filters) will adapt dynamically!

---

## 2. Deploying Live to the Cloud

### Option A: Render.com (Recommended & Very Easy)

[Render](https://render.com) is one of the easiest ways to host full-stack Node.js + SQLite applications for free or low cost.

1. **Push your code to GitHub**:
   ```bash
   git init
   git add .
   git commit -m "Initial commit of Class Work Scheduler"
   git branch -M main
   git remote add origin https://github.com/YOUR_USERNAME/classwork-scheduler.git
   git push -u origin main
   ```

2. **Create a Web Service on Render**:
   - Go to [dashboard.render.com](https://dashboard.render.com) and click **"New +" -> "Web Service"**.
   - Connect your GitHub repository.
   - Configure the following settings:
     - **Name**: `classwork-scheduler` (or your college name)
     - **Language**: `Node`
     - **Branch**: `main`
     - **Build Command**: `npm run build`
     - **Start Command**: `npm start`
     - **Instance Type**: Free (or Starter if you want persistent disk for database)

3. **Persistent SQLite Disk (Recommended on Render for persistent data across restarts)**:
   - In your Render Web Service settings, go to **Disks**.
   - Click **Add Disk**:
     - Name: `scheduler-data`
     - Mount Path: `/opt/render/project/src/backend/data`
     - Size: 1 GB (plenty for thousands of assignments & completions)

4. **Click Deploy**:
   - Render will run `npm run build` (which builds the React frontend) and then execute `npm start`.
   - In 2–3 minutes, you will get a live public URL like:
     **`https://classwork-scheduler.onrender.com`**

---

### Option B: Railway.app

1. Go to [railway.app](https://railway.app) and click **"New Project" -> "Deploy from GitHub repo"**.
2. Select your repository.
3. Railway automatically detects Node.js and executes `npm run build` and `npm start`.
4. Under the service settings, click **"Generate Domain"** to get your public `https://...up.railway.app` URL.
5. Add a volume mounted at `/app/backend/data` to persist your SQLite database.

---

### Option C: Self-Hosting on a VPS / Cloud VM (Ubuntu, DigitalOcean, AWS EC2)

If you have a Linux server:

1. Clone your repository:
   ```bash
   git clone https://github.com/YOUR_USERNAME/classwork-scheduler.git
   cd classwork-scheduler
   ```

2. Install dependencies & build:
   ```bash
   npm run build
   ```

3. Run with PM2 (Process Manager for 24/7 uptime):
   ```bash
   sudo npm install -g pm2
   pm2 start backend/src/server.js --name "classwork-scheduler"
   pm2 save
   pm2 startup
   ```

4. Point your domain (e.g. `scheduler.yourcollege.edu`) using Nginx reverse proxy to `http://localhost:5000`.

---

## 3. Local Production Preview

To test exactly how the live production server runs locally on a single port:
```bash
npm start
```
Open **`http://localhost:5000`** in your browser. Notice how both the React frontend and all backend APIs run together on port 5000!
