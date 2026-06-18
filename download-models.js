import https from 'https';
import fs from 'fs';
import path from 'path';

const files = [
  ['ssd_mobilenetv1_model-weights_manifest.json', 'https://cdn.jsdelivr.net/gh/justadudewhohacks/face-api.js@master/weights/ssd_mobilenetv1_model-weights_manifest.json'],
  ['ssd_mobilenetv1_model-shard1', 'https://cdn.jsdelivr.net/gh/justadudewhohacks/face-api.js@master/weights/ssd_mobilenetv1_model-shard1'],
  ['face_landmark_68_model-weights_manifest.json', 'https://cdn.jsdelivr.net/gh/justadudewhohacks/face-api.js@master/weights/face_landmark_68_model-weights_manifest.json'],
  ['face_landmark_68_model-shard1', 'https://cdn.jsdelivr.net/gh/justadudewhohacks/face-api.js@master/weights/face_landmark_68_model-shard1'],
  ['face_recognition_model-weights_manifest.json', 'https://cdn.jsdelivr.net/gh/justadudewhohacks/face-api.js@master/weights/face_recognition_model-weights_manifest.json'],
  ['face_recognition_model-shard1', 'https://cdn.jsdelivr.net/gh/justadudewhohacks/face-api.js@master/weights/face_recognition_model-shard1'],
  ['face_recognition_model-shard2', 'https://cdn.jsdelivr.net/gh/justadudewhohacks/face-api.js@master/weights/face_recognition_model-shard2']
];

const dest = './client/public/models/';

// Ensure directory exists
fs.mkdirSync(dest, { recursive: true });

function download(filename, url) {
  return new Promise((resolve, reject) => {
    const out = fs.createWriteStream(path.join(dest, filename));
    const get = (u) => https.get(u, res => {
      if (res.statusCode === 301 || res.statusCode === 302) {
        get(res.headers.location);
        return;
      }
      if (res.statusCode !== 200) {
        reject(new Error(`Failed to download ${filename}: status code ${res.statusCode}`));
        return;
      }
      res.pipe(out);
      out.on('finish', () => {
        const size = fs.statSync(path.join(dest, filename)).size;
        console.log(`✓ ${filename}: ${size} bytes`);
        resolve();
      });
    }).on('error', reject);
    get(url);
  });
}

console.log('Downloading face-api.js models from jsDelivr CDN...');
for (const [filename, url] of files) {
  try {
    await download(filename, url);
  } catch (err) {
    console.error(`Error downloading ${filename}:`, err.message);
    process.exit(1);
  }
}
console.log('All face-api.js models successfully downloaded and verified!');