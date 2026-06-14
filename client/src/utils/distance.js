import * as faceapi from 'face-api.js';
export function euclideanDistance(a, b) { return faceapi.euclideanDistance(Float32Array.from(a), Float32Array.from(b)); }
export function statusFromDistance(distance) { return distance < 0.5 ? 'VERIFIED' : 'UNKNOWN_FACE'; }
