import crypto from 'crypto';

function encryptionKey() {
  return crypto
    .createHash('sha256')
    .update(process.env.EMBEDDING_ENCRYPTION_KEY || 'dev-only-change-me')
    .digest();
}

function validateEmbedding(embedding) {
  return Array.isArray(embedding)
    && embedding.length === 128
    && embedding.every((value) => typeof value === 'number' && Number.isFinite(value));
}

export function encryptEmbedding(embedding) {
  if (!validateEmbedding(embedding)) {
    throw new Error('Embedding must be an array of 128 finite numbers');
  }

  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv('aes-256-gcm', encryptionKey(), iv);
  const encrypted = Buffer.concat([
    cipher.update(JSON.stringify(embedding), 'utf8'),
    cipher.final()
  ]);

  return {
    encrypted: Buffer.concat([cipher.getAuthTag(), encrypted]),
    iv: iv.toString('base64')
  };
}

export function decryptEmbedding(buffer, ivText) {
  const payload = Buffer.from(buffer);
  const tag = payload.subarray(0, 16);
  const encrypted = payload.subarray(16);
  const decipher = crypto.createDecipheriv('aes-256-gcm', encryptionKey(), Buffer.from(ivText, 'base64'));

  decipher.setAuthTag(tag);
  const embedding = JSON.parse(Buffer.concat([
    decipher.update(encrypted),
    decipher.final()
  ]).toString('utf8'));

  if (!validateEmbedding(embedding)) {
    throw new Error('Stored embedding is invalid');
  }

  return embedding;
}
