/**
 * OWNER finances loading skeleton.
 *
 * v17.3: the finances page fans out 7 parallel Prisma queries and can take
 * a couple seconds on a populated DB. Without this file the OWNER stares at
 * the previous route until the RSC stream lands — feels broken. Mirrors
 * the spinner pattern from `src/app/loading.tsx`.
 */
export default function OwnerFinancesLoading() {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4">
      <div className="w-12 h-12 rounded-full border-4 border-primary-200 border-t-primary-600 animate-spin" />
      <p className="text-sm text-gray-500 dark:text-gray-400">
        Crunching the latest revenue figures…
      </p>
    </div>
  );
}
