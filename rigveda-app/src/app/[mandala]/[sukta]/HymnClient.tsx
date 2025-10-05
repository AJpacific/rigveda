'use client';

import { useEffect, useRef, useState, type KeyboardEvent } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faStop, faHourglass, faPlay } from '@fortawesome/free-solid-svg-icons';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import type { Hymn, Verse, SanskritToken, SanskritSepToken, SanskritWordToken } from '../../../types/rigveda';

type HymnClientProps = {
  hymn: Hymn;
  mandala: number;
  sukta: number;
  prevPath: string | null;
  nextPath: string | null;
};

type AudioState = 'idle' | 'loading' | 'playing' | 'paused';

type ChatMessage = { role: 'user' | 'assistant'; content: string };

export default function HymnClient({ hymn, mandala, sukta, prevPath, nextPath }: HymnClientProps) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [audioState, setAudioState] = useState<AudioState>('idle');
  const [scrollProgress, setScrollProgress] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [currentVerseIndex, setCurrentVerseIndex] = useState<number | null>(null);

  // Verse-level Ask AI modal state
  const [chatOpen, setChatOpen] = useState(false);
  const [chatLoading, setChatLoading] = useState(false);
  const [chatError, setChatError] = useState<string | null>(null);
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [chatRef, setChatRef] = useState<string>('');
  const [chatContext, setChatContext] = useState<string>('');
  const chatListRef = useRef<HTMLDivElement | null>(null);

  // Dictionary modal state
  const [dictOpen, setDictOpen] = useState(false);
  const [dictUrl, setDictUrl] = useState<string | null>(null);
  const [dictWord, setDictWord] = useState<string>('');
  const dictContainerRef = useRef<HTMLDivElement | null>(null);
  const [dictScale, setDictScale] = useState(1);
  const [dictWrapperHeight, setDictWrapperHeight] = useState<number | null>(null);
  const [isMobile, setIsMobile] = useState(false);

  // Dispatch hymn metadata to global header
  useEffect(() => {
    try {
      const detail = { mandala, sukta, title: hymn.title, group: hymn.group, stanzas: hymn.stanzas ?? hymn.verses.length, prevPath, nextPath };
      window.dispatchEvent(new CustomEvent('hymn:meta', { detail }));
      return () => { window.dispatchEvent(new CustomEvent('hymn:meta', { detail: null })); };
    } catch {}
  }, [hymn, mandala, sukta, prevPath, nextPath]);

  const isSepToken = (t: SanskritToken): t is SanskritSepToken => 'sep' in t && typeof (t as SanskritSepToken).sep === 'string';
  const isWordToken = (t: SanskritToken): t is SanskritWordToken => 'word' in t;

  const startChatForVerse = (verse: Verse) => {
    const ref = `${verse.number}`;
    const lines: SanskritToken[][] = verse.sanskrit_lines && verse.sanskrit_lines.length
      ? verse.sanskrit_lines
      : verse.sanskrit ? [verse.sanskrit] : [];
    const sanskrit = lines
      .map((line: SanskritToken[]) => line
        .filter(Boolean)
        .map((w) => (isSepToken(w) ? w.sep : (isWordToken(w) ? w.word : ''))) 
        .filter(Boolean)
        .join(' '))
      .join(' / ');
    const translit = (verse.sanskrit ?? [])
      .filter((w): w is SanskritWordToken => isWordToken(w) && !!w.translit)
      .map((w) => w.translit as string)
      .join(' ');
    const ctx = `(${ref}) ${sanskrit}${translit ? `\n(${translit})` : ''}\n${verse.translation || ''}`;
    setChatRef(ref);
    setChatContext(ctx);
    setChatHistory([]);
    setChatError(null);
    setChatOpen(true);
    // Lock background scroll when modal opens
    try {
      document.documentElement.classList.add('no-scroll');
      document.body.classList.add('no-scroll');
    } catch {}
    void askChat(`Explain this verse in detail:\n${ctx}`);
  };

  const askChat = async (question?: string) => {
    const q = (question ?? chatInput).trim();
    if (!q) return;
    const firstTurn = chatHistory.length === 0;
    const messages: ChatMessage[] = firstTurn
      ? [{ role: 'user', content: `${chatContext}${q}` }]
      : [...chatHistory, { role: 'user', content: q }];
    setChatLoading(true);
    setChatError(null);
    setChatInput('');
    setChatHistory(messages);
    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify({ messages }),
      });
      let data: { answer?: string; refs?: { mandala: number; sukta: number; verse: string }[]; error?: string; detail?: string } = {};
      const contentType = res.headers.get('content-type') || '';
      try {
        if (contentType.includes('application/json')) {
          data = await res.json();
        } else {
          const txt = await res.text();
          try { data = JSON.parse(txt); } catch { data = { error: txt || 'Empty response' }; }
        }
      } catch {
        const txt = await res.text().catch(() => '');
        data = { error: txt || 'Empty response' };
      }
      if (!res.ok) {
        const combined = [data.error, data.detail].filter(Boolean).join(': ');
        throw new Error(combined || `Chat failed (${res.status})`);
      }
      setChatHistory((h) => [...h, { role: 'assistant', content: data.answer || '' }]);
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : 'Chat failed';
      setChatError(message);
    }
    setChatLoading(false);
  };

  const handleChatKey = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      void askChat();
    }
  };

  // Open dictionary modal for a Sanskrit word
  const openDictionary = (word: string) => {
    const url = `https://www.learnsanskrit.cc/translate?search=${encodeURIComponent(word)}&rv_embed=1`;
    setDictWord(word);
    setDictUrl(url);
    setDictOpen(true);
    try {
      document.documentElement.classList.add('no-scroll');
      document.body.classList.add('no-scroll');
    } catch {}
  };

  // Compute responsive scale for dictionary frame on open and resize
  useEffect(() => {
    if (!dictOpen) return;
    const updateScale = () => {
      const container = dictContainerRef.current;
      if (!container) return;
      const mobile = window.matchMedia('(max-width: 640px)').matches;
      setIsMobile(mobile);
      const baseWidth = 1024; // assumed desktop layout width of external site
      const width = container.clientWidth || baseWidth;
      const height = container.clientHeight || 800;
      const scale = Math.min(1, width / baseWidth);
      setDictScale(scale || 1);
      const wrapperHeight = Math.round(height / (scale || 1));
      setDictWrapperHeight(wrapperHeight);
    };
    updateScale();
    window.addEventListener('resize', updateScale);
    return () => window.removeEventListener('resize', updateScale);
  }, [dictOpen]);

  // Auto-scroll chat body to latest message
  useEffect(() => {
    chatListRef.current?.scrollTo({ top: chatListRef.current.scrollHeight, behavior: 'smooth' });
  }, [chatHistory, chatLoading]);

  useEffect(() => {
    const onScroll = () => {
      const doc = document.documentElement;
      const body = document.body;
      const winScroll = body.scrollTop || doc.scrollTop;
      const height = doc.scrollHeight - doc.clientHeight;
      const p = height > 0 ? (winScroll / height) * 100 : 0;
      setScrollProgress(p);
    };
    onScroll();
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    const audio = audioRef.current as HTMLAudioElement | null;
    if (!audio) return;

    const updateDuration = () => {
      if (Number.isFinite(audio.duration)) {
        setDuration(audio.duration);
      }
    };

  const updateProgress = () => {
    const current = audio.currentTime;
    setCurrentTime(current);
    if (Array.isArray(hymn.verseTimecodes) && hymn.verseTimecodes.length > 0) {
      const times = hymn.verseTimecodes;
      let idx = times.length - 1;
      for (let i = 0; i < times.length; i++) {
        if (current < times[i]) { idx = Math.max(0, i - 1); break; }
      }
      setCurrentVerseIndex(idx);
    } else {
      // Fallback: approximate verse index by proportion of total duration
      const totalVerses = hymn.verses.length;
      const totalDuration = audio.duration;
      if (Number.isFinite(totalDuration) && totalDuration > 0 && totalVerses > 0) {
        const ratio = Math.min(Math.max(current / totalDuration, 0), 1);
        const idx = Math.min(totalVerses - 1, Math.floor(ratio * totalVerses));
        setCurrentVerseIndex(idx);
      } else {
        setCurrentVerseIndex(null);
      }
    }
  };

    const handlePlay = () => setAudioState('playing');
    const handlePause = () => {
      // If paused due to reaching end, ended handler will fire and reset state.
      if (!audio.ended) {
        setAudioState('paused');
      }
    };
    const handleEnded = () => {
      setAudioState('idle');
      setCurrentTime(0);
      audio.currentTime = 0;
    };

    updateDuration();

    audio.addEventListener('loadedmetadata', updateDuration);
    audio.addEventListener('durationchange', updateDuration);
    audio.addEventListener('timeupdate', updateProgress);
    audio.addEventListener('play', handlePlay);
    audio.addEventListener('pause', handlePause);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('loadstart', () => setAudioState('loading'));
    audio.addEventListener('canplaythrough', () => {
      if (audio.paused) {
        setAudioState('paused');
      } else {
        setAudioState('playing');
      }
    });

    return () => {
      audio.removeEventListener('loadedmetadata', updateDuration);
      audio.removeEventListener('durationchange', updateDuration);
      audio.removeEventListener('timeupdate', updateProgress);
      audio.removeEventListener('play', handlePlay);
      audio.removeEventListener('pause', handlePause);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('loadstart', () => setAudioState('loading'));
      audio.removeEventListener('canplaythrough', () => {
        if (audio.paused) {
          setAudioState('paused');
        } else {
          setAudioState('playing');
        }
      });
    };
  }, [hymn, duration]);

  useEffect(() => {
    const audio = audioRef.current as HTMLAudioElement | null;
    if (!audio) return;
    audio.pause();
    audio.currentTime = 0;
    setCurrentTime(0);
    setDuration(0);
    setAudioState('idle');
  }, [hymn]);

  const toggleAudio = () => {
    const audio = audioRef.current as HTMLAudioElement;
    if (!audio) return;
    if (audio.paused) {
      audio.play();
    } else {
      audio.pause();
    }
  };

  const handleSeek = (value: number) => {
    const audio = audioRef.current as HTMLAudioElement | null;
    if (!audio) return;
    const clamped = Math.min(Math.max(value, 0), duration || audio.duration || 0);
    audio.currentTime = clamped;
    setCurrentTime(clamped);
  };

  const formatTime = (seconds: number) => {
    if (!Number.isFinite(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const audioButtonIcon = audioState === 'playing' ? faStop : audioState === 'loading' ? faHourglass : faPlay;
  const audioButtonLabel = audioState === 'playing' ? 'Pause' : audioState === 'loading' ? 'Loading' : 'Play';

  return (
    <div className="space-y-6 pb-24 sm:pb-28">
      {/* Thin scroll progress line */}
      <div className="fixed top-0 left-0 right-0 h-1 bg-[color:var(--surface-strong)] z-50 pointer-events-none">
        <div className="h-full bg-[color:var(--primary)]" style={{ width: `${scrollProgress}%` }} />
      </div>

      {/* Content */}
      <section className="space-y-4 pt-2">
        {hymn.verses.map((verse: Verse, i: number) => {
          const isFirst = i === 0;
          const articleClass = isFirst
            ? 'm-card m-elevation-1 p-2 sm:p-4 sm:pt-8 relative'
            : 'm-card m-elevation-1 p-3 sm:p-4 sm:pt-10 relative';
          return (
          <article key={i} className={articleClass}>
            <div className="flex justify-end">
              <button
                onClick={() => startChatForVerse(verse)}
                className="m-btn m-btn-outlined text-xs sm:absolute sm:top-2 sm:right-2"
                aria-label="Ask AI about this verse"
              >
                Ask AI
              </button>
            </div>
            <div className="space-y-2 mb-3">
              {(
                verse.sanskrit_lines && verse.sanskrit_lines.length
                  ? verse.sanskrit_lines
                  : verse.sanskrit ? [verse.sanskrit] : []
                ).map((line: SanskritToken[], li: number) => (
                <div key={li} className={isFirst ? 'flex flex-wrap items-start gap-x-2 gap-y-1 sm:gap-x-3 sm:gap-y-2' : 'flex flex-wrap items-start gap-x-3 gap-y-2'}>
                  {line.map((w: SanskritToken, wi: number) => (
                    isSepToken(w) ? (
                      <div key={`sep-${li}-${wi}`} className="text-center sanskrit-token">
                        <div className={isFirst ? 'text-[1.05rem] sm:text-[1.25rem] leading-tight text-accent' : 'text-[1.25rem] leading-tight text-accent'}>{w.sep}</div>
                        <div className="text-[13px] text-transparent select-none">.</div>
                      </div>
                    ) : (
                      <button key={wi} onClick={() => openDictionary((w as SanskritWordToken).word)} className="text-center sanskrit-token">
                        <div className={isFirst ? 'text-[1.05rem] sm:text-[1.25rem] leading-tight text-accent' : 'text-[1.25rem] leading-tight text-accent'}>{(w as SanskritWordToken).word}</div>
                        {(w as SanskritWordToken).translit && <div className="text-[13px] text-muted">{(w as SanskritWordToken).translit}</div>}
                      </button>
                    )
                  ))}
                </div>
              ))}
            </div>
            <div className="max-w-none whitespace-pre-line text-sm sm:text-base">
              {verse.translation}
            </div>
            <div className="text-right text-xs text-muted mt-2">{verse.number}</div>
          </article>
          );
        })}
      </section>

      {chatOpen && (
        <div className="m-dialog-overlay" role="dialog" aria-modal="true">
          <div className="m-dialog">
            <div className="m-dialog-header">
              <div className="text-sm uppercase tracking-wide text-muted">Ask AI · Verse {chatRef}</div>
              <button onClick={() => { setChatOpen(false); try { document.documentElement.classList.remove('no-scroll'); document.body.classList.remove('no-scroll'); } catch {} }} className="icon-btn" aria-label="Close">×</button>
            </div>
            <div ref={chatListRef} className="m-dialog-body space-y-3">
              {chatHistory.length === 0 && <div className="text-sm text-muted">Context loaded. Ask a question about this verse.</div>}
              {chatHistory.map((m, idx) => (
                <div key={idx} className="space-y-1">
                  <div className="text-sm uppercase tracking-wide mb-1 text-primary font-semibold">{m.role === 'user' ? 'You' : 'AI'}</div>
                  {m.role === 'assistant' ? (
                    <div className="max-w-none text-base leading-relaxed">
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>{m.content}</ReactMarkdown>
                    </div>
                  ) : (
                    <div className="whitespace-pre-line text-base leading-relaxed">{m.content}</div>
                  )}
                </div>
              ))}
              {chatError && <div className="text-sm" style={{color:'#b3261e'}}>{chatError}</div>}
              {chatLoading && <div className="text-sm text-muted">Thinking…</div>}
            </div>
            <div className="m-dialog-footer">
              <div className="m-field">
                <input
                  type="text"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  onKeyDown={handleChatKey}
                  className="m-input"
                  placeholder="Ask a follow-up…"
                />
              </div>
              <div className="mt-2 text-right">
                <button onClick={() => void askChat()} className="m-btn m-btn-filled">
                  Ask
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {dictOpen && (
        <div className="m-dialog-overlay" role="dialog" aria-modal="true">
          <div className="m-dialog wide">
            <div className="m-dialog-header">
              <div className="text-sm uppercase tracking-wide text-muted">Dictionary · {dictWord}</div>
              <button onClick={() => { setDictOpen(false); try { document.documentElement.classList.remove('no-scroll'); document.body.classList.remove('no-scroll'); } catch {} }} className="icon-btn" aria-label="Close">×</button>
            </div>
            <div className="m-dialog-body">
              {dictUrl ? (
                <div className="m-embed-container" ref={dictContainerRef}>
                  {isMobile ? (
                    <iframe className="embedded-frame" src={dictUrl} title="Dictionary" />
                  ) : (
                    <div style={{ width: '1024px', height: dictWrapperHeight ? `${dictWrapperHeight}px` : '800px', transform: `scale(${dictScale})`, transformOrigin: 'top left' }}>
                      <iframe className="embedded-frame" src={dictUrl} title="Dictionary" />
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-sm text-muted">Loading…</div>
              )}
            </div>
            <div className="m-dialog-footer">
              <div className="text-xs text-muted">
                If the page fails to load here, you can open it directly.
                {' '}
                {dictUrl && (
                  <a href={dictUrl} target="_blank" rel="noreferrer noopener" className="m-btn m-btn-text text-sm">Open</a>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Audio footer */}
      <div className="m-audiofooter">
        <div className="container mx-auto px-3 py-2">
          <div className="flex items-center gap-2">
            <button
              onClick={toggleAudio}
              className="m-btn m-btn-outlined text-xs sm:text-sm min-w-[2.5rem] sm:min-w-[6rem]"
              disabled={audioState === 'loading'}
              aria-label={audioButtonLabel}
            >
              <FontAwesomeIcon icon={audioButtonIcon} />
              <span className="hidden sm:inline ml-2">{audioButtonLabel}</span>
            </button>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between text-[11px] text-[color:var(--muted)] mb-1">
                <div className="truncate">Now playing: <span className="font-medium text-[color:var(--olive-green)]">Verse {Number.isInteger(currentVerseIndex) && currentVerseIndex !== null ? hymn.verses[currentVerseIndex]?.number : '-'}</span></div>
                <div className="whitespace-nowrap">{formatTime(currentTime)} / {formatTime(duration)}</div>
              </div>
              <input
                type="range"
                min={0}
                max={duration}
                step={0.1}
                value={currentTime}
                onChange={(e) => handleSeek(Number(e.target.value))}
                className="w-full accent-[color:var(--olive-green)]"
                aria-label="Seek"
              />
            </div>
          </div>
          <audio ref={audioRef} src={hymn.audio} />
        </div>
      </div>

    </div>
  );
}
