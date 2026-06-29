/**
 * VerificationIndicator — fixed bottom-right floating indicator.
 * Shows a pulsing red dot + "Verifying identity..." when camera is active.
 * z-index 9999 so it floats above all content.
 */
export default function VerificationIndicator({ active }) {
  if (!active) return null;

  return (
    <div
      style={{ zIndex: 9999 }}
      className="fixed bottom-6 right-6 flex items-center gap-2.5 rounded-full border border-red-500/40 bg-zinc-900/95 px-4 py-2.5 shadow-2xl backdrop-blur-sm"
    >
      <span className="relative flex h-3 w-3">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75" />
        <span className="relative inline-flex h-3 w-3 rounded-full bg-red-500" />
      </span>
      <span className="text-sm font-semibold text-red-200">Verifying identity...</span>
    </div>
  );
}
