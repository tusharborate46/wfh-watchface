/**
 * useAutoVerification.js
 * Runs silently every 5 minutes after employee logs in.
 * Requires a DOM-attached <video ref={videoRef}> to be passed in.
 * Shows VerificationIndicator during check. No alert() popups.
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import { empApi } from '../utils/api.js';
import { euclideanDistance, statusFromDistance } from '../utils/distance.js';
import { detectDescriptor } from '../utils/faceapi-loader.js';

const INTERVAL_MS = 5 * 60 * 1000; // exactly 5 minutes
const CHECK_WINDOW_MS = 6000;
const ALLOWED_STATUSES = new Set(['VERIFIED', 'AWAY', 'UNKNOWN_FACE', 'CAMERA_ERROR']);

function closeStream(stream) {
  stream?.getTracks().forEach((track) => track.stop());
}

export function useAutoVerification(employeeId, enabled, videoRef) {
  const [cameraActive, setCameraActive] = useState(false);
  const [isChecking, setIsChecking] = useState(false);
  const [lastStatus, setLastStatus] = useState(null);
  const timer = useRef(null);
  const running = useRef(false);

  const submitStatus = useCallback(async (status) => {
    const safeStatus = ALLOWED_STATUSES.has(status) ? status : 'AWAY';
    await empApi('/api/status', {
      method: 'POST',
      body: JSON.stringify({ status: safeStatus, timestamp: new Date().toISOString() })
    });
    setLastStatus(safeStatus);
    return safeStatus;
  }, []);

  const runCheck = useCallback(async () => {
    if (!enabled || !employeeId || running.current) return null;

    running.current = true;
    setIsChecking(true);
    setCameraActive(true);

    let stream;
    try {
      const { embedding } = await empApi('/api/enrollment/me');

      stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });

      const video = videoRef?.current;
      if (!video) throw new Error('Video element not available');

      video.srcObject = stream;
      video.muted = true;
      video.playsInline = true;
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
      return savedStatus;
    } catch (err) {
      console.error('[auto-verify]', err);
      if (err.message === 'No enrollment found') {
        setLastStatus('INACTIVE');
        return 'INACTIVE';
      }
      await submitStatus('CAMERA_ERROR').catch(() => {});
      return 'CAMERA_ERROR';
    } finally {
      closeStream(stream);
      if (videoRef?.current) {
        videoRef.current.srcObject = null;
      }
      setCameraActive(false);
      setIsChecking(false);
      running.current = false;
    }
  }, [employeeId, enabled, videoRef, submitStatus]);

  useEffect(() => {
    if (timer.current) clearInterval(timer.current);
    if (!enabled || !employeeId) return undefined;

    // Run once immediately on load/login
    runCheck();

    timer.current = setInterval(runCheck, INTERVAL_MS);

    return () => {
      if (timer.current) clearInterval(timer.current);
    };
  }, [employeeId, enabled, runCheck]);

  return { cameraActive, isChecking, lastStatus, runCheck };
}
