# WFH WatchFace

Privacy-first Work From Home employee monitoring system using local face recognition.

## What It Does

- Runs face detection and face recognition in the employee browser with `face-api.js`.
- Stores only an encrypted 128-number face embedding.
- Never uploads or stores webcam images or video.
- Sends only status updates to the API: `VERIFIED`, `AWAY`, `UNKNOWN_FACE`, or `CAMERA_ERROR`.
- Shows manager dashboard status in near real time.
- Creates manager alerts when `UNKNOWN_FACE` is reported.
- Lets employees delete their enrollment data at any time.
- Shows a visible camera indicator whenever the app activates the camera.

## Status Meaning

| Status | Meaning |
| --- | --- |
| `VERIFIED` | Correct enrolled employee is present |
| `AWAY` | No face was detected |
| `UNKNOWN_FACE` | A different face was detected and an alert was created |
| `INACTIVE` | No check has been run today |
| `CAMERA_ERROR` | Camera permission/device failed |

## Run Commands

From this folder:

```powershell
npm install
npm run install:all
npm run dev
```

Open:

```text
http://localhost:5173
```

API health check:

```text
http://localhost:4000/health
```

## Demo Users

The local JSON store seeds these accounts automatically:

```text
employee@example.com
manager@example.com
admin@example.com
```

Use `employee@example.com` to enroll and run privacy checks. Use `manager@example.com` to view the team dashboard.

## Tests

```powershell
npm run test:all
```

This runs the server API/encryption tests and a production client build.

## Local Storage

No MySQL setup is required. The server writes local demo data to:

```text
server/data/wfh-watchface.json
```

That file is ignored by git. It contains seeded employees, encrypted embeddings, status logs, and alert metadata. It does not contain images or video.

Optional environment variables:

```text
PORT=4000
CLIENT_ORIGIN=http://localhost:5173
JWT_SECRET=replace-me
EMBEDDING_ENCRYPTION_KEY=32+ bytes of secret material
FILE_DB_PATH=E:\path\to\custom-store.json
ALERT_WEBHOOK_URL=https://example.com/webhook
```

## Face API Models

The required model files are already in `client/public/models`. If they are missing after a clean checkout, run:

```powershell
npm run download-models
```

## Notes

- Browser camera access generally works on `localhost` without HTTPS.
- The automated tests use synthetic numeric embeddings. Real camera enrollment must be tested manually with the employee account because it requires your device camera.
- This is a development demo auth flow. Replace `/api/auth/dev-login` with real organization authentication before production use.
