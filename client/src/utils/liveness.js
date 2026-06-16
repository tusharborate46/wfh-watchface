function dist(a, b) {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

function ear(eye) {
  const horizontal = dist(eye[0], eye[3]);
  if (!horizontal) return 0;
  return (dist(eye[1], eye[5]) + dist(eye[2], eye[4])) / (2 * horizontal);
}

export function eyeAspectRatio(landmarks) {
  return (ear(landmarks.getLeftEye()) + ear(landmarks.getRightEye())) / 2;
}

export function createBlinkTracker(threshold = 0.21) {
  let openSeen = false;
  let closedSeen = false;
  let blinkConfirmed = false;

  return (landmarks) => {
    if (!landmarks || blinkConfirmed) return blinkConfirmed;

    const value = eyeAspectRatio(landmarks);
    if (value > threshold + 0.04) openSeen = true;
    if (openSeen && value < threshold) closedSeen = true;
    if (closedSeen && value > threshold + 0.03) blinkConfirmed = true;

    return blinkConfirmed;
  };
}
