export default function RootLoading() {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4">
      <div className="w-12 h-12 rounded-full border-4 border-primary-200 border-t-primary-600 animate-spin" />
      <p className="text-sm text-gray-500 dark:text-gray-400">Loading…</p>
    </div>
  );
}
