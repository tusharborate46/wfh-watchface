import { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../utils/api.js';
import { averageDescriptors, detectDescriptor } from '../utils/faceapi-loader.js';

const ENROLLMENT_SECONDS = 8;
const REQUIRED_SAMPLES = 3;

function stop(stream) {
  stream?.getTracks().forEach((track) => track.stop());
}

export default function EnrollPage({ runCheck }) {
  const videoRef = useRef(null);
  const [active, setActive] = useState(false);
  const [sampleCount, setSampleCount] = useState(0);
  const [msg, setMsg] = useState('Enrollment stores only an encrypted 128-number face embedding. No photos or video are saved.');
  const navigate = useNavigate();

  async function enroll() {
    let stream;
    setActive(true);
    setSampleCount(0);

    try {
      setMsg('Camera active. Face the camera while samples are captured locally.');
      stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });

      const video = videoRef.current;
      video.srcObject = stream;
      video.muted = true;
      video.playsInline = true;
      await video.play();

      const samples = [];
      const end = Date.now() + ENROLLMENT_SECONDS * 1000;

      while (Date.now() < end) {
        const detection = await detectDescriptor(video);
        if (detection) {
          samples.push(Array.from(detection.descriptor));
          setSampleCount(samples.length);
          setMsg(`Face detected. Captured ${samples.length} local samples.`);
        }
        await new Promise((resolve) => setTimeout(resolve, 600));
      }

      if (samples.length < REQUIRED_SAMPLES) {
        throw new Error(`Only ${samples.length} samples were captured. Make sure your face is visible and try again.`);
      }

      await api('/api/enrollment', {
        method: 'POST',
        body: JSON.stringify({ embedding: averageDescriptors(samples) })
      });

      setMsg('Enrollment complete. Running one verification check now.');
      stop(stream);
      if (videoRef.current) videoRef.current.srcObject = null;
      setActive(false);

      if (runCheck) await runCheck();
      navigate('/me');
    } catch (err) {
      console.error('[enrollment]', err);
      setMsg(err.message || 'Enrollment failed.');
      stop(stream);
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
            <h1>Employee face enrollment</h1>
          </div>
          {active && (
            <span className="camera-indicator">
              <span />
              Camera active
            </span>
          )}
        </div>

        <p className="muted">{msg}</p>

        <video
          ref={videoRef}
          className={`camera-preview ${active ? 'is-active' : ''}`}
          autoPlay
          muted
          playsInline
        />

        <div className="action-row">
          <button className="btn" disabled={active} onClick={enroll} type="button">
            {active ? 'Enrolling...' : 'Start enrollment'}
          </button>
          <span className="muted small">Samples: {sampleCount}/{REQUIRED_SAMPLES}</span>
        </div>
      </section>
    </main>
  );
}
