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

  const handleAskClick = () => {
    const q = query.trim();
    if (!q) return;
    router.push(`/search?query=${encodeURIComponent(q)}`);
  };

  return (
    <div className="space-y-10">
      <section className="text-center space-y-4">
        <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight">ऋग्वेद</h1>
        <p className="text-xl sm:text-2xl text-muted">THE RIGVEDA</p>
        <div className="max-w-2xl mx-auto">
          <div className="m-field relative">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleSearch}
              className="m-input pr-24"
              placeholder="Type your question..."
            />
            <div className="absolute right-2 top-1/2 -translate-y-1/2 flex gap-2">
              <button onClick={handleAskClick} className="m-btn m-btn-filled text-sm" disabled={!query.trim()}>
                Ask
              </button>
            </div>
          </div>
          <p className="text-xs text-muted mt-2">Press Enter to search or click Ask</p>
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
    </div>
  );
}
