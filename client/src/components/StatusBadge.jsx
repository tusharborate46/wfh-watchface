const STATUS_META = {
  VERIFIED: {
    label: '✅ VERIFIED',
    className: 'status-badge status-verified'
  },
  AWAY: {
    label: '🟡 AWAY / ON BREAK',
    className: 'status-badge status-away'
  },
  UNKNOWN_FACE: {
    label: '🔴 UNKNOWN FACE',
    className: 'status-badge status-unknown'
  },
  CAMERA_ERROR: {
    label: 'CAMERA ERROR',
    className: 'status-badge status-error'
  },
  INACTIVE: {
    label: '⚫ INACTIVE',
    className: 'status-badge status-inactive'
  }
};

export default function StatusBadge({ status = 'INACTIVE' }) {
  const meta = STATUS_META[status] || STATUS_META.INACTIVE;
  return <span className={meta.className}>{meta.label}</span>;
}
