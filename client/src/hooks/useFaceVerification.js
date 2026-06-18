import { useCallback, useEffect, useRef, useState } from 'react';
import { api } from '../utils/api.js';
import { euclideanDistance, statusFromDistance } from '../utils/distance.js';
import { detectDescriptor } from '../utils/faceapi-loader.js';

const STATUSES = new Set(['VERIFIED', 'AWAY', 'UNKNOWN_FACE', 'CAMERA_ERROR']);
const CHECK_WINDOW_MS = 5000;

function nextDelay() {
  const minMinutes = Number(import.meta.env.VITE_CHECK_INTERVAL_MIN || 8);
  const maxMinutes = Number(import.meta.env.VITE_CHECK_INTERVAL_MAX || 15);
  const min = Math.max(1, Math.min(minMinutes, maxMinutes));
  const max = Math.max(min, maxMinutes);

  return (min * 60 + Math.random() * (max - min) * 60) * 1000;
}

async function openCamera() {
  if (!navigator.mediaDevices?.getUserMedia) {
    throw new Error('Camera access is not available in this browser.');
  }

  return navigator.mediaDevices.getUserMedia({ video: true, audio: false });
}

function closeStream(stream) {
  stream?.getTracks().forEach((track) => track.stop());
}

export function useFaceVerification(employeeId, enabled = true) {
  const [cameraActive, setCameraActive] = useState(false);
  const [isChecking, setIsChecking] = useState(false);
  const [lastStatus, setLastStatus] = useState(null);
  const [message, setMessage] = useState('');
  const timer = useRef();
  const running = useRef(false);

  const submitStatus = useCallback(async (status) => {
    const safeStatus = STATUSES.has(status) ? status : 'AWAY';
    await api('/api/status', {
      method: 'POST',
      body: JSON.stringify({
        status: safeStatus,
        timestamp: new Date().toISOString()
      })
    });
    setLastStatus(safeStatus);
    return safeStatus;
  }, []);

  const runCheck = useCallback(async () => {
    if (!enabled || !employeeId || running.current) return null;

    running.current = true;
    setIsChecking(true);
    setMessage('Camera will activate briefly for a local face check. No image or video will be sent.');

    let stream;
    try {
      const { embedding } = await api('/api/enrollment/me');

      stream = await openCamera();
      setCameraActive(true);
      setMessage('Camera active. Face verification is running locally on this device.');

      const video = document.createElement('video');
      video.muted = true;
      video.playsInline = true;
      video.srcObject = stream;
      await video.play();

      let detection = null;
      const end = Date.now() + CHECK_WINDOW_MS;

      while (Date.now() < end && !detection) {
        detection = await detectDescriptor(video);
        await new Promise((resolve) => setTimeout(resolve, 250));
      }

      let status = 'AWAY';
      if (detection) {
        const distance = euclideanDistance(Array.from(detection.descriptor), embedding);
        status = statusFromDistance(distance);
      }

      const savedStatus = await submitStatus(status);
      setMessage(savedStatus === 'UNKNOWN_FACE'
        ? 'Unknown face detected. The manager dashboard has been updated.'
        : `Check complete: ${savedStatus.replaceAll('_', ' ')}.`
      );

      return savedStatus;
    } catch (err) {
      console.error('[face-check]', err);

      if (err.message === 'No enrollment found') {
        setLastStatus('INACTIVE');
        setMessage('Enrollment is required before privacy checks can run.');
        return 'INACTIVE';
      }

      await submitStatus('CAMERA_ERROR').catch(() => {});
      setMessage(err.message || 'Camera check failed.');
      return 'CAMERA_ERROR';
    } finally {
      closeStream(stream);
      setCameraActive(false);
      setIsChecking(false);
      running.current = false;
    }
  }, [employeeId, enabled, submitStatus]);

  useEffect(() => {
    clearTimeout(timer.current);
    if (!enabled || !employeeId) return undefined;

    const schedule = () => {
      timer.current = setTimeout(async () => {
        await runCheck();
        schedule();
      }, nextDelay());
    };

    schedule();
    return () => clearTimeout(timer.current);
  }, [employeeId, enabled, runCheck]);

  return { cameraActive, isChecking, lastStatus, message, runCheck };
}
