import { useCallback, useEffect, useRef, useState } from 'react';
import { api } from '../utils/api';
import { detectDescriptor } from '../utils/faceapi-loader';
import { euclideanDistance, statusFromDistance } from '../utils/distance';
import { createBlinkTracker } from '../utils/liveness';
const STATUSES = ['VERIFIED','AWAY','UNKNOWN_FACE','CAMERA_ERROR'];
function nextDelay(){ return (8*60 + Math.random()*7*60) * 1000; }
async function openCamera(){ return navigator.mediaDevices.getUserMedia({ video: true, audio: false }); }
function closeStream(stream){ stream?.getTracks().forEach(t=>t.stop()); }
export function useFaceVerification(employeeId, enabled=true){
 const [cameraActive,setCameraActive]=useState(false); const [lastStatus,setLastStatus]=useState(null); const timer=useRef();
 const runCheck=useCallback(async()=>{
  let stream;
  try{
   alert('Privacy notice: camera will activate for 4 seconds. Please blink once for liveness. No images leave this device.');
   stream=await openCamera(); setCameraActive(true);
   const video=document.createElement('video'); video.muted=true; video.srcObject=stream; await video.play();
   const blinked=createBlinkTracker();
   let detection=null; let live=false; const end=Date.now()+4000;
   while(Date.now()<end){ const current=await detectDescriptor(video); if(current){ detection=current; live=blinked(current.landmarks)||live; } await new Promise(r=>setTimeout(r,200)); }
   let status='AWAY';
   if(detection){
    if(!live){ status='AWAY'; }
    else { const { embedding }=await api('/api/enrollment/me'); const distance=euclideanDistance(Array.from(detection.descriptor), embedding); status=statusFromDistance(distance); }
   }
   if(!STATUSES.includes(status)) status='AWAY';
   await api('/api/status',{method:'POST',body:JSON.stringify({ employeeId, status, timestamp:new Date().toISOString() })}); setLastStatus(status);
  }catch(e){ await api('/api/status',{method:'POST',body:JSON.stringify({ employeeId, status:'CAMERA_ERROR', timestamp:new Date().toISOString() })}).catch(()=>{}); setLastStatus('CAMERA_ERROR'); }
  finally{ closeStream(stream); setCameraActive(false); }
 },[employeeId]);
 useEffect(()=>{ if(!enabled||!employeeId)return; const schedule=()=>{timer.current=setTimeout(async()=>{await runCheck(); schedule();}, nextDelay())}; schedule(); return()=>clearTimeout(timer.current);},[enabled,employeeId,runCheck]);
 return { cameraActive, lastStatus, runCheck };
}
