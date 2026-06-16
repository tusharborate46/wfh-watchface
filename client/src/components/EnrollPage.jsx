import { useRef, useState } from 'react';
import { api } from '../utils/api';
import { averageDescriptors, detectDescriptor } from '../utils/faceapi-loader';
import { createBlinkTracker } from '../utils/liveness';

function stop(stream) {
  stream?.getTracks().forEach((track) => track.stop());
}

export default function EnrollPage() {
  const videoRef = useRef(null);
  const [active, setActive] = useState(false);
  const [msg, setMsg] = useState('Enrollment stores only an encrypted 128-dimension face embedding. No photos or video are saved.');

  async function enroll() {
    let stream;
    try {
      setMsg('Camera active. Please blink once and face the camera for 10 seconds.');
      stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
      setActive(true);

      const video = videoRef.current;
      video.srcObject = stream;
      video.muted = true;
      video.playsInline = true;
      await video.play();

      const samples = [];
      const blinked = createBlinkTracker();
      let live = false;
      const end = Date.now() + 10000;

      while (Date.now() < end) {
        const detection = await detectDescriptor(video);
        if (detection) {
          live = blinked(detection.landmarks) || live;
          samples.push(Array.from(detection.descriptor));
        }
        await new Promise((resolve) => setTimeout(resolve, 500));
      }

      if (!live) throw new Error('Blink liveness check was not confirmed. Please retry and blink once.');
      if (samples.length < 3) throw new Error('Not enough face samples captured.');

      await api('/api/enrollment', { method: 'POST', body: JSON.stringify({ embedding: averageDescriptors(samples) }) });
      setMsg('Enrollment complete. Camera closed.');
    } catch (err) {
      console.error(err);
      setMsg(err.message || 'Enrollment failed.');
    } finally {
      stop(stream);
      if (videoRef.current) videoRef.current.srcObject = null;
      setActive(false);
    }
  }

  return (
    <main className="mx-auto max-w-2xl p-8">
      <div className="card">
        <div className="flex items-center gap-3">
          <h1 className="text-3xl font-black">Employee enrollment</h1>
          {active && <span className="h-4 w-4 animate-pulse rounded-full bg-red-500" title="camera active" />}
        </div>
        <p className="my-4 text-slate-300">{msg}</p>
        <video ref={videoRef} className={`mb-4 aspect-video w-full rounded-xl bg-slate-950 ${active ? 'block' : 'hidden'}`} autoPlay muted playsInline />
        <button className="btn" disabled={active} onClick={enroll} type="button">Start 10-second enrollment</button>
      </div>
    </main>
  );
}
