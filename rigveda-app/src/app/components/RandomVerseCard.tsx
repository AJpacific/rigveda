'use client';

import { useEffect, useMemo, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faRobot, faRotateRight } from '@fortawesome/free-solid-svg-icons';
import AskAIModal from './AskAIModal';



type RandomVerse = {
  mandala: number;
  sukta: number;
  verse: string;
  title: string;
  translation: string;
  devanagari_text: string;
  padapatha_text: string;
};

export default function RandomVerseCard() {
  const [data, setData] = useState<RandomVerse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [askOpen, setAskOpen] = useState(false);
  const [dictOpen, setDictOpen] = useState(false);
  const [dictUrl, setDictUrl] = useState<string | null>(null);
  const [dictWord, setDictWord] = useState<string>('');

  const fetchVerse = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/random-verse', { cache: 'no-store' });
      if (!res.ok) throw new Error(`Failed (${res.status})`);
      const json = (await res.json()) as RandomVerse & { error?: string };
      if ((json as { error?: string }).error) throw new Error((json as { error?: string }).error || 'Error');
      setData(json);
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Failed to load verse';
      setError(msg);
    }
    setLoading(false);
  };

  useEffect(() => {
    void fetchVerse();
  }, []);

  // Lock body scroll when dictionary is open
  useEffect(() => {
    if (!dictOpen) return;
    try { document.documentElement.classList.add('no-scroll'); document.body.classList.add('no-scroll'); } catch {}
    return () => { try { document.documentElement.classList.remove('no-scroll'); document.body.classList.remove('no-scroll'); } catch {} };
  }, [dictOpen]);

  const openDictionary = (word: string) => {
    if (!word) return;
    const url = `https://www.learnsanskrit.cc/translate?search=${encodeURIComponent(word)}&rv_embed=1`;
    setDictWord(word);
    setDictUrl(url);
    setDictOpen(true);
  };

  const contextPrefix = useMemo(() => {
    if (!data) return '';
    const ref = `${data.verse}`;
    return `CONTEXT\n(${ref}) ${data.devanagari_text}\n(${data.padapatha_text})\n${data.translation}\n\nQUESTION: `;
  }, [data]);

  return (
    <div className="m-card m-elevation-1 p-3 sm:p-4">
      <div className="flex items-center justify-between gap-2 mb-2">
        <div className="flex items-baseline gap-2 min-w-0">
          <div className="text-sm sm:text-base font-semibold shrink-0">Random Verse</div>
          {data && (
            <div className="text-xs text-muted truncate">Verse {data.verse}</div>
          )}
        </div>
        <div className="flex items-center gap-1 sm:gap-2">
          <button className="m-btn m-btn-filled text-sm" onClick={() => setAskOpen(true)} disabled={!data} aria-label="Ask AI">
            <FontAwesomeIcon icon={faRobot} />
            <span className="hidden sm:inline ml-2">Ask AI</span>
          </button>
          <button className="m-btn m-btn-outlined text-sm" onClick={() => void fetchVerse()} disabled={loading} aria-label={loading ? 'Refreshing' : 'Refresh'}>
            <FontAwesomeIcon icon={faRotateRight} />
            <span className="hidden sm:inline ml-2">{loading ? 'Refreshing…' : 'Refresh'}</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="text-sm" style={{ color: '#b3261e' }}>{error}</div>
      )}

      {!error && !data && (
        <div className="text-sm text-muted">Loading…</div>
      )}

      {data && !error && (
        <div className="space-y-3">
          {/* Devanagari Text with clickable words */}
          <div className="text-[1.05rem] sm:text-[1.15rem] leading-tight text-accent whitespace-pre-line">
            {data.devanagari_text.split(/(\s+|\n)/).map((part, index) => {
              if (part === '\n') {
                return <br key={index} />;
              } else if (part.trim() === '') {
                return <span key={index}>{part}</span>;
              } else {
                return (
                  <button 
                    key={index}
                    onClick={() => openDictionary(part.trim())} 
                    className="hover:text-gray-700 hover:underline cursor-pointer"
                  >
                    {part}
                  </button>
                );
              }
            })}
          </div>

          
          <div className="text-[1.0rem] sm:text-[1rem] text-gray-500 font-normal leading-relaxed">
            {data.padapatha_text.split(' ').map((word, index) => (
              <span key={index}>
                <button 
                  onClick={() => openDictionary(word.trim())} 
                  className="hover:text-gray-700 hover:underline cursor-pointer"
                >
                  {word}
                </button>
                {index < data.padapatha_text.split(' ').length - 1 && ' '}
              </span>
            ))}
          </div>

          {/* Translation */}
          <div className="text-sm sm:text-base whitespace-pre-line">{data.translation}</div>
        </div>
      )}

      <AskAIModal
        open={askOpen}
        onClose={() => setAskOpen(false)}
        initialQuestion={askOpen ? "Explain this verse in detail." : undefined}
        title={`Ask AI · ${data ? `${data.verse}` : ''}`}
        contextPrefix={contextPrefix}
      />

      {dictOpen && (
        <div className="m-dialog-overlay" role="dialog" aria-modal="true">
          <div className="m-dialog wide">
            <div className="m-dialog-header">
              <div className="text-sm uppercase tracking-wide text-muted">Dictionary · {dictWord}</div>
              <button onClick={() => setDictOpen(false)} className="icon-btn" aria-label="Close">×</button>
            </div>
            <div className="m-dialog-body">
              {dictUrl ? (
                <div className="m-embed-container">
                  <iframe className="embedded-frame" src={dictUrl} title="Dictionary" />
                </div>
              ) : (
                <div className="text-sm text-muted">Loading…</div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


