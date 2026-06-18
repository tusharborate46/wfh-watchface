import 'dotenv/config';
import cors from 'cors';
import express from 'express';
import authRoutes from './routes/auth.js';
import dashboardRoutes from './routes/dashboard.js';
import enrollmentRoutes from './routes/enrollment.js';
import statusRoutes from './routes/status.js';

const app = express();

app.use(cors({ origin: process.env.CLIENT_ORIGIN || 'http://localhost:5173' }));
app.use(express.json({ limit: '1mb' }));

app.get('/health', (req, res) => {
  res.json({ ok: true, privacy: 'no images accepted' });
});

app.use('/api/auth', authRoutes);
app.use('/api/enrollment', enrollmentRoutes);
app.use('/api/status', statusRoutes);
app.use('/api/dashboard', dashboardRoutes);

app.use((req, res) => {
  res.status(404).json({ error: 'Not found' });
});

// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  console.error('[API Error]', err);
  res.status(err.status || 500).json({ error: err.message || 'Internal server error' });
});

export default app;
