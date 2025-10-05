'use client';

import { useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faHome } from '@fortawesome/free-solid-svg-icons';
import Link from 'next/link';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

type ChatMessage = { role: 'user' | 'assistant'; content: string };

export default function SearchClient() {
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
      void askChat(q);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const askChat = async (message?: string) => {
    const content = (message ?? query).trim();
    if (!content) return;
    setChatLoading(true);
    setChatError(null);
    setChatRefs([]);
    const userTurn: ChatMessage = { role: 'user', content };
    const nextHistory: ChatMessage[] = [...history, userTurn];
    setHistory(nextHistory);
    setQuery('');
    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify({ messages: nextHistory }),
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
      setHistory((h) => [...h, { role: 'assistant', content: data.answer || '' }]);
      setChatRefs(Array.isArray(data.refs) ? data.refs : []);
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : 'Chat failed';
      setChatError(message);
    }
    setChatLoading(false);
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      void askChat();
    }
  };

  return (
    <div className="space-y-6">
      <div className="m-card m-elevation-1 p-4 sm:p-5 space-y-4">
        <div className="grid grid-cols-3 items-center">
          <Link href="/" className="m-btn m-btn-text text-sm justify-self-start"><FontAwesomeIcon icon={faHome} /> Home</Link>
          <h2 className="text-lg sm:text-xl font-semibold justify-self-center text-center">Ask AI</h2>
          <span className="justify-self-end" />
        </div>

        <div className="relative">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyPress}
            className="m-input pr-20"
            placeholder="Type your question..."
          />
          <div className="absolute right-2 top-1/2 -translate-y-1/2 flex gap-2">
            <button
              onClick={() => void askChat()}
              className="m-btn m-btn-filled text-sm"
            >
              Ask
            </button>
          </div>
        </div>
        

        <div className="m-divider" />

        <div ref={listRef} className="space-y-3 max-h-[55vh] sm:max-h-[60vh] overflow-auto">
          {history.length === 0 }
          {history.map((m, i) => (
            <div key={i} className={`${m.role === 'user' ? 'text-primary' : ''}`}>
              <div className="text-xs sm:text-sm uppercase tracking-wide mb-1">{m.role === 'user' ? 'You' : 'AI'}</div>
              {m.role === 'assistant' ? (
                <div className="prose max-w-none text-sm sm:text-base">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>{m.content}</ReactMarkdown>
                </div>
              ) : (
                <div className="whitespace-pre-line text-sm sm:text-base">{m.content}</div>
              )}
            </div>
          ))}
          {chatLoading && <div className="text-sm text-muted">Thinking…</div>}
          {chatError && <div className="text-sm" style={{color:'#b3261e'}}>{chatError}</div>}
          {!!chatRefs.length && (
            <div className="text-xs text-muted">Refs: {chatRefs.map(r => `${r.mandala}.${r.sukta}.${r.verse}`).join(', ')}</div>
          )}
        </div>
      </div>
    </div>
  );
}


