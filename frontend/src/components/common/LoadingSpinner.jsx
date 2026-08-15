export default function LoadingSpinner({ full }) {
  return (
    <div
      role="status"
      className={full ? 'min-h-screen flex items-center justify-center' : 'flex items-center justify-center py-10'}
    >
      <div className="h-8 w-8 rounded-full border-2 border-brand-200 border-t-brand-600 animate-spin" aria-hidden="true" />
      <span className="sr-only">Loading…</span>
    </div>
  );
}
