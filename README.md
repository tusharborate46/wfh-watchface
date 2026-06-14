# Privacy-first WFH Employee Face Verification

Full-stack React + Express + PostgreSQL application for workstation presence checks. Face detection and recognition run entirely in the browser with `face-api.js`; raw webcam frames are never uploaded or stored.

## Privacy guarantees
- Browser performs all inference using models served from `client/public/models`.
- Enrollment sends only one averaged 128-dimension embedding to the API.
- The API stores only AES-256-GCM encrypted embeddings in PostgreSQL.
- Background checks send only `{ employeeId, status, timestamp }`.
- Status can be `VERIFIED`, `AWAY`, `UNKNOWN_FACE`, or non-punitive `CAMERA_ERROR`.
- Users can delete enrollment data from `/settings`.

## Environment
Server variables:

```bash
DATABASE_URL=postgres://postgres:postgres@localhost:5432/wfh_watchface
JWT_SECRET=replace-me
EMBEDDING_ENCRYPTION_KEY=32+ bytes of secret material
CLIENT_ORIGIN=http://localhost:5173
ALERT_WEBHOOK_URL=https://example.com/webhook # optional
SMTP_HOST=smtp.example.com # optional fallback
SMTP_PORT=587
SMTP_USER=...
SMTP_PASS=...
ALERT_FROM=alerts@example.com
```

Client variables:

```bash
VITE_API_URL=http://localhost:4000
```

## Setup

```bash
npm install
npm run install:all
psql "$DATABASE_URL" -f db/migrations/001_initial.sql
npm run dev
```

Add `ssd_mobilenetv1`, `face_landmark_68`, and `face_recognition` model files under `client/public/models` before using enrollment or verification.

## Development login

Create employees in PostgreSQL, then call:

```bash
curl -X POST http://localhost:4000/api/auth/dev-login \
  -H 'Content-Type: application/json' \
  -d '{"email":"employee@example.com"}'
```

Store the returned JWT in `localStorage.token` and employee id in `localStorage.employeeId` for the demo React UI.

## API routes
- `POST /api/enrollment` stores encrypted enrollment embeddings for the authenticated employee.
- `GET /api/enrollment/me` returns the decrypted float array to the authenticated browser for local comparison.
- `DELETE /api/enrollment/me` deletes the authenticated employee's enrollment.
- `POST /api/status` records status codes and triggers alerts for `UNKNOWN_FACE`.
- `GET /api/status/:employeeId` returns today's status history with employee/manager/admin access checks.
- `GET /api/dashboard` returns manager/admin dashboard data.

## Step-by-step local run guide

### 1. Prerequisites

Install the following tools on your machine:

- Node.js 20 or newer
- npm 10 or newer
- PostgreSQL 14 or newer
- A modern browser with webcam support

### 2. Create the database

```bash
createdb wfh_watchface
export DATABASE_URL=postgres://postgres:postgres@localhost:5432/wfh_watchface
psql "$DATABASE_URL" -f db/migrations/001_initial.sql
```

If your PostgreSQL username, password, host, or port is different, update `DATABASE_URL` accordingly.

### 3. Seed demo employees

Create one manager and one employee so you can log in and view both employee and manager pages:

```bash
psql "$DATABASE_URL" <<'SQL'
insert into employees (id, name, email, role, department)
values ('00000000-0000-0000-0000-000000000010', 'Morgan Manager', 'manager@example.com', 'manager', 'Operations')
on conflict (email) do nothing;

insert into employees (id, name, email, role, department, manager_id)
values ('00000000-0000-0000-0000-000000000001', 'Erin Employee', 'employee@example.com', 'employee', 'Operations', '00000000-0000-0000-0000-000000000010')
on conflict (email) do nothing;
SQL
```

### 4. Configure the server

Create `server/.env`:

```bash
cat > server/.env <<'EOF_ENV'
DATABASE_URL=postgres://postgres:postgres@localhost:5432/wfh_watchface
JWT_SECRET=replace-with-a-long-random-secret
EMBEDDING_ENCRYPTION_KEY=replace-with-at-least-32-random-characters
CLIENT_ORIGIN=http://localhost:5173
PORT=4000
# Optional alert integrations:
# ALERT_WEBHOOK_URL=https://example.com/webhook
# SMTP_HOST=smtp.example.com
# SMTP_PORT=587
# SMTP_USER=...
# SMTP_PASS=...
# ALERT_FROM=alerts@example.com
EOF_ENV
```

### 5. Configure the client

Create `client/.env`:

```bash
cat > client/.env <<'EOF_ENV'
VITE_API_URL=http://localhost:4000
EOF_ENV
```

### 6. Install dependencies

From the repository root, run:

```bash
npm run install:all
```

If your environment blocks registry access, configure npm to use an allowed registry or install dependencies in an environment with npm registry access.

### 7. Add face-api.js model files

Download or copy these model groups into `client/public/models`:

- `ssd_mobilenetv1`
- `face_landmark_68`
- `face_recognition`

The app loads models from `/models`, so the final files must be directly available under `client/public/models` when Vite serves the client.

### 8. Start the API server

In one terminal:

```bash
npm --prefix server run dev
```

Verify the API is healthy:

```bash
curl http://localhost:4000/health
```

Expected response includes `"ok":true`.

### 9. Start the React client

In a second terminal:

```bash
npm --prefix client run dev
```

Open the Vite URL, normally `http://localhost:5173`.

### 10. Log in for development

Use the development login endpoint to get a JWT for the demo employee:

```bash
curl -X POST http://localhost:4000/api/auth/dev-login \
  -H 'Content-Type: application/json' \
  -d '{"email":"employee@example.com"}'
```

Copy the returned `token` and employee `id`, then set them in the browser console:

```js
localStorage.setItem('token', 'PASTE_TOKEN_HERE');
localStorage.setItem('employeeId', '00000000-0000-0000-0000-000000000001');
location.reload();
```

To test the manager dashboard, repeat the login request with `manager@example.com`, then store that manager token and manager id in `localStorage`.

### 11. Enroll an employee face

1. Open `http://localhost:5173/enroll`.
2. Click **Start 10-second enrollment**.
3. Allow camera access when the browser prompts you.
4. Face the camera and blink once.
5. Wait until the page says enrollment is complete.

The browser captures five descriptor samples, averages them, and sends only the averaged numeric embedding to the server. The server encrypts the embedding before storing it.

### 12. Run a verification check

After login and enrollment:

1. Click **Run privacy check** in the top navigation, or leave the app open for the randomized 8–15 minute background interval.
2. Allow camera access if prompted.
3. Blink once during the 1.5-second check window.
4. The app posts only a status event to the API.

Possible outcomes:

- `VERIFIED`: face matched the stored embedding.
- `AWAY`: no face was detected.
- `UNKNOWN_FACE`: face was detected but did not match, or liveness failed.
- `CAMERA_ERROR`: camera permission was blocked or unavailable.

### 13. View status history and dashboard

- Employee self-view: `http://localhost:5173/me`
- Manager dashboard: `http://localhost:5173/dashboard`
- Privacy settings and enrollment deletion: `http://localhost:5173/settings`

The dashboard auto-refreshes every 60 seconds.

### 14. Run checks

```bash
node --test server/index.test.js
npm --prefix client run build
```

The first command validates encryption round-tripping. The second command verifies the React production build when dependencies are installed.
