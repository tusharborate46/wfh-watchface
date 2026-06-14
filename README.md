# Privacy-first WFH Employee Face Verification

Full-stack React + Express + MySQL application for workstation presence checks. Face detection and recognition run entirely in the browser with `face-api.js`; raw webcam frames are never uploaded or stored.

## Privacy guarantees
- Browser performs all inference using models served from `client/public/models`.
- Enrollment sends only one averaged 128-dimension embedding to the API.
- The API stores only AES-256-GCM encrypted embeddings in MySQL.
- Background checks send only `{ employeeId, status, timestamp }`.
- Status can be `VERIFIED`, `AWAY`, `UNKNOWN_FACE`, or non-punitive `CAMERA_ERROR`.
- Users can delete enrollment data from `/settings`.

## Environment
Server variables:

```bash
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_mysql_root_password
DB_NAME=wfh_watchface
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
node db/setup.js
npm run dev
```

Add `ssd_mobilenetv1`, `face_landmark_68`, and `face_recognition` model files under `client/public/models` before using enrollment or verification.

## Development login

Create employees in MySQL, then call:

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
