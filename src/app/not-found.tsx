import Link from 'next/link';
import { HelpCircle } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 px-4">
      <div className="text-center max-w-md">
        <img src="/logo.svg" alt="Limud" className="w-16 h-16 mx-auto mb-6 opacity-90" />
        <h1 className="text-4xl font-bold text-gray-900 dark:text-white">404</h1>
        <p className="text-lg text-gray-600 dark:text-gray-300 mt-2">We can't find that page.</p>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">It may have moved or never existed. Try heading back home.</p>
        <div className="flex gap-3 justify-center mt-8">
          <Link href="/" className="px-5 py-2.5 rounded-lg bg-primary-600 hover:bg-primary-700 text-white font-medium">Go home</Link>
          <Link href="/help" className="px-5 py-2.5 rounded-lg border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-200 font-medium hover:bg-gray-100 dark:hover:bg-gray-800 inline-flex items-center gap-2"><HelpCircle size={16}/>Help</Link>
        </div>
      </div>
    </div>
  );
}
