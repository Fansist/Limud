import Link from 'next/link';

type Member = {
  name: string;
  role: string;
  /** Two-letter initials shown inside the avatar circle. */
  initials: string;
  /** Tailwind gradient classes used for the avatar background. */
  gradient: string;
};

// To replace an initials avatar with a real photo, drop a JPEG into
// `public/team/<firstname-lastname>.jpg` (e.g. public/team/tamar-burgado.jpg)
// and add `photo: '/team/tamar-burgado.jpg'` to the matching entry below.
const TEAM: Member[] = [
  {
    name: 'Tamar Burgado',
    role: 'CEO',
    initials: 'TB',
    gradient: 'from-rose-400 to-pink-500',
  },
  {
    name: 'Noam Shani',
    role: 'CRO',
    initials: 'NS',
    gradient: 'from-amber-400 to-orange-500',
  },
  {
    name: 'Lior Betzalel',
    role: 'CPO',
    initials: 'LB',
    gradient: 'from-emerald-400 to-teal-500',
  },
  {
    name: 'Erez Ofer',
    role: 'CMO / CTO',
    initials: 'EO',
    gradient: 'from-blue-400 to-indigo-500',
  },
  {
    name: 'Eytan Balan',
    role: 'COO',
    initials: 'EB',
    gradient: 'from-violet-400 to-purple-500',
  },
  {
    name: 'Noam Elgarisi',
    role: 'R&D',
    initials: 'NE',
    gradient: 'from-sky-400 to-cyan-500',
  },
];

export const metadata = {
  title: 'Our Team',
  description: 'The people building Limud.',
};

export default function TeamPage() {
  return (
    <article className="max-w-none">
      <h1 className="text-3xl font-extrabold text-gray-900 mb-2">Our Team</h1>
      <p className="text-lg text-gray-500 mb-10">
        The people building Limud — one product, six minds, every learner in mind.
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 mb-12">
        {TEAM.map((m) => (
          <div
            key={m.name}
            className="flex flex-col items-center text-center p-6 rounded-2xl border border-gray-100 hover:shadow-md hover:-translate-y-0.5 transition bg-white"
          >
            <div
              className={`w-24 h-24 rounded-full bg-gradient-to-br ${m.gradient} flex items-center justify-center text-white text-2xl font-bold tracking-wide shadow-md mb-4`}
              aria-hidden="true"
            >
              {m.initials}
            </div>
            <h2 className="text-base font-bold text-gray-900">{m.name}</h2>
            <p className="text-sm text-gray-500 mt-1">{m.role}</p>
          </div>
        ))}
      </div>

      <div className="rounded-2xl border border-gray-100 bg-gray-50 p-6 text-center">
        <p className="text-sm text-gray-700">
          Want to reach the team?
        </p>
        <Link
          href="/contact"
          className="inline-block mt-3 px-5 py-2.5 rounded-xl bg-primary-600 hover:bg-primary-700 text-white text-sm font-medium transition"
        >
          Contact us
        </Link>
      </div>
    </article>
  );
}
