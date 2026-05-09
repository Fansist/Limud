export default function ParentLoading() {
  return (
    <div className="p-4 lg:p-6 space-y-6 animate-pulse">
      <div className="space-y-2">
        <div className="h-8 w-64 bg-gray-200 dark:bg-gray-800 rounded" />
        <div className="h-4 w-96 bg-gray-100 dark:bg-gray-800/60 rounded" />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {[0,1,2,3].map(i => (
          <div key={i} className="h-40 rounded-2xl bg-gray-100 dark:bg-gray-800/60" />
        ))}
      </div>
    </div>
  );
}
