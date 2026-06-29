import { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { empApi } from '../../utils/api.js';
import { averageDescriptors, detectDescriptor } from '../../utils/faceapi-loader.js';

const ENROLLMENT_SECONDS = 10;
const REQUIRED_SAMPLES = 5;

function stopStream(stream) {
  stream?.getTracks().forEach((track) => track.stop());
}

export default function Enroll({ runCheck }) {
  const videoRef = useRef(null);
  const [active, setActive] = useState(false);
  const [sampleCount, setSampleCount] = useState(0);
  const [msg, setMsg] = useState(
    'Enrollment stores only an encrypted 128-number face embedding. No photos or video are saved.'
  );
  const [success, setSuccess] = useState(false);
  const navigate = useNavigate();

  async function enroll() {
    let stream;
    setActive(true);
    setSampleCount(0);
    setSuccess(false);

    try {
      setMsg('Activating camera. Please face the camera...');
      stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });

      const video = videoRef.current;
      video.srcObject = stream;
      video.muted = true;
      video.playsInline = true;
      await video.play();

      setMsg('Camera active. Capturing face samples locally...');

      const samples = [];
      const end = Date.now() + ENROLLMENT_SECONDS * 1000;

      while (Date.now() < end) {
        const detection = await detectDescriptor(video);
        if (detection) {
          samples.push(Array.from(detection.descriptor));
          setSampleCount(samples.length);
          setMsg(`Capturing sample ${samples.length} of ${REQUIRED_SAMPLES}...`);
          if (samples.length >= REQUIRED_SAMPLES) break;
        }
        await new Promise((resolve) => setTimeout(resolve, 600));
      }

      if (samples.length < REQUIRED_SAMPLES) {
        throw new Error(
          `Only ${samples.length} samples captured. Make sure your face is well-lit and visible.`
        );
      }

      setMsg('Encrypting and uploading embedding...');
      await empApi('/api/enrollment', {
        method: 'POST',
        body: JSON.stringify({ embedding: averageDescriptors(samples) })
      });

      stopStream(stream);
      if (videoRef.current) videoRef.current.srcObject = null;
      setActive(false);
      setSuccess(true);
      setMsg('Enrolled successfully! Redirecting to your status...');

      if (runCheck) {
        runCheck().catch((err) => console.error('Initial check failed', err));
      }

      setTimeout(() => navigate('/employee/status', { replace: true }), 2000);
    } catch (err) {
      console.error('[enrollment]', err);
      setMsg(err.message || 'Enrollment failed. Please try again.');
      stopStream(stream);
      if (videoRef.current) videoRef.current.srcObject = null;
      setActive(false);
    }
  }

  return (
    <main className="page-shell narrow">
      <section className="card">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Local enrollment</p>
            <h1>Face Enrollment</h1>
          </div>
          {active && (
            <span className="camera-indicator">
              <span />
              Camera active
            </span>
          )}
        </div>

        <p className={`muted ${success ? 'text-emerald-300' : ''}`}>{msg}</p>

        {/* Always in DOM — required for face-api.js detection */}
        <video
          ref={videoRef}
          className={`camera-preview ${active ? 'is-active' : ''}`}
          autoPlay
          muted
          playsInline
          style={{ display: active ? 'block' : 'none' }}
        />

        <div className="action-row mt-5">
          <button className="btn" disabled={active || success} onClick={enroll} type="button">
            {active ? 'Enrolling...' : 'Start Enrollment'}
          </button>

          {active && (
            <div className="flex items-center gap-3">
              <div className="h-2 flex-1 overflow-hidden rounded-full bg-zinc-800 max-w-40">
                <div
                  className="h-2 rounded-full bg-emerald-400 transition-all duration-300"
                  style={{ width: `${(sampleCount / REQUIRED_SAMPLES) * 100}%` }}
                />
              </div>
              <span className="muted small">
                {sampleCount} / {REQUIRED_SAMPLES} samples
              </span>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
