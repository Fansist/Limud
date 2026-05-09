import Link from 'next/link';

type Member = {
  name: string;
  role: string;
  /** Path under /public. */
  photo: string;
  /** Tailwind gradient classes used for the photo's ring. */
  ring: string;
};

const TEAM: Member[] = [
  {
    name: 'Tamar Burgado',
    role: 'CEO',
    photo: '/team/tamar-burgado.jpg',
    ring: 'from-rose-400 to-pink-500',
  },
  {
    name: 'Noam Shani',
    role: 'CRO',
    photo: '/team/noam-shani.jpg',
    ring: 'from-amber-400 to-orange-500',
  },
  {
    name: 'Lior Betzalel',
    role: 'CPO',
    photo: '/team/lior-betzalel.jpg',
    ring: 'from-emerald-400 to-teal-500',
  },
  {
    name: 'Erez Ofer',
    role: 'CMO / CTO',
    photo: '/team/erez-ofer.jpg',
    ring: 'from-blue-400 to-indigo-500',
  },
  {
    name: 'Eytan Balan',
    role: 'COO',
    photo: '/team/eytan-balan.jpg',
    ring: 'from-violet-400 to-purple-500',
  },
  {
    name: 'Noam Elgarisi',
    role: 'R&D',
    photo: '/team/noam-elgarisi.jpg',
    ring: 'from-sky-400 to-cyan-500',
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
              className={`p-1 rounded-full bg-gradient-to-br ${m.ring} shadow-md mb-4`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={m.photo}
                alt={`${m.name}, ${m.role}`}
                className="w-28 h-28 rounded-full object-cover ring-2 ring-white"
                loading="lazy"
              />
            </div>
            <h2 className="text-base font-bold text-gray-900">{m.name}</h2>
            <p className="text-sm text-gray-500 mt-1">{m.role}</p>
          </div>
        ))}
      </div>

      <div className="rounded-2xl border border-gray-100 bg-gray-50 p-6 text-center">
        <p className="text-sm text-gray-700">Want to reach the team?</p>
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
