import * as faceapi from 'face-api.js';

const FACE_MATCH_THRESHOLD = 0.5;

export function euclideanDistance(a, b) {
  return faceapi.euclideanDistance(Float32Array.from(a), Float32Array.from(b));
}

export function statusFromDistance(distance) {
  return distance < FACE_MATCH_THRESHOLD ? 'VERIFIED' : 'UNKNOWN_FACE';
}
