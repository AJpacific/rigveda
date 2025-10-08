'use client';

import { useEffect, useMemo, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faRobot, faRotateRight, faExternalLinkAlt, faTimes } from '@fortawesome/free-solid-svg-icons';
import Link from 'next/link';
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
          {data && (
            <Link href={`/${data.mandala}/${data.sukta}#verse-${data.verse}`} className="m-btn m-btn-outlined text-sm" aria-label="Go to Hymn">
              <FontAwesomeIcon icon={faExternalLinkAlt} />
              <span className="hidden sm:inline ml-2">Go to Hymn</span>
            </Link>
          )}
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
          <div className="text-[1.05rem] sm:text-[1.15rem] leading-loose text-accent whitespace-pre-line">
            {data.devanagari_text.split(/(\s+|\n)/).map((part, index) => {
              if (part === '\n') {
                return <br key={index} className="mb-2" />;
              } else if (part.trim() === '') {
                return <span key={index} className="mx-1">{part}</span>;
              } else {
                return (
                  <button 
                    key={index}
                    onClick={() => openDictionary(part.trim())} 
                    className="hover:text-gray-700 hover:underline cursor-pointer mx-1 my-1"
                  >
                    {part}
                  </button>
                );
              }
            })}
          </div>

          
          <div className="text-[1rem] sm:text-[1.1rem] text-gray-500 font-normal leading-relaxed">
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
        <div 
          className="fixed inset-0 z-50 flex items-start justify-center p-4"
          style={{ 
            backgroundColor: 'rgba(0, 0, 0, 0.1) !important',
            background: 'rgba(0, 0, 0, 0.1) !important',
            paddingTop: '80px',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            position: 'fixed'
          }} 
          role="dialog" 
          aria-modal="true"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setDictOpen(false);
            }
          }}
        >
          <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[80vh] overflow-hidden animate-in fade-in-0 zoom-in-95 duration-300">
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                  <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z"/>
                    <path fillRule="evenodd" d="M4 5a2 2 0 012-2v1a1 1 0 001 1h6a1 1 0 001-1V3a2 2 0 012 2v6a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3z" clipRule="evenodd"/>
                  </svg>
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">Dictionary</h2>
                  <p className="text-sm text-gray-500">Definition for "{dictWord}"</p>
                </div>
              </div>
              <button 
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  e.nativeEvent.stopImmediatePropagation();
                  setDictOpen(false);
                }}
                onMouseDown={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                }}
                className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-500 hover:text-gray-700 transition-colors duration-200" 
                aria-label="Close"
                type="button"
              >
                <FontAwesomeIcon icon={faTimes} className="text-sm" />
              </button>
            </div>
            <div className="p-6 max-h-[calc(80vh-120px)] overflow-y-auto">
              {dictUrl ? (
                <div className="m-embed-container">
                  <iframe className="embedded-frame" src={dictUrl} title="Dictionary" />
                </div>
              ) : (
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <div className="w-4 h-4 border-2 border-gray-300 border-t-green-600 rounded-full animate-spin"></div>
                  Loading dictionary…
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


