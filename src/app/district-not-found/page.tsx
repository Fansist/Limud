export default function DistrictNotFoundPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 text-center bg-gray-50 dark:bg-gray-900">
      <img src="/logo.svg" alt="Limud" className="w-16 h-16 mb-6" />
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
        This isn&apos;t a Limud district workspace
      </h1>
      <p className="mt-3 max-w-md text-gray-500 dark:text-gray-400">
        The address you used doesn&apos;t match any school district on Limud yet.
        If you&apos;re looking for the main site, head to limud.co.
      </p>
      <a
        href="https://limud.co"
        className="mt-6 inline-flex items-center px-5 py-3 rounded-xl bg-primary-600 hover:bg-primary-700 text-white font-medium transition shadow-sm hover:shadow-md"
      >
        Go to limud.co
      </a>
    </div>
  );
}
