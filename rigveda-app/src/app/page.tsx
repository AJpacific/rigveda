'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import Link from 'next/link';

export default function Home() {
  const router = useRouter();
  const [query, setQuery] = useState('');

  const handleSearch = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      router.push(`/search?query=${encodeURIComponent(query)}`);
    }
  };

  return (
    <div className="space-y-10">
      <section className="text-center space-y-4">
        <h1 className="text-5xl md:text-6xl font-extrabold tracking-tight">ऋग्वेद</h1>
        <p className="text-2xl text-[color:var(--muted)]">THE RIGVEDA</p>
        <div className="max-w-2xl mx-auto">
          <div className="relative">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleSearch}
              className="w-full p-3 rounded-lg border border-[color:var(--surface-strong)] bg-white/75 dark:bg-black/30 backdrop-blur focus:outline-none focus:ring-2 focus:ring-[color:var(--primary)]"
              placeholder="Search hymns, e.g. Indra, Agni..."
            />
            <div className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-[color:var(--muted)]">↵</div>
          </div>
          <p className="text-xs text-[color:var(--muted)] mt-2">Press Enter to search</p>
        </div>
      </section>

      <section>
        <h2 className="text-xl font-semibold mb-4">Mandalas</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-5">
          {Array.from({ length: 10 }, (_, i) => i + 1).map((mandala) => (
            <Link key={mandala} href={`/${mandala}`} className="group block">
              <div className="rounded-xl p-4 shadow-sm transition-all border border-[color:var(--burnt-umber)] bg-white text-[color:var(--midnight-blue)] hover:shadow-md">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-lg grid place-items-center bg-[color:var(--primary)]/15 text-[color:var(--primary)]">{mandala}</div>
                  <div>
                    <div className="font-semibold">Mandala {mandala}</div>
                    <div className="text-xs text-[color:var(--muted)]">Explore hymns</div>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
