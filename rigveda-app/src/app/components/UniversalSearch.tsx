'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSearch, faSpinner } from '@fortawesome/free-solid-svg-icons';
import type { RigvedaData } from '../../types/rigveda';

type SearchResult = {
  mandala: number;
  sukta: number;
  verse?: string;
  type: 'mandala' | 'hymn' | 'verse';
  title: string;
  subtitle: string;
  matchField: string;
  snippet?: string;
  matchedText?: string;
};

export default function UniversalSearch({ inModal = false, onResultClick }: { inModal?: boolean, onResultClick?: () => void } = {}) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [allResults, setAllResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [displayedCount, setDisplayedCount] = useState(50);
  const [activeFilter, setActiveFilter] = useState<'all' | 'hymn' | 'translation' | 'transliteration'>('all');
  const [scrollPositions, setScrollPositions] = useState<Record<string, number>>({});
  const [displayedCounts, setDisplayedCounts] = useState<Record<string, number>>({});
  const [isInputFocused, setIsInputFocused] = useState(false);
  const [searchTimeout, setSearchTimeout] = useState<NodeJS.Timeout | null>(null);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (searchTimeout) {
        clearTimeout(searchTimeout);
      }
    };
  }, [searchTimeout]);

  // Function to normalize text for better matching
  const normalizeText = (text: string): string => {
    return text
      .toLowerCase()
      // Remove diacritical marks for Sanskrit
      .replace(/[āáàâä]/g, 'a')
      .replace(/[īíìîï]/g, 'i')
      .replace(/[ūúùûü]/g, 'u')
      .replace(/[ṛṝ]/g, 'r')  // r with dot below
      .replace(/[ḷḹ]/g, 'l')  // l with dot below
      .replace(/[ēéèêë]/g, 'e')
      .replace(/[ōóòôö]/g, 'o')
      .replace(/[ṃ]/g, 'm')   // m with dot below
      .replace(/[ḥ]/g, 'h')   // h with dot below
      .replace(/[ṅ]/g, 'n')   // n with dot above
      .replace(/[ñ]/g, 'n')   // n with tilde
      .replace(/[ṭ]/g, 't')   // t with dot below
      .replace(/[ḍ]/g, 'd')   // d with dot below
      .replace(/[ṇ]/g, 'n')   // n with dot below
      .replace(/[ś]/g, 's')   // s with acute
      .replace(/[ṣ]/g, 's')   // s with dot below
      .replace(/[ç]/g, 'c')   // c with cedilla
      .replace(/[ṁ]/g, 'm')   // m with dot above
      .replace(/[Ṁ]/g, 'm')   // M with dot above
      .replace(/[Ṃ]/g, 'm')   // M with dot below
      .replace(/[Ṛ]/g, 'r')   // R with dot below
      .replace(/[Ṟ]/g, 'r')   // R with line below
      .replace(/[Ḷ]/g, 'l')   // L with dot below
      .replace(/[Ḹ]/g, 'l')   // L with line below
      .replace(/[Ṭ]/g, 't')   // T with dot below
      .replace(/[Ḍ]/g, 'd')   // D with dot below
      .replace(/[Ṇ]/g, 'n')   // N with dot below
      .replace(/[Ś]/g, 's')   // S with acute
      .replace(/[Ṣ]/g, 's')   // S with dot below
      .replace(/[Ḥ]/g, 'h')   // H with dot below
      .replace(/[ṅ]/g, 'n')   // n with dot above (lowercase)
      .replace(/[Ṇ]/g, 'n')   // N with dot below
      // Remove extra spaces and normalize
      .replace(/\s+/g, ' ')
      .trim();
  };

  // Function to check if text matches query (with normalization)
  const textMatches = (text: string, searchQuery: string): boolean => {
    const normalizedText = normalizeText(text);
    const normalizedQuery = normalizeText(searchQuery);
    const matches = normalizedText.includes(normalizedQuery);
    
    
    return matches;
  };

  // Function to highlight matched text
  const highlightText = (text: string, searchQuery: string) => {
    if (!searchQuery.trim()) return <span>{text}</span>;
    
    const normalizedText = normalizeText(text);
    const normalizedQuery = normalizeText(searchQuery);
    const index = normalizedText.indexOf(normalizedQuery);
    
    if (index === -1) return <span>{text}</span>;
    
    // Find the actual match in the original text by searching for the query
    const originalIndex = text.toLowerCase().indexOf(searchQuery.toLowerCase());
    if (originalIndex === -1) {
      // If exact match not found, use the normalized index as fallback
      const before = text.substring(0, index);
      const match = text.substring(index, index + searchQuery.length);
      const after = text.substring(index + searchQuery.length);
      
      return (
        <span>
          {before}
          <mark className="bg-yellow-300 text-yellow-900 px-1 rounded font-medium shadow-sm">{match}</mark>
          {after}
        </span>
      );
    }
    
    const before = text.substring(0, originalIndex);
    const match = text.substring(originalIndex, originalIndex + searchQuery.length);
    const after = text.substring(originalIndex + searchQuery.length);
    
    return (
      <span>
        {before}
        <mark className="bg-yellow-300 text-yellow-900 px-1 rounded font-medium shadow-sm">{match}</mark>
        {after}
      </span>
    );
  };

  // Function to highlight specific matched text in subtitle
  const highlightSubtitle = (result: SearchResult, searchQuery: string) => {
    if (!searchQuery.trim()) return <span>{result.subtitle}</span>;
    
    // For verse results with snippets, show the snippet with highlighting
    if (result.snippet && (result.matchField === 'devanagari text' || result.matchField === 'transliteration' || result.matchField === 'translation')) {
      return (
        <span>
          {result.subtitle}
          <div className="text-xs text-gray-600 mt-1 italic">
            {highlightText(result.snippet, searchQuery)}
          </div>
        </span>
      );
    }
    
    // If we have matchedText, only highlight that specific part
    if (result.matchedText) {
      const parts = result.subtitle.split(' • ');
      const addressee = parts[0];
      const groupName = parts[1];
      
      if (result.matchField === 'addressee') {
        return (
          <span>
            {highlightText(addressee, searchQuery)} • {groupName}
          </span>
        );
      } else if (result.matchField === 'group name') {
        return (
          <span>
            {addressee} • {highlightText(groupName, searchQuery)}
          </span>
        );
      }
      // Fallback to normal highlighting
      return highlightText(result.subtitle, searchQuery);
    }
    
    // Fallback to normal highlighting
    return highlightText(result.subtitle, searchQuery);
  };

  // Function to create text snippet with matching word
  const createSnippet = (text: string, searchQuery: string, maxLength: number = 150): string => {
    if (!searchQuery.trim()) return text.substring(0, maxLength) + (text.length > maxLength ? '...' : '');
    
    const normalizedText = normalizeText(text);
    const normalizedQuery = normalizeText(searchQuery);
    const index = normalizedText.indexOf(normalizedQuery);
    
    if (index === -1) return text.substring(0, maxLength) + (text.length > maxLength ? '...' : '');
    
    // Calculate start and end positions to center the match
    const matchLength = searchQuery.length;
    const halfLength = Math.floor((maxLength - matchLength) / 2);
    let start = Math.max(0, index - halfLength);
    let end = Math.min(text.length, index + matchLength + halfLength);
    
    // Adjust if we're near the beginning or end
    if (start === 0) {
      end = Math.min(text.length, maxLength);
    } else if (end === text.length) {
      start = Math.max(0, text.length - maxLength);
    }
    
    const snippet = text.substring(start, end);
    const prefix = start > 0 ? '...' : '';
    const suffix = end < text.length ? '...' : '';
    
    return prefix + snippet + suffix;
  };


  const filterResults = (results: SearchResult[], filter: string) => {
    if (filter === 'all') return results;
    return results.filter(result => {
      if (filter === 'hymn') {
        return result.type === 'hymn' || result.type === 'mandala';
      } else if (filter === 'translation') {
        return result.matchField === 'translation';
      } else if (filter === 'transliteration') {
        return result.matchField === 'transliteration';
      }
      return true;
    });
  };

  const loadMoreResults = () => {
    const newCount = displayedCount + 50;
    setDisplayedCount(newCount);
    setDisplayedCounts(prev => ({ ...prev, [activeFilter]: newCount }));
    const filteredResults = filterResults(allResults, activeFilter);
    setResults(filteredResults.slice(0, newCount));
  };

  const handleFilterChange = (filter: 'all' | 'hymn' | 'translation' | 'transliteration') => {
    // Save current scroll position and displayed count
    const dropdown = document.querySelector('.search-results-dropdown');
    if (dropdown) {
      setScrollPositions(prev => ({ ...prev, [activeFilter]: dropdown.scrollTop }));
    }
    setDisplayedCounts(prev => ({ ...prev, [activeFilter]: displayedCount }));
    
    // Switch to new filter
    setActiveFilter(filter);
    
    // Restore or set default values for the new filter
    const savedCount = displayedCounts[filter] || 50;
    const savedScrollPosition = scrollPositions[filter] || 0;
    
    setDisplayedCount(savedCount);
    const filteredResults = filterResults(allResults, filter);
    setResults(filteredResults.slice(0, savedCount));
    
    // Restore scroll position
    setTimeout(() => {
      if (dropdown) {
        dropdown.scrollTop = savedScrollPosition;
      }
    }, 0);
  };

  const searchData = async (searchQuery: string) => {
    // Ensure searchQuery is a string
    if (typeof searchQuery !== 'string') {
      console.error('searchData called with non-string:', searchQuery);
      return;
    }
    
    if (!searchQuery.trim()) {
      setResults([]);
      setAllResults([]);
      setShowResults(false);
      setDisplayedCount(50);
      setActiveFilter('all');
      setScrollPositions({});
      setDisplayedCounts({});
      return;
    }

    setLoading(true);
    setDisplayedCount(50);
    setActiveFilter('all');
    setScrollPositions({});
    setDisplayedCounts({});
    try {
      // Load data from API instead of direct import
      const response = await fetch('/api/search-data');
      if (!response.ok) {
        throw new Error(`Failed to load data: ${response.status}`);
      }
      const data = await response.json() as RigvedaData;
      const searchResults: SearchResult[] = [];
      
      
      if (!data || !data.mandalas) {
        console.error('Invalid data structure:', data);
        setResults([]);
        setAllResults([]);
        setShowResults(false);
        return;
      }
      
      

      // Search through all mandalas
      try {
        data.mandalas.forEach((mandala) => {
        // Search mandala number - show mandala + all its hymns
        const mandalaNumberStr = mandala.mandala_number.toString();
        const mandalaText = `mandala ${mandalaNumberStr}`;
        const matches = textMatches(mandalaNumberStr, searchQuery) || textMatches(mandalaText, searchQuery);
        
        if (matches) {
          // Add the mandala itself
          searchResults.push({
            mandala: mandala.mandala_number,
            sukta: 0,
            type: 'mandala',
            title: `Mandala ${mandala.mandala_number}`,
            subtitle: `${mandala.hymns.length} hymns`,
            matchField: 'mandala number'
          });
          
          // Add all hymns from this mandala
          mandala.hymns.forEach((hymn) => {
            searchResults.push({
              mandala: mandala.mandala_number,
              sukta: hymn.hymn_number,
              type: 'hymn',
              title: `Mandala ${mandala.mandala_number} • Hymn ${hymn.hymn_number}`,
              subtitle: `${hymn.addressee} • ${hymn.group_name}`,
              matchField: 'mandala number'
            });
          });
        }

        // Search through hymns
        mandala.hymns.forEach((hymn) => {
          // Search hymn number
          const hymnNumberStr = hymn.hymn_number.toString();
          const hymnText = `hymn ${hymnNumberStr}`;
          const hymnMatches = textMatches(hymnNumberStr, searchQuery) || textMatches(hymnText, searchQuery);
          if (hymnMatches) {
            searchResults.push({
              mandala: mandala.mandala_number,
              sukta: hymn.hymn_number,
              type: 'hymn',
              title: `Mandala ${mandala.mandala_number} • Hymn ${hymn.hymn_number}`,
              subtitle: `${hymn.addressee} • ${hymn.group_name}`,
              matchField: 'hymn number'
            });
          }

          // Search addressee
          if (textMatches(hymn.addressee, searchQuery)) {
            searchResults.push({
              mandala: mandala.mandala_number,
              sukta: hymn.hymn_number,
              type: 'hymn',
              title: `Mandala ${mandala.mandala_number} • Hymn ${hymn.hymn_number}`,
              subtitle: `${hymn.addressee} • ${hymn.group_name}`,
              matchField: 'addressee',
              matchedText: hymn.addressee
            });
          }

          // Search group name
          if (textMatches(hymn.group_name, searchQuery)) {
            searchResults.push({
              mandala: mandala.mandala_number,
              sukta: hymn.hymn_number,
              type: 'hymn',
              title: `Mandala ${mandala.mandala_number} • Hymn ${hymn.hymn_number}`,
              subtitle: `${hymn.addressee} • ${hymn.group_name}`,
              matchField: 'group name',
              matchedText: hymn.group_name
            });
          }

          // Search verses
          hymn.verses.forEach((verse) => {
            // Search verse number
            if (textMatches(verse.verse_number, searchQuery)) {
              searchResults.push({
                mandala: mandala.mandala_number,
                sukta: hymn.hymn_number,
                verse: verse.verse_number,
                type: 'verse',
                title: `Mandala ${mandala.mandala_number} • Hymn ${hymn.hymn_number} • Verse ${verse.verse_number}`,
                subtitle: `${hymn.addressee} • ${hymn.group_name}`,
                matchField: 'verse number'
              });
            }

            // Search in devanagari text
            if (textMatches(verse.devanagari_text, searchQuery)) {
              searchResults.push({
                mandala: mandala.mandala_number,
                sukta: hymn.hymn_number,
                verse: verse.verse_number,
                type: 'verse',
                title: `Mandala ${mandala.mandala_number} • Hymn ${hymn.hymn_number} • Verse ${verse.verse_number}`,
                subtitle: `${hymn.addressee} • ${hymn.group_name}`,
                matchField: 'devanagari text',
                matchedText: verse.devanagari_text,
                snippet: createSnippet(verse.devanagari_text, searchQuery)
              });
            }

            // Search in transliteration
            if (textMatches(verse.padapatha_text, searchQuery)) {
              searchResults.push({
                mandala: mandala.mandala_number,
                sukta: hymn.hymn_number,
                verse: verse.verse_number,
                type: 'verse',
                title: `Mandala ${mandala.mandala_number} • Hymn ${hymn.hymn_number} • Verse ${verse.verse_number}`,
                subtitle: `${hymn.addressee} • ${hymn.group_name}`,
                matchField: 'transliteration',
                matchedText: verse.padapatha_text,
                snippet: createSnippet(verse.padapatha_text, searchQuery)
              });
            }

            // Search in translation
            if (textMatches(verse.griffith_translation, searchQuery)) {
              searchResults.push({
                mandala: mandala.mandala_number,
                sukta: hymn.hymn_number,
                verse: verse.verse_number,
                type: 'verse',
                title: `Mandala ${mandala.mandala_number} • Hymn ${hymn.hymn_number} • Verse ${verse.verse_number}`,
                subtitle: `${hymn.addressee} • ${hymn.group_name}`,
                matchField: 'translation',
                matchedText: verse.griffith_translation,
                snippet: createSnippet(verse.griffith_translation, searchQuery)
              });
            }
          });
        });
      });
      } catch (forEachError) {
        console.error('Error in forEach loop:', forEachError);
        throw forEachError;
      }

      // Remove duplicates but keep different matchField values
      const uniqueResults = searchResults.filter((result, index, self) => 
        index === self.findIndex(r => 
          r.mandala === result.mandala && 
          r.sukta === result.sukta && 
          r.verse === result.verse &&
          r.matchField === result.matchField
        )
      )

      
      setAllResults(uniqueResults);
      setResults(uniqueResults.slice(0, displayedCount));
      setShowResults(true);
    } catch (error) {
      console.error('Search error:', error);
      console.error('Error details:', {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
        error: error
      });
      setResults([]);
      setAllResults([]);
      setShowResults(false);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setQuery(value);
    
    // Clear previous timeout
    if (searchTimeout) {
      clearTimeout(searchTimeout);
    }
    
    // Debounce search
    const timeoutId = setTimeout(() => {
      searchData(value);
    }, 300);
    
    setSearchTimeout(timeoutId);
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      searchData(query);
    }
  };

  const handleSearchClick = () => {
    searchData(query);
  };

  const getResultUrl = (result: SearchResult) => {
    if (result.type === 'mandala') {
      return `/${result.mandala}`;
    } else if (result.type === 'hymn') {
      return `/${result.mandala}/${result.sukta}`;
    } else if (result.type === 'verse' && result.verse) {
      return `/${result.mandala}/${result.sukta}#verse-${result.verse}`;
    }
    return '#';
  };

  // Function to scroll to verse and flash highlight
  const scrollToVerse = (mandala: number, sukta: number, verse: string) => {
    // Close modal if open
    if (inModal && onResultClick) {
      onResultClick();
    }
    
    // Navigate to the hymn page first
    const url = `/${mandala}/${sukta}#verse-${verse}`;
    window.location.href = url;
    
    // The scroll and flash will be handled by the HymnClient component
    // when the page loads with the hash fragment
  };

  return (
    <div className="relative">
      <div className="m-field relative">
        <input
          type="text"
          value={query}
          onChange={handleSearch}
          onKeyPress={handleKeyPress}
          onFocus={() => setIsInputFocused(true)}
          onBlur={() => setIsInputFocused(false)}
          className="w-full px-4 py-3 pr-12 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white shadow-sm"
          placeholder="Search hymns, verses, deities, addressees, groups..."
          style={{ 
            fontSize: 'clamp(14px, 4vw, 16px)',
            paddingRight: '3.5rem'
          }}
        />
        <div className="absolute right-2 top-1/2 -translate-y-1/2">
          {loading ? (
            <FontAwesomeIcon icon={faSpinner} className="animate-spin text-gray-400" />
          ) : (
            <button
              onClick={handleSearchClick}
              className="w-8 h-8 rounded-full bg-blue-100 hover:bg-blue-200 text-blue-600 hover:text-blue-700 transition-all duration-200 flex items-center justify-center"
              type="button"
            >
              <FontAwesomeIcon icon={faSearch} className="text-sm" />
            </button>
          )}
        </div>
      </div>

      {showResults && (
        <div className={`search-results-dropdown ${inModal ? 'relative mt-2' : 'absolute top-full left-0 right-0 mt-2'} bg-white border border-gray-200 rounded-lg shadow-lg max-h-96 overflow-y-auto ${inModal ? 'z-[9999]' : 'z-50'}`} style={{ colorScheme: 'light', WebkitOverflowScrolling: 'touch' }}>
          <div>
            {/* Filter Bar - Always visible when there are search results */}
            <div className="sticky top-0 bg-white px-4 py-3 border-b border-gray-100 z-10">
              <div className="flex space-x-2">
                <button
                  onClick={() => handleFilterChange('all')}
                  className={`px-3 py-1 text-xs rounded-full transition-colors ${
                    activeFilter === 'all'
                      ? 'bg-blue-100 text-blue-700'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  All
                </button>
                <button
                  onClick={() => handleFilterChange('hymn')}
                  className={`px-3 py-1 text-xs rounded-full transition-colors ${
                    activeFilter === 'hymn'
                      ? 'bg-blue-100 text-blue-700'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  Hymn
                </button>
                <button
                  onClick={() => handleFilterChange('translation')}
                  className={`px-3 py-1 text-xs rounded-full transition-colors ${
                    activeFilter === 'translation'
                      ? 'bg-blue-100 text-blue-700'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  Translation
                </button>
                <button
                  onClick={() => handleFilterChange('transliteration')}
                  className={`px-3 py-1 text-xs rounded-full transition-colors ${
                    activeFilter === 'transliteration'
                      ? 'bg-blue-100 text-blue-700'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  Transliteration
                </button>
              </div>
            </div>
            
            {/* Results Content */}
            {results.length === 0 ? (
              <div className="p-4 text-left text-gray-500">
                No results found for &quot;{query}&quot; in {activeFilter === 'all' ? 'all categories' : activeFilter}
              </div>
            ) : (
              <div className="py-2">
              {results.map((result, index) => (
                <Link
                  key={index}
                  href={getResultUrl(result)}
                  className="block px-4 py-3 hover:bg-gray-50 border-b border-gray-100 last:border-b-0 text-left"
                  onClick={(e) => {
                    e.preventDefault();
                    if (result.type === 'verse' && result.verse) {
                      scrollToVerse(result.mandala, result.sukta, result.verse);
                    } else {
                      // For non-verse results, use normal navigation
                      window.location.href = getResultUrl(result);
                    }
                    if (inModal && onResultClick) {
                      onResultClick();
                    }
                  }}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 text-left">
                      <div className="font-medium text-gray-900 text-left">
                        {highlightText(result.title, query)}
                      </div>
                      <div className="text-sm text-gray-500 text-left">
                        {highlightSubtitle(result, query)}
                      </div>
                    </div>
                    <div className="text-xs text-gray-400 capitalize ml-2 flex-shrink-0">
                      {result.matchField}
                    </div>
                  </div>
                </Link>
              ))}
              
              {/* Load More Button */}
              {filterResults(allResults, activeFilter).length > results.length && (
                <div className="px-4 py-3 border-t border-gray-100">
                  <button
                    onClick={loadMoreResults}
                    className="w-full text-center text-sm text-blue-600 hover:text-blue-800 font-medium"
                  >
                    Load More ({filterResults(allResults, activeFilter).length - results.length} more results)
                  </button>
                </div>
              )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Click outside to close */}
      {showResults && !isInputFocused && (
        <div 
          className="fixed inset-0 z-40" 
          onClick={() => setShowResults(false)}
        />
      )}
    </div>
  );
}
