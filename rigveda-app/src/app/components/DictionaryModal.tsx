'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTimes, faBook, faSpinner, faExternalLinkAlt } from '@fortawesome/free-solid-svg-icons';

type DictionaryResult = {
  sanskrit: string;
  english: string;
  transliteration?: string;
  grammar?: string;
  etymology?: string;
  source?: string;
  dictionary?: string;
  contextualUsage?: string;
  grammaticalInfo?: string;
  derivedWords?: string;
  usageNote?: string;
  origin?: string;
};

type DictionaryModalProps = {
  open: boolean;
  onClose: () => void;
  initialQuery?: string;
};

type TabType = 'ai' | 'learnsanskrit';

export default function DictionaryModal({ open, onClose, initialQuery = '' }: DictionaryModalProps) {
  const [query, setQuery] = useState(initialQuery);
  const [results, setResults] = useState<DictionaryResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchHistory, setSearchHistory] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState<TabType>('learnsanskrit');
  const inputRef = useRef<HTMLInputElement>(null);

  // Load search history from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem('sanskrit_dictionary_history');
      if (stored) {
        setSearchHistory(JSON.parse(stored));
      }
    } catch (error) {
      console.warn('Failed to load search history:', error);
    }
  }, []);

  // Save search history to localStorage
  const saveSearchHistory = (newQuery: string) => {
    if (!newQuery.trim()) return;
    const updatedHistory = [newQuery, ...searchHistory.filter(q => q !== newQuery)].slice(0, 10);
    setSearchHistory(updatedHistory);
    try {
      localStorage.setItem('sanskrit_dictionary_history', JSON.stringify(updatedHistory));
    } catch (error) {
      console.warn('Failed to save search history:', error);
    }
  };

  const searchDictionary = useCallback(async (searchQuery: string) => {
    if (!searchQuery.trim()) {
      setResults([]);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/dictionary?word=${encodeURIComponent(searchQuery)}`);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `API request failed: ${response.status}`);
      }

      const data = await response.json();
      
      if (Array.isArray(data)) {
        setResults(data);
        saveSearchHistory(searchQuery);
      } else {
        setResults([]);
      }
    } catch (err) {
      console.error('Dictionary search error:', err);
      setError(err instanceof Error ? err.message : 'Failed to search dictionary');
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, [saveSearchHistory]);

  // Focus input when modal opens
  useEffect(() => {
    if (open && inputRef.current) {
      setTimeout(() => {
        inputRef.current?.focus();
        if (initialQuery) {
          setQuery(initialQuery);
          searchDictionary(initialQuery);
        }
      }, 100);
    }
  }, [open, initialQuery, searchDictionary]);

  // Lock/unlock page scroll when modal is open
  useEffect(() => {
    if (open) {
      try {
        document.body.classList.add('no-scroll');
        document.body.style.overflow = 'hidden';
      } catch {}
    } else {
      try {
        document.body.classList.remove('no-scroll');
        document.body.style.overflow = '';
      } catch {}
    }
    return () => {
      try {
        document.body.classList.remove('no-scroll');
        document.body.style.overflow = '';
      } catch {}
    };
  }, [open]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    searchDictionary(query);
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      searchDictionary(query);
    }
  };

  const clearSearch = () => {
    setQuery('');
    setResults([]);
    setError(null);
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  const openLearnSanskrit = () => {
    const searchUrl = query 
      ? `https://www.learnsanskrit.cc/search?q=${encodeURIComponent(query)}`
      : 'https://www.learnsanskrit.cc/';
    window.open(searchUrl, '_blank', 'noopener,noreferrer');
  };


  return (
    <div 
      className={`fixed inset-0 z-50 flex items-start justify-center p-4 ${open ? 'block' : 'hidden'}`}
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
          onClose();
        }
      }}
    >
      <div className="bg-white rounded-2xl shadow-2xl max-w-5xl w-full max-h-[85vh] overflow-hidden animate-in fade-in-0 zoom-in-95 duration-300 flex flex-col" style={{ width: '100%', minHeight: '70vh' }}>
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-100 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
              <FontAwesomeIcon icon={faBook} className="text-green-600 text-lg" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Sanskrit Dictionary</h2>
              <p className="text-sm text-gray-500">Search Sanskrit words and meanings</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button 
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onClose();
              }} 
              className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-500 hover:text-gray-700 transition-colors duration-200" 
              aria-label="Close"
              type="button"
            >
              <FontAwesomeIcon icon={faTimes} className="text-sm" />
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200">
          <div className="flex-1 relative">
            <button
              onClick={() => setActiveTab('learnsanskrit')}
              className={`w-full px-6 py-3 text-sm font-medium transition-colors duration-200 ${
                activeTab === 'learnsanskrit'
                  ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
              }`}
            >
              <div className="flex items-center justify-center gap-2">
                <FontAwesomeIcon icon={faBook} className="text-sm" />
                <span>LearnSanskrit</span>
              </div>
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                openLearnSanskrit();
              }}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-1 hover:bg-blue-100 rounded transition-colors duration-200"
              title="Open in New Tab"
            >
              <FontAwesomeIcon icon={faExternalLinkAlt} className="text-xs" />
            </button>
          </div>
          <button
            onClick={() => setActiveTab('ai')}
            className={`flex-1 px-6 py-3 text-sm font-medium transition-colors duration-200 ${
              activeTab === 'ai'
                ? 'text-green-600 border-b-2 border-green-600 bg-green-50'
                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
            }`}
          >
            <div className="flex items-center justify-center gap-2">
              <FontAwesomeIcon icon={faBook} className="text-sm" />
              <span>AI Dictionary</span>
            </div>
          </button>
        </div>

        {/* Search Form - Only show for AI tab */}
        {activeTab === 'ai' && (
          <div className="p-6 border-b border-gray-100 flex-shrink-0">
            <form onSubmit={handleSearch} className="flex gap-3">
              <div className="flex-1 relative">
                <input
                  ref={inputRef}
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyPress={handleKeyPress}
                  className="w-full px-4 py-3 pr-12 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200"
                  placeholder="Enter Sanskrit word, transliteration, or English word..."
                  autoComplete="off"
                />
                {query && (
                  <button
                    type="button"
                    onClick={clearSearch}
                    className="absolute right-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-500 hover:text-gray-700 transition-colors duration-200"
                    aria-label="Clear search"
                  >
                    <FontAwesomeIcon icon={faTimes} className="text-xs" />
                  </button>
                )}
              </div>
              <button
                type="submit"
                disabled={!query.trim() || loading}
                className="px-6 py-3 bg-green-600 hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-medium rounded-xl transition-colors duration-200 flex items-center gap-2"
              >
                {loading ? (
                  <FontAwesomeIcon icon={faSpinner} className="animate-spin" />
                ) : (
                  <FontAwesomeIcon icon={faBook} />
                )}
                <span className="hidden sm:inline">Search</span>
              </button>
            </form>

            {/* Search History */}
            {searchHistory.length > 0 && !query && (
              <div className="mt-4">
                <p className="text-sm text-gray-500 mb-2">Recent searches:</p>
                <div className="flex flex-wrap gap-2">
                  {searchHistory.slice(0, 5).map((term, index) => (
                    <button
                      key={index}
                      onClick={() => {
                        setQuery(term);
                        searchDictionary(term);
                      }}
                      className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-full transition-colors duration-200"
                    >
                      {term}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Content */}
        <div className={`flex-1 min-h-0 ${activeTab === 'learnsanskrit' ? 'overflow-hidden' : 'overflow-y-auto p-6'}`}>
          {activeTab === 'ai' ? (
            <>
              {loading && (
                <div className="flex items-center justify-center py-8">
                  <div className="flex items-center gap-3 text-gray-500">
                    <FontAwesomeIcon icon={faSpinner} className="animate-spin" />
                    <span>Searching AI dictionary...</span>
                  </div>
                </div>
              )}

              {error && (
                <div className="flex items-center gap-2 p-4 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd"/>
                  </svg>
                  <div>
                    <p className="font-medium">{error}</p>
                    <p className="text-xs mt-1">
                      Please try again or contact support if the issue persists.
                    </p>
                  </div>
                </div>
              )}

              {!loading && !error && results.length === 0 && query && (
                <div className="text-center py-8">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <FontAwesomeIcon icon={faBook} className="text-gray-400 text-xl" />
                  </div>
                  <p className="text-gray-500">No results found for &quot;{query}&quot;</p>
                  <p className="text-sm text-gray-400 mt-1">Try a different spelling or search term</p>
                </div>
              )}

              {!loading && !error && results.length > 0 && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-gray-900">
                      Results ({results.length})
                    </h3>
                  </div>
                  

                  {results.some(result => result.source === 'AI Sanskrit Scholar') && (
                    <div className="bg-purple-50 border border-purple-200 rounded-lg p-3 text-sm text-purple-700">
                      <div className="flex items-center gap-2">
                        <FontAwesomeIcon icon={faBook} className="text-purple-600" />
                        <span className="font-medium">AI Sanskrit Scholar</span>
                      </div>
                      <p className="mt-1 text-xs">
                        These results are generated by AI with expertise in Sanskrit and Vedic literature.
                      </p>
                    </div>
                  )}
                  
                  {results.map((result, index) => (
                    <div key={index} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors duration-200">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h4 className="text-lg font-semibold text-gray-900">
                              {result.sanskrit}
                            </h4>
                            {result.transliteration && (
                              <span className="text-sm text-gray-500 italic">
                                {result.transliteration}
                              </span>
                            )}
                            {result.origin && (
                              <span className="text-xs px-2 py-1 bg-blue-100 text-blue-600 rounded-full">
                                {result.origin}
                              </span>
                            )}
                          </div>
                          <p className="text-gray-700 mb-2">{result.english}</p>
                          {result.grammar && (
                            <p className="text-sm text-gray-500">
                              <span className="font-medium">Grammar:</span> {result.grammar}
                            </p>
                          )}
                          {result.contextualUsage && (
                            <p className="text-sm text-gray-500">
                              <span className="font-medium">Contextual Usage:</span> {result.contextualUsage}
                            </p>
                          )}
                          {result.grammaticalInfo && (
                            <p className="text-sm text-gray-500">
                              <span className="font-medium">Grammatical Info:</span> {result.grammaticalInfo}
                            </p>
                          )}
                          {result.etymology && (
                            <p className="text-sm text-gray-500">
                              <span className="font-medium">Etymology:</span> {result.etymology}
                            </p>
                          )}
                          {result.derivedWords && (
                            <p className="text-sm text-gray-500">
                              <span className="font-medium">Derived/Related Words:</span> {result.derivedWords}
                            </p>
                          )}
                          {result.usageNote && (
                            <p className="text-sm text-gray-500">
                              <span className="font-medium">Usage Note:</span> {result.usageNote}
                            </p>
                          )}
                          {result.source && (
                            <div className="mt-2 flex items-center gap-2">
                              <span className="text-xs text-gray-400">
                                Source: {result.source}
                              </span>
                              {result.dictionary && (
                                <span className="text-xs px-2 py-1 bg-purple-100 text-purple-600 rounded-full">
                                  {result.dictionary.toUpperCase()}
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {!loading && !error && !query && (
                <div className="text-center py-8">
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <FontAwesomeIcon icon={faBook} className="text-green-600 text-xl" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">AI Sanskrit Dictionary</h3>

                </div>
              )}
            </>
          ) : (
            <div className="h-full w-full">
              <iframe
                src="https://www.learnsanskrit.cc/"
                className="w-full h-full border-0"
                title="LearnSanskrit Dictionary"
                sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-popups-to-escape-sandbox"
                style={{ minHeight: '600px' }}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
