import * as faceapi from 'face-api.js';

let loaded;

export async function loadFaceModels() {
  if (!loaded) {
    loaded = Promise.all([
      faceapi.nets.tinyFaceDetector.loadFromUri('/models'),
      faceapi.nets.faceLandmark68TinyNet.loadFromUri('/models'),
      faceapi.nets.faceRecognitionNet.loadFromUri('/models'),
    ]);
  }
  await loaded;
  return faceapi;
}

export async function detectDescriptor(videoEl) {
  const api = await loadFaceModels();
  const result = await api
    .detectSingleFace(videoEl, new api.TinyFaceDetectorOptions({ inputSize: 320, scoreThreshold: 0.5 }))
    .withFaceLandmarks(true)
    .withFaceDescriptor();
  return result || null;
}

export function averageDescriptors(descriptors) {
  if (!Array.isArray(descriptors) || descriptors.length === 0) {
    throw new Error('At least one face descriptor is required.');
  }
  if (descriptors.some((d) => d.length !== 128)) {
    throw new Error('Every face descriptor must contain 128 values.');
  }
  const len = descriptors[0].length;
  return Array.from({ length: len }, (_, i) =>
    descriptors.reduce((s, d) => s + d[i], 0) / descriptors.length
  );
}
