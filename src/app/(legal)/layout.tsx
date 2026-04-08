import Link from 'next/link';
import { BookOpen, ArrowLeft } from 'lucide-react';

export default function LegalLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-white">
      <nav className="border-b border-gray-100 bg-white/90 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-16">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-9 h-9 bg-gradient-to-br from-primary-500 to-primary-700 rounded-xl flex items-center justify-center shadow-lg shadow-primary-500/25">
              <BookOpen size={18} className="text-white" />
            </div>
            <span className="text-xl font-extrabold text-gray-900 tracking-tight">Limud</span>
          </Link>
          <Link href="/" className="flex items-center gap-1.5 text-sm font-medium text-gray-500 hover:text-gray-900 transition">
            <ArrowLeft size={16} />
            Back to Home
          </Link>
        </div>
      </nav>
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
        {children}
      </main>
      <footer className="border-t border-gray-100 py-8 text-center text-sm text-gray-400">
        &copy; {new Date().getFullYear()} Limud Education Inc. All rights reserved.
      </footer>
    </div>
  );
}
