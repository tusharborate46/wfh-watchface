import * as faceapi from 'face-api.js';

let modelsLoaded;

export async function loadFaceModels() {
  if (!modelsLoaded) {
    modelsLoaded = Promise.all([
      faceapi.nets.tinyFaceDetector.loadFromUri('/models'),
      faceapi.nets.faceLandmark68TinyNet.loadFromUri('/models'),
      faceapi.nets.faceRecognitionNet.loadFromUri('/models')
    ]);
  }

  await modelsLoaded;
  return faceapi;
}

export async function detectDescriptor(video) {
  const api = await loadFaceModels();
  const result = await api
    .detectSingleFace(video, new api.TinyFaceDetectorOptions({ inputSize: 416, scoreThreshold: 0.5 }))
    .withFaceLandmarks(true)
    .withFaceDescriptor();

  return result || null;
}

export function averageDescriptors(descriptors) {
  if (!Array.isArray(descriptors) || descriptors.length === 0) {
    throw new Error('At least one face descriptor is required.');
  }

  if (descriptors.some((descriptor) => descriptor.length !== 128)) {
    throw new Error('Every face descriptor must contain 128 values.');
  }

  return Array.from({ length: 128 }, (_, i) =>
    descriptors.reduce((sum, descriptor) => sum + descriptor[i], 0) / descriptors.length
  );
}
