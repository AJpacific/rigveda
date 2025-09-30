'use client';

import { useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faHome } from '@fortawesome/free-solid-svg-icons';
import Link from 'next/link';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

type ChatMessage = { role: 'user' | 'assistant'; content: string };

export default function SearchPage() {
  const searchParams = useSearchParams();
  const [query, setQuery] = useState(searchParams.get('query') || '');
  const [chatLoading, setChatLoading] = useState(false);
  const [chatError, setChatError] = useState<string | null>(null);
  const [chatRefs, setChatRefs] = useState<{ mandala: number; sukta: number; verse: string }[]>([]);
  const [history, setHistory] = useState<ChatMessage[]>([]);
  const listRef = useRef<HTMLDivElement | null>(null);
  const initialAskRef = useRef(false);

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: 'smooth' });
  }, [history, chatLoading]);

  // Auto-ask if we landed here with ?query= from the home page
  useEffect(() => {
    const q = (searchParams.get('query') || '').trim();
    if (!initialAskRef.current && q) {
      initialAskRef.current = true;
      setQuery(q);
      askChat(q);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const askChat = async (message?: string) => {
    const content = (message ?? query).trim();
    if (!content) return;
    setChatLoading(true);
    setChatError(null);
    setChatRefs([]);
    const nextHistory = [...history, { role: 'user', content }];
    setHistory(nextHistory);
    setQuery('');
    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: nextHistory }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || 'Chat failed');
      setHistory((h) => [...h, { role: 'assistant', content: data.answer || '' }]);
      setChatRefs(data.refs || []);
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : 'Chat failed';
      setChatError(message);
    }
    setChatLoading(false);
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      askChat();
    }
  };

  return (
    <div className="space-y-6">
      <nav className="rounded-xl border border-[color:var(--surface-strong)] bg-gradient-to-br from-[color:var(--light-cream)] to-white/80 dark:from-black/30 dark:to-black/20 backdrop-blur p-4 flex flex-wrap items-center justify-between gap-4">
        <Link href="/" className="text-[color:var(--gold)] text-lg flex items-center gap-2"><FontAwesomeIcon icon={faHome} /> Home</Link>
        <h2 className="text-xl font-semibold">Ask AI</h2>
        <span className="text-xs uppercase tracking-[0.35em] text-[color:var(--muted)]">RAG</span>
      </nav>

      <div className="rounded-xl border border-[color:var(--surface-strong)] bg-[color:var(--light-cream)]/80 dark:bg-black/20 backdrop-blur p-5 space-y-3">
        <div className="text-sm text-[color:var(--olive-green)] uppercase tracking-wide">Ask a question about the Rigveda</div>
        <div className="relative">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyPress}
            className="w-full p-3 rounded-lg border border-[color:var(--surface-strong)] bg-white dark:bg-black/40 focus:outline-none focus:ring-2 focus:ring-[color:var(--primary)]"
            placeholder="e.g. Who is Indra? What is described in 1.1?"
          />
          <div className="absolute right-2 top-1/2 -translate-y-1/2 flex gap-2">
            <button
              onClick={() => askChat()}
              className="px-3 py-2 rounded-md bg-[color:var(--olive-green)] text-white text-sm hover:opacity-90"
            >
              Ask
            </button>
          </div>
        </div>
        <p className="text-xs text-[color:var(--muted)]">Press Enter to ask AI. Use the box again for follow-ups.</p>
      </div>

      <div ref={listRef} className="rounded-xl border border-[color:var(--burnt-umber)] bg-white text-[color:var(--midnight-blue)] p-4 shadow-sm space-y-3 max-h-[50vh] overflow-auto">
        {history.length === 0 && <div className="text-sm text-[color:var(--muted)]">Start by asking a question above.</div>}
        {history.map((m, i) => (
          <div key={i} className={`${m.role === 'user' ? 'text-[color:var(--olive-green)]' : ''}`}>
            <div className="text-xs uppercase tracking-wide mb-1">{m.role === 'user' ? 'You' : 'AI'}</div>
            {m.role === 'assistant' ? (
              <div className="prose max-w-none">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>{m.content}</ReactMarkdown>
              </div>
            ) : (
              <div className="whitespace-pre-line">{m.content}</div>
            )}
          </div>
        ))}
        {chatLoading && <div className="text-sm text-[color:var(--muted)]">Thinking…</div>}
        {chatError && <div className="text-sm text-red-500">{chatError}</div>}
        {!!chatRefs.length && (
          <div className="text-xs text-[color:var(--muted)]">Refs: {chatRefs.map(r => `${r.mandala}.${r.sukta}.${r.verse}`).join(', ')}</div>
        )}
      </div>
    </div>
  );
}
