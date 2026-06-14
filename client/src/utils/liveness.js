function dist(a,b){return Math.hypot(a.x-b.x,a.y-b.y)}
function ear(eye){return (dist(eye[1],eye[5])+dist(eye[2],eye[4]))/(2*dist(eye[0],eye[3]))}
export function eyeAspectRatio(landmarks){return (ear(landmarks.getLeftEye())+ear(landmarks.getRightEye()))/2}
export function createBlinkTracker(threshold=0.21){let openSeen=false,closedSeen=false;return (landmarks)=>{const value=eyeAspectRatio(landmarks);if(value>threshold+0.04)openSeen=true;if(openSeen&&value<threshold)closedSeen=true;return closedSeen&&value>threshold+0.03}}
