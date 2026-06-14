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
  const length = descriptors[0]?.length || 128;
  return Array.from({ length }, (_, i) => descriptors.reduce((sum, d) => sum + d[i], 0) / descriptors.length);
}
