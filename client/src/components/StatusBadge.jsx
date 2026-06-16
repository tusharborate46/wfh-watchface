const styles = {
  VERIFIED: 'bg-green-500/20 text-green-300',
  AWAY: 'bg-yellow-500/20 text-yellow-300',
  UNKNOWN_FACE: 'bg-red-500/20 text-red-300',
  CAMERA_ERROR: 'bg-orange-500/20 text-orange-300',
  INACTIVE: 'bg-slate-500/20 text-slate-300'
};

export default function StatusBadge({ status = 'INACTIVE' }) {
  return (
    <span className={`rounded-full px-3 py-1 text-sm font-semibold ${styles[status] || styles.INACTIVE}`}>
      {status.replaceAll('_', ' ')}
    </span>
  );
}
