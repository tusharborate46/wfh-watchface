import express from 'express';
import { auth } from '../middleware/auth.js';
import { decryptEmbedding, encryptEmbedding } from '../services/encryptionService.js';
import { deleteEnrollment, getEnrollment, saveEnrollment } from '../store.js';

const router = express.Router();
router.use(auth);

function isValidEmbedding(embedding) {
  return Array.isArray(embedding)
    && embedding.length === 128
    && embedding.every((value) => typeof value === 'number' && Number.isFinite(value));
}

// POST /api/enrollment — save face embedding
router.post('/', async (req, res, next) => {
  try {
    const embedding = req.body?.embedding;
    if (!isValidEmbedding(embedding)) {
      return res.status(400).json({ error: 'Embedding must be an array of 128 finite numbers' });
    }

    const { encrypted, iv } = encryptEmbedding(embedding);
    await saveEnrollment(req.user.employeeId, encrypted, iv);

    res.status(201).json({ ok: true });
  } catch (err) {
    next(err);
  }
});

// GET /api/enrollment/me — get own embedding (decrypted)
router.get('/me', async (req, res, next) => {
  try {
    const row = await getEnrollment(req.user.employeeId);
    if (!row) return res.status(404).json({ error: 'No enrollment found' });

    res.json({ embedding: decryptEmbedding(row.embedding_encrypted, row.iv) });
  } catch (err) {
    next(err);
  }
});

// DELETE /api/enrollment/me — delete own enrollment
router.delete('/me', async (req, res, next) => {
  try {
    await deleteEnrollment(req.user.employeeId);
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

export default router;
