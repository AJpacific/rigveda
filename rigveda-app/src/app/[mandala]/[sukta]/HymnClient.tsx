'use client';

import { useEffect, useRef, useState, type KeyboardEvent } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faStop, faHourglass, faPlay, faTimes, faRobot } from '@fortawesome/free-solid-svg-icons';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import type { Hymn, Verse } from '../../../types/rigveda';

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
  const chatInputRef = useRef<HTMLTextAreaElement | null>(null);

  // Chat history persistence - unified for all verse-level chats
  const getChatStorageKey = () => `verse_chat_history_${mandala}_${sukta}`;
  
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

  // Dictionary modal state
  const [dictOpen, setDictOpen] = useState(false);
  const [dictUrl, setDictUrl] = useState<string | null>(null);
  const [dictWord, setDictWord] = useState<string>('');
  const dictContainerRef = useRef<HTMLDivElement | null>(null);
  const [dictScale, setDictScale] = useState(1);
  const [dictWrapperHeight, setDictWrapperHeight] = useState<number | null>(null);
  const [isMobile, setIsMobile] = useState(false);

  // Verse highlighting state
  const [highlightedVerse, setHighlightedVerse] = useState<string | null>(null);

  // Dispatch hymn metadata to global header
  useEffect(() => {
    try {
      const detail = { mandala, sukta, title: hymn.addressee, group: hymn.group_name, stanzas: hymn.verses.length, prevPath, nextPath };
      window.dispatchEvent(new CustomEvent('hymn:meta', { detail }));
      return () => { window.dispatchEvent(new CustomEvent('hymn:meta', { detail: null })); };
    } catch {}
  }, [hymn, mandala, sukta, prevPath, nextPath]);

  // Handle scroll to verse with flash effect
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash;
      if (hash.startsWith('#verse-')) {
        const verseNumber = hash.replace('#verse-', '');
        scrollToVerse(verseNumber);
      }
    };

    // Check for hash on mount
    handleHashChange();

    // Listen for hash changes
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const scrollToVerse = (verseNumber: string) => {
    const verseElement = document.getElementById(`verse-${verseNumber}`);
    if (verseElement) {
      // Show scroll animation by scrolling to the verse
      verseElement.scrollIntoView({ 
        behavior: 'smooth', 
        block: 'center' 
      });
      
      // Start flash highlight effect after a short delay to show scroll
      setTimeout(() => {
        setHighlightedVerse(verseNumber);
        
        // Remove highlight after animation completes
        setTimeout(() => {
          setHighlightedVerse(null);
        }, 1500); // 1.5 seconds for the dimming animation
      }, 300); // Small delay to show the scroll animation first
    }
  };

  const startChatForVerse = (verse: Verse) => {
    const ref = `${verse.verse_number}`;
    const ctx = `(${ref}) ${verse.devanagari_text}\n(${verse.padapatha_text})\n${verse.griffith_translation}`;
    setChatRef(ref);
    setChatContext(ctx);
    
    // Load existing chat history (unified for all verses)
    const existingHistory = loadChatHistory();
    console.log('Setting chat history to:', existingHistory);
    setChatHistory(existingHistory);
    setChatError(null);
    setChatInput(`Context: ${ctx}\n\nQuestion: `);
    setChatOpen(true);
    // Lock background scroll when modal opens
    try {
      document.documentElement.classList.add('no-scroll');
      document.body.classList.add('no-scroll');
    } catch {}
  };

  const resetTextareaHeight = () => {
    if (chatInputRef.current) {
      chatInputRef.current.style.height = 'auto';
      chatInputRef.current.style.height = '48px';
    }
  };

  const askChat = async (question?: string) => {
    const q = (question ?? chatInput).trim();
    if (!q) return;
    const firstTurn = chatHistory.length === 0;
    
    // Create user message for display (just the question)
    const userMessage: ChatMessage = { role: 'user' as const, content: q };
    
    // Create messages for API (first turn includes context)
    const apiMessages: ChatMessage[] = firstTurn
      ? [{ role: 'user' as const, content: `${chatContext}${q}` }]
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
      const newHistory: ChatMessage[] = [...displayHistory, { role: 'assistant' as const, content: data.answer || '' }];
      setChatHistory(newHistory);
      saveChatHistory(newHistory);
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : 'Chat failed';
      setChatError(message);
    }
    setChatLoading(false);
  };

  const handleChatKey = (e: KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
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

  // Auto-resize textarea when modal opens with pre-populated content
  useEffect(() => {
    if (chatOpen && chatInput && chatInputRef.current) {
      const textarea = chatInputRef.current;
      textarea.style.height = 'auto';
      textarea.style.height = `${Math.min(textarea.scrollHeight, 200)}px`;
      
      // Scroll to input field and position cursor at end
      setTimeout(() => {
        textarea.scrollIntoView({ behavior: 'smooth', block: 'center' });
        // Scroll textarea content to bottom and position cursor at end
        textarea.scrollTop = textarea.scrollHeight;
        textarea.setSelectionRange(textarea.value.length, textarea.value.length);
        textarea.focus();
      }, 100);
    }
  }, [chatOpen, chatInput]);

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
    // Approximate verse index by proportion of total duration
    const totalVerses = hymn.verses.length;
    const totalDuration = audio.duration;
    if (Number.isFinite(totalDuration) && totalDuration > 0 && totalVerses > 0) {
      const ratio = Math.min(Math.max(current / totalDuration, 0), 1);
      const idx = Math.min(totalVerses - 1, Math.floor(ratio * totalVerses));
      setCurrentVerseIndex(idx);
    } else {
      setCurrentVerseIndex(null);
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
    <div className="space-y-6 pb-24 sm:pb-28 relative">

      {/* Content */}
      <section className="space-y-4 pt-2">
        {hymn.verses.map((verse: Verse, i: number) => {
          const isFirst = i === 0;
          const isHighlighted = highlightedVerse === verse.verse_number;
          const articleClass = isFirst
            ? 'm-card m-elevation-1 p-2 sm:p-4 sm:pt-8 relative'
            : 'm-card m-elevation-1 p-3 sm:p-4 sm:pt-10 relative';
          
          return (
          <article 
            key={i} 
            id={`verse-${verse.verse_number}`}
            className={`${articleClass} ${isHighlighted ? 'verse-highlight' : ''}`}
          >
            <div className="flex justify-end">
              <button
                onClick={() => startChatForVerse(verse)}
                className="m-btn m-btn-outlined text-sm sm:absolute sm:top-2 sm:right-2"
                aria-label="Ask AI about this verse"
              >
                Ask AI
              </button>
            </div>
            
            {/* Devanagari Text with clickable words */}
            <div className="mb-4">
              <div className={`${isFirst ? 'text-[1.05rem] sm:text-[1.15rem] leading-loose text-accent' : 'text-[1.25rem] leading-loose text-accent'} whitespace-pre-line`}>
                {verse.devanagari_text.split(/(\s+|\n)/).map((part, index) => {
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
            </div>
            
            {/* Transliteration (increased font size) with clickable words */}
            <div className="mb-3">
              <div className="text-[1rem] sm:text-[1.1rem] text-gray-500 font-light leading-relaxed">
                {verse.padapatha_text.split(' ').map((word, index) => (
                  <span key={index}>
                    <button 
                      onClick={() => openDictionary(word.trim())} 
                      className="hover:text-gray-700 hover:underline cursor-pointer"
                    >
                      {word}
                    </button>
                    {index < verse.padapatha_text.split(' ').length - 1 && ' '}
                  </span>
                ))}
              </div>
            </div>
            
            {/* Translation */}
            <div className="max-w-none whitespace-pre-line text-sm sm:text-base mb-3">
              {verse.griffith_translation}
            </div>
            
            <div className="text-right text-xs text-muted mt-2">{verse.verse_number}</div>
          </article>
          );
        })}
      </section>

      {chatOpen && (
        <div 
          className="fixed inset-0 z-50 flex items-start justify-center p-4"
          style={{ 
            backgroundColor: 'rgba(0, 0, 0, 0.1) !important',
            background: 'rgba(0, 0, 0, 0.1) !important',
            paddingTop: '40px',
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
              setChatOpen(false);
              try { document.documentElement.classList.remove('no-scroll'); document.body.classList.remove('no-scroll'); } catch {}
            }
          }}
        >
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full h-[80vh] flex flex-col animate-in fade-in-0 zoom-in-95 duration-300 overflow-hidden" style={{ width: '100%' }}>
            <div className="flex items-center justify-between p-6 border-b border-gray-100 flex-shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                  <FontAwesomeIcon icon={faRobot} className="text-blue-600 text-lg" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">Ask AI · Verse {chatRef}</h2>
                  <p className="text-sm text-gray-500">Ask questions about this verse</p>
                </div>
              </div>
              <button 
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  e.nativeEvent.stopImmediatePropagation();
                  setChatOpen(false);
                  try { document.documentElement.classList.remove('no-scroll'); document.body.classList.remove('no-scroll'); } catch {}
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
            <div ref={chatListRef} className="flex-1 p-6 overflow-y-auto space-y-4 min-h-0">
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
                    onKeyDown={handleChatKey}
                    rows={1}
                    className="w-full px-4 py-3 pr-14 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 resize-none overflow-y-auto"
                    placeholder="Add your question after the context above..."
                    style={{ minHeight: '48px', maxHeight: '120px' }}
                  />
                  <button 
                    onClick={() => void askChat()} 
                    disabled={!chatInput.trim() || chatLoading}
                    className="absolute right-6 bottom-2 w-8 h-8 rounded-full bg-blue-100 hover:bg-blue-200 disabled:bg-gray-300 disabled:cursor-not-allowed text-blue-600 hover:text-blue-700 transition-colors duration-200 flex items-center justify-center"
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
      )}

      {dictOpen && (
        <div
          className="fixed inset-0 z-50 flex items-start justify-center p-4"
          style={{
            backgroundColor: 'rgba(0, 0, 0, 0.1) !important',
            background: 'rgba(0, 0, 0, 0.1) !important',
            paddingTop: '40px',
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
              // Unlock background scroll when modal closes
              try {
                document.documentElement.classList.remove('no-scroll');
                document.body.classList.remove('no-scroll');
              } catch {}
            }
          }}
        >
          <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[80vh] overflow-hidden animate-in fade-in-0 zoom-in-95 duration-300">
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                  <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                  </svg>
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">Dictionary</h2>
                  <p className="text-sm text-gray-500">Definition for &quot;{dictWord}&quot;</p>
                </div>
              </div>
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  e.nativeEvent.stopImmediatePropagation();
                  setDictOpen(false);
                  // Unlock background scroll when modal closes
                  try {
                    document.documentElement.classList.remove('no-scroll');
                    document.body.classList.remove('no-scroll');
                  } catch {}
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
                <div>
                  <div className="m-embed-container" ref={dictContainerRef}>
                    {isMobile ? (
                      <iframe className="embedded-frame" src={dictUrl} title="Dictionary" />
                    ) : (
                      <div style={{ width: '1024px', height: dictWrapperHeight ? `${dictWrapperHeight}px` : '800px', transform: `scale(${dictScale})`, transformOrigin: 'top left' }}>
                        <iframe className="embedded-frame" src={dictUrl} title="Dictionary" />
                      </div>
                    )}
                  </div>
                  <div className="mt-4 p-3 bg-green-50 rounded-lg text-sm text-green-700">
                    If the page fails to load here, use &quot;Open&quot; to view in a new tab.
                  </div>
                  <div className="mt-3 flex justify-end">
                    <a 
                      href={dictUrl} 
                      target="_blank" 
                      rel="noreferrer noopener" 
                      className="inline-flex items-center gap-2 px-4 py-2 bg-green-100 hover:bg-green-200 text-green-700 hover:text-green-800 rounded-lg text-sm font-medium transition-colors duration-200"
                    >
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd"/>
                      </svg>
                      Open in New Tab
                    </a>
                  </div>
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

      {/* Audio footer */}
      <div className="m-audiofooter">
        <div className="container mx-auto px-3 py-2">
          <div className="flex items-center gap-2">
            <button
              onClick={toggleAudio}
              className="m-btn m-btn-outlined text-sm min-w-[2.5rem] sm:min-w-[6rem]"
              disabled={audioState === 'loading'}
              aria-label={audioButtonLabel}
            >
              <FontAwesomeIcon icon={audioButtonIcon} />
              <span className="hidden sm:inline ml-2">{audioButtonLabel}</span>
            </button>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between text-[11px] text-[color:var(--muted)] mb-1">
                <div className="truncate">Now playing: <span className="font-medium text-[color:var(--olive-green)]">Verse {Number.isInteger(currentVerseIndex) && currentVerseIndex !== null ? hymn.verses[currentVerseIndex]?.verse_number : '-'}</span></div>
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
          <audio ref={audioRef} src={hymn.audio_url} />
        </div>
      </div>

    </div>
  );
}
