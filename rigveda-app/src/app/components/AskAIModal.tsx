'use client';

import { useEffect, useRef, useState, type KeyboardEvent } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTimes, faRobot } from '@fortawesome/free-solid-svg-icons';

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
  const chatInputRef = useRef<HTMLTextAreaElement | null>(null);
  const lastOpenRef = useRef(false);

  // Chat history persistence
  const getChatStorageKey = () => 'random_verse_chat_history';
  
  const saveChatHistory = (history: ChatMessage[]) => {
    try {
      const key = getChatStorageKey();
      localStorage.setItem(key, JSON.stringify(history));
      console.log('Saved chat history for', key, ':', history);
    } catch (error) {
      console.warn('Failed to save chat history:', error);
    }
  };

  const loadChatHistory = (): ChatMessage[] => {
    try {
      const key = getChatStorageKey();
      const stored = localStorage.getItem(key);
      const history = stored ? JSON.parse(stored) : [];
      console.log('Loading chat history for', key, ':', history);
      return history;
    } catch (error) {
      console.warn('Failed to load chat history:', error);
      return [];
    }
  };

  useEffect(() => {
    if (!open) return;
    try { document.body.classList.add('no-scroll'); } catch {}
    return () => { try { document.body.classList.remove('no-scroll'); } catch {} };
  }, [open]);

  // Load chat history when modal opens
  useEffect(() => {
    if (open) {
      const existingHistory = loadChatHistory();
      setChatHistory(existingHistory);
    }
  }, [open]);

  // Auto-scroll
  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: 'smooth' });
  }, [chatHistory, chatLoading]);

  // Pre-fill input with context when modal opens
  useEffect(() => {
    if (!open) {
      lastOpenRef.current = false;
      return;
    }
    // If modal was just opened (wasn't open before), pre-fill input with context
    if (!lastOpenRef.current && contextPrefix) {
      setChatInput(contextPrefix);
      // Trigger resize after setting the context
      setTimeout(() => {
        resizeTextarea();
        // Focus the textarea and position cursor at the end
        if (chatInputRef.current) {
          chatInputRef.current.focus();
          chatInputRef.current.setSelectionRange(chatInputRef.current.value.length, chatInputRef.current.value.length);
        }
      }, 100);
    }
    lastOpenRef.current = true;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, contextPrefix]);

  const askChatDirectly = async (fullQuestion: string) => {
    if (!fullQuestion.trim()) return;
    const messages: ChatMessage[] = [...chatHistory, { role: 'user', content: fullQuestion }];
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

  const askChat = async (question?: string) => {
    const q = (question ?? chatInput).trim();
    if (!q) return;
    const firstTurn = chatHistory.length === 0;
    
    // Create user message for display (just the question)
    const userMessage: ChatMessage = { role: 'user' as const, content: q };
    
    // Create messages for API (first turn includes context)
    const apiMessages: ChatMessage[] = firstTurn
      ? [{ role: 'user' as const, content: contextPrefix ? `${contextPrefix}${q}` : q }]
      : [...chatHistory, userMessage];
    
    setChatLoading(true);
    setChatError(null);
    setChatInput('');
    resetTextareaHeight();
    
    // Update chat history for display (always just the question)
    const displayHistory = [...chatHistory, userMessage];
    setChatHistory(displayHistory);
    saveChatHistory(displayHistory);
    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify({ messages: apiMessages }),
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
      const newHistory: ChatMessage[] = [...displayHistory, { role: 'assistant' as const, content: data.answer || '' }];
      setChatHistory(newHistory);
      saveChatHistory(newHistory);
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : 'Chat failed';
      setChatError(message);
    }
    setChatLoading(false);
  };

  const resetTextareaHeight = () => {
    if (chatInputRef.current) {
      chatInputRef.current.style.height = 'auto';
      chatInputRef.current.style.height = '48px';
    }
  };

  const resizeTextarea = () => {
    if (chatInputRef.current) {
      chatInputRef.current.style.height = 'auto';
      chatInputRef.current.style.height = `${Math.min(chatInputRef.current.scrollHeight, 120)}px`;
      // Scroll to bottom to show the end of the content
      chatInputRef.current.scrollTop = chatInputRef.current.scrollHeight;
    }
  };

  const handleKey = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      void askChat();
    }
  };

  return (
    <div 
      className={`fixed inset-0 z-50 flex items-start justify-center p-4 pb-20 ${open ? 'block' : 'hidden'}`}
      style={{ 
        backgroundColor: 'rgba(0, 0, 0, 0.1) !important',
        background: 'rgba(0, 0, 0, 0.1) !important',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        position: 'fixed',
            paddingTop: '40px'
      }}
      role="dialog" 
      aria-modal="true"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full h-[75vh] sm:h-[80vh] flex flex-col animate-in fade-in-0 zoom-in-95 duration-300 overflow-hidden mb-4" style={{ width: '100%' }}>
        <div className="flex items-center justify-between p-6 border-b border-gray-100 flex-shrink-0 relative z-10 bg-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
              <FontAwesomeIcon icon={faRobot} className="text-blue-600 text-lg" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">{title}</h2>
              <p className="text-sm text-gray-500">Ask questions about Rigveda</p>
            </div>
          </div>
          <button 
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              e.nativeEvent.stopImmediatePropagation();
              onClose();
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
        <div ref={listRef} className="flex-1 p-6 overflow-y-auto space-y-4 min-h-0">
          {chatHistory.map((m, idx) => (
            <div key={idx} className={`flex gap-3 ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              {m.role === 'assistant' && (
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <FontAwesomeIcon icon={faRobot} className="w-4 h-4 text-blue-600" />
                </div>
              )}
              <div className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                m.role === 'user' 
                  ? 'bg-blue-500 text-white' 
                  : 'bg-gray-100 text-gray-900'
              }`}>
                {m.role === 'assistant' ? (
                  <div className="text-sm leading-relaxed">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>{m.content}</ReactMarkdown>
                  </div>
                ) : (
                  <div className="whitespace-pre-line text-sm leading-relaxed">{m.content}</div>
                )}
              </div>
              {m.role === 'user' && (
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <svg className="w-4 h-4 text-blue-600" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                  </svg>
                </div>
              )}
            </div>
          ))}
          {chatError && (
            <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd"/>
              </svg>
              {chatError}
            </div>
          )}
          {chatLoading && (
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <div className="w-4 h-4 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin"></div>
              Thinking…
            </div>
          )}
        </div>
        <div className="p-6 border-t border-gray-100 bg-gray-50 flex-shrink-0">
          <div className="flex gap-3">
            <div className="flex-1 relative">
              <textarea
                ref={chatInputRef}
                value={chatInput}
                onChange={(e) => {
                  setChatInput(e.target.value);
                  // Auto-resize textarea
                  const textarea = e.target;
                  textarea.style.height = 'auto';
                  textarea.style.height = `${Math.min(textarea.scrollHeight, 120)}px`;
                }}
                onKeyDown={handleKey}
                className="w-full px-4 py-3 pr-12 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 resize-none overflow-y-auto"
                placeholder="Type your question about Rigveda..."
                rows={1}
                style={{
                  height: 'auto',
                  minHeight: '48px',
                  maxHeight: '120px'
                }}
              />
              <button 
                onClick={() => void askChat()} 
                disabled={!chatInput.trim() || chatLoading}
                className="absolute right-6 bottom-3 w-8 h-8 rounded-full bg-blue-100 hover:bg-blue-200 disabled:bg-gray-300 disabled:cursor-not-allowed text-blue-600 hover:text-blue-700 transition-colors duration-200 flex items-center justify-center"
              >
                {chatLoading ? (
                  <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z"/>
                  </svg>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
