# WFH WatchFace

**Privacy-first remote employee verification.**  
Face verification runs entirely on the employee's device — no images, no video, no biometrics leave the browser. Only an AES-256 encrypted 128-number face embedding is stored.

---

## Project Overview

| Layer | Stack |
|-------|-------|
| Frontend | React + Vite + Tailwind CSS |
| Backend | Express (Node.js ESM) |
| Database | Supabase (PostgreSQL) |
| Face AI | face-api.js (TinyFaceDetector — runs locally) |

Two separate portals in one website:
- **`/employee/*`** — Employee: enroll face, view status, settings
- **`/manager/*`** — Manager: team dashboard, alerts, employee management

---

## Supabase Setup

1. Create a new project at [supabase.com](https://supabase.com)
2. Go to **SQL Editor** in your project
3. Run the full migration:

```
db/migrations/002_supabase.sql
```

4. Copy your **Database URL** from **Project Settings → Database → Connection String (URI)**

---

## Environment Variables

Create `server/.env`:

```env
DATABASE_URL=postgresql://postgres:YOUR_PASSWORD@db.YOUR_PROJECT.supabase.co:5432/postgres
JWT_SECRET=your-jwt-secret-min-32-chars-change-me
EMBEDDING_ENCRYPTION_KEY=your-32-byte-key-change-me!!!!!
CLIENT_ORIGIN=http://localhost:5173
PORT=4000
BCRYPT_ROUNDS=12
```

> **Important:** `EMBEDDING_ENCRYPTION_KEY` must be exactly 32 bytes (characters). The JWT_SECRET should be at least 32 random characters.

---

## Install Dependencies

```bash
# Install root tooling (concurrently)
npm install

# Install client + server dependencies
npm run install:all
```

---

## Download Face Models

```bash
node download-models.js
```

This downloads TinyFaceDetector model files into `client/public/models/`. Required for face verification to work.

---

## Register First Manager (via API)

```bash
curl -X POST http://localhost:4000/api/auth/manager/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Bob Manager",
    "email": "bob@company.com",
    "manager_code": "MGR001",
    "password": "securepassword123",
    "department": "Engineering"
  }'
```

---

## Register Employee (via API)

```bash
curl -X POST http://localhost:4000/api/auth/employee/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Alice Employee",
    "email": "alice@company.com",
    "employee_code": "EMP001",
    "password": "securepassword123",
    "department": "Engineering",
    "manager_code": "MGR001"
  }'
```

Alternatively, managers can add employees directly from the **Employees** page in the Manager Portal.

---

## Run in Development

```bash
npm run dev
```

This starts both server (port 4000) and client (port 5173) concurrently.

---

## URL Guide

| URL | Description |
|-----|-------------|
| `/` | Landing page — choose Employee or Manager portal |
| `/employee/login` | Employee login (Employee Code + Password) |
| `/employee/enroll` | Face enrollment (protected) |
| `/employee/status` | My status today (protected) |
| `/employee/settings` | Privacy settings (protected) |
| `/manager/login` | Manager login (Manager Code + Password) |
| `/manager/dashboard` | Team dashboard (protected) |
| `/manager/alerts` | Alert history (protected) |
| `/manager/employees` | Employee management (protected) |

---

## Privacy Guarantees

- **No images stored** — Face-api.js runs entirely in the browser. The camera opens briefly, computes a 128-number descriptor locally, then closes.
- **No video transmitted** — Only the averaged numeric embedding is sent to the server at enrollment time.
- **AES-256 encryption** — All face embeddings are encrypted with AES-256-GCM before being stored in Supabase.
- **Employee control** — Employees can delete their enrollment at any time from Settings.
- **Minimal data** — Status logs record only: employee ID, status code (VERIFIED/AWAY/UNKNOWN_FACE/CAMERA_ERROR), and timestamp.
- **Auto-verification** — Runs silently every 5 minutes in the background. No popups or alerts shown to the employee.

---

## Architecture Notes

```
/client          React + Vite frontend
  /src
    /pages
      /auth        EmployeeLogin.jsx, ManagerLogin.jsx
      /employee    Enroll.jsx, MyStatus.jsx, Settings.jsx
      /manager     Dashboard.jsx, Alerts.jsx, Employees.jsx
    /components    EmployeeNavbar, ManagerNavbar, StatusBadge,
                   EmployeeCard, VerificationIndicator
    /hooks         useAuth.js, useAutoVerification.js
    /utils         api.js, faceapi-loader.js, distance.js
  /public/models   TinyFaceDetector model weights (gitignored)

/server          Express API
  /routes        auth.js, enrollment.js, status.js,
                 dashboard.js, manager.js
  /middleware    auth.js (JWT), roleCheck.js
  /services      encryptionService.js, alertService.js
  db.js          PostgreSQL pool (Supabase)
  store.js       Data access functions

/db/migrations   002_supabase.sql
```
