'use client';

import { useEffect, useRef, useState, type KeyboardEvent } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

export type ChatMessage = { role: 'user' | 'assistant'; content: string };

type AskAIModalProps = {
  open: boolean;
  onClose: () => void;
  initialQuestion?: string;
  title?: string;
  contextPrefix?: string; // optional prefix/context to prepend to first question
};

export default function AskAIModal({ open, onClose, initialQuestion, title = 'Ask AI', contextPrefix = '' }: AskAIModalProps) {
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const [chatError, setChatError] = useState<string | null>(null);
  const listRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!open) return;
    try { document.documentElement.classList.add('no-scroll'); document.body.classList.add('no-scroll'); } catch {}
    return () => { try { document.documentElement.classList.remove('no-scroll'); document.body.classList.remove('no-scroll'); } catch {} };
  }, [open]);

  // Auto-scroll
  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: 'smooth' });
  }, [chatHistory, chatLoading]);

  // Ask on open if initialQuestion provided
  useEffect(() => {
    if (!open) return;
    if (initialQuestion && chatHistory.length === 0) {
      void askChat(initialQuestion);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, initialQuestion]);

  const askChat = async (question?: string) => {
    const q = (question ?? chatInput).trim();
    if (!q) return;
    const firstTurn = chatHistory.length === 0;
    const messages: ChatMessage[] = firstTurn
      ? [{ role: 'user', content: `${contextPrefix}${q}` }]
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
      let data: { answer?: string; error?: string; detail?: string } = {};
      const contentType = res.headers.get('content-type') || '';
      try {
        if (contentType.includes('application/json')) data = await res.json();
        else {
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

  const handleKey = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') void askChat();
  };

  if (!open) return null;

  return (
    <div className="m-dialog-overlay" role="dialog" aria-modal="true">
      <div className="m-dialog wide m-dialog-plain">
        <div className="m-dialog-header">
          <div className="text-sm uppercase tracking-wide text-muted">{title}</div>
          <button onClick={onClose} className="icon-btn" aria-label="Close">×</button>
        </div>
        <div ref={listRef} className="m-dialog-body space-y-3">
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
              onKeyDown={handleKey}
              className="m-input"
              placeholder="Type your question…"
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
  );
}
