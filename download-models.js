import https from 'https';
import fs from 'fs';
import path from 'path';

const files = [
  ['ssd_mobilenetv1_model-shard1', 'https://unpkg.com/face-api.js@0.22.2/weights/ssd_mobilenetv1_model-shard1'],
  ['ssd_mobilenetv1_model-shard2', 'https://unpkg.com/face-api.js@0.22.2/weights/ssd_mobilenetv1_model-shard2'],
  ['face_landmark_68_model-shard1', 'https://unpkg.com/face-api.js@0.22.2/weights/face_landmark_68_model-shard1'],
  ['face_recognition_model-shard1', 'https://unpkg.com/face-api.js@0.22.2/weights/face_recognition_model-shard1'],
  ['face_recognition_model-shard2', 'https://unpkg.com/face-api.js@0.22.2/weights/face_recognition_model-shard2'],
];

const dest = './client/public/models/';

function download(filename, url) {
  return new Promise((resolve, reject) => {
    const out = fs.createWriteStream(path.join(dest, filename));
    const get = (u) => https.get(u, res => {
      if (res.statusCode === 301 || res.statusCode === 302) {
        get(res.headers.location);
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

for (const [filename, url] of files) {
  await download(filename, url);
}
console.log('All done!');