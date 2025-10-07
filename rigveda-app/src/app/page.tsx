'use client';

import Link from 'next/link';
import UniversalSearch from './components/UniversalSearch';
import dynamic from 'next/dynamic';

const RandomVerseCard = dynamic(() => import('./components/RandomVerseCard'), { ssr: false });

export default function Home() {

  return (
    <div className="space-y-10">
      <section className="text-center space-y-4">
        <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight">ऋग्वेद</h1>
        <p className="text-xl sm:text-2xl text-muted">THE RIGVEDA</p>
        <div className="max-w-2xl mx-auto">
          <UniversalSearch />
        </div>
      </section>

      <section>
        <h2 className="text-lg sm:text-xl font-semibold mb-4">Mandalas</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 md:gap-5">
          {Array.from({ length: 10 }, (_, i) => i + 1).map((mandala) => (
            <Link key={mandala} href={`/${mandala}`} className="group block">
              <div className="m-card m-elevation-1 p-3 md:p-4 hover:m-elevation-2 transition-shadow">
                <div className="flex items-center gap-3 md:gap-4">
                  <div className="w-10 h-10 md:w-12 md:h-12 rounded-lg grid place-items-center bg-[color:var(--primary)]/15 text-[color:var(--primary)]">{mandala}</div>
                  <div>
                    <div className="font-semibold">Mandala {mandala}</div>
                    <div className="text-xs text-muted">Explore hymns</div>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      <section>
        <RandomVerseCard />
      </section>
    </div>
  );
}
