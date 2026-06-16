import * as faceapi from 'face-api.js';
let modelsLoaded;
export async function loadFaceModels() {
  if (!modelsLoaded) {
    modelsLoaded = Promise.all([
      faceapi.nets.ssdMobilenetv1.loadFromUri('/models'),
      faceapi.nets.faceLandmark68Net.loadFromUri('/models'),
      faceapi.nets.faceRecognitionNet.loadFromUri('/models')
    ]);
  }
  await modelsLoaded;
  return faceapi;
}
export async function detectDescriptor(video) {
  const api = await loadFaceModels();
  const result = await api.detectSingleFace(video, new api.SsdMobilenetv1Options()).withFaceLandmarks().withFaceDescriptor();
  return result || null;
}
export function averageDescriptors(descriptors) {
  if (!Array.isArray(descriptors) || descriptors.length === 0) {
    throw new Error('At least one face descriptor is required.');
  }

  const length = descriptors[0]?.length;
  if (!length || descriptors.some((descriptor) => descriptor.length !== length)) {
    throw new Error('Face descriptors must be non-empty arrays with matching dimensions.');
  }

  return Array.from({ length }, (_, i) => descriptors.reduce((sum, descriptor) => sum + descriptor[i], 0) / descriptors.length);
}
