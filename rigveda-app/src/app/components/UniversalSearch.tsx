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
};

export default function UniversalSearch({ inModal = false }: { inModal?: boolean } = {}) {
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

  // Function to normalize text for better matching
  const normalizeText = (text: string): string => {
    return text
      .toLowerCase()
      // Remove diacritical marks for Sanskrit
      .replace(/[āáàâä]/g, 'a')
      .replace(/[īíìîï]/g, 'i')
      .replace(/[ūúùûü]/g, 'u')
      .replace(/[ṛṝ]/g, 'r')
      .replace(/[ḷḹ]/g, 'l')
      .replace(/[ēéèêë]/g, 'e')
      .replace(/[ōóòôö]/g, 'o')
      .replace(/[ṃ]/g, 'm')
      .replace(/[ḥ]/g, 'h')
      .replace(/[ṅ]/g, 'n')
      .replace(/[ñ]/g, 'n')
      .replace(/[ṭ]/g, 't')
      .replace(/[ḍ]/g, 'd')
      .replace(/[ṇ]/g, 'n')
      .replace(/[ś]/g, 's')
      .replace(/[ṣ]/g, 's')
      // Remove extra spaces and normalize
      .replace(/\s+/g, ' ')
      .trim();
  };

  // Function to check if text matches query (with normalization)
  const textMatches = (text: string, searchQuery: string): boolean => {
    const normalizedText = normalizeText(text);
    const normalizedQuery = normalizeText(searchQuery);
    return normalizedText.includes(normalizedQuery);
  };

  // Function to highlight matched text
  const highlightText = (text: string, searchQuery: string) => {
    if (!searchQuery.trim()) return <span>{text}</span>;
    
    const normalizedText = normalizeText(text);
    const normalizedQuery = normalizeText(searchQuery);
    const index = normalizedText.indexOf(normalizedQuery);
    
    if (index === -1) return <span>{text}</span>;
    
    const before = text.substring(0, index);
    const match = text.substring(index, index + searchQuery.length);
    const after = text.substring(index + searchQuery.length);
    
    return (
      <span>
        {before}
        <mark className="bg-yellow-200 dark:bg-yellow-800 px-1 rounded">{match}</mark>
        {after}
      </span>
    );
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
      // Import the complete JSON data
      const data = (await import('../../data/rigveda_complete.json')).default as RigvedaData;
      const searchResults: SearchResult[] = [];

      // Search through all mandalas
      data.mandalas.forEach((mandala) => {
        // Search mandala number
        if (textMatches(mandala.mandala_number.toString(), searchQuery)) {
          searchResults.push({
            mandala: mandala.mandala_number,
            sukta: 0,
            type: 'mandala',
            title: `Mandala ${mandala.mandala_number}`,
            subtitle: `${mandala.hymns.length} hymns`,
            matchField: 'mandala number'
          });
        }

        // Search through hymns
        mandala.hymns.forEach((hymn) => {
          // Search hymn number
          if (textMatches(hymn.hymn_number.toString(), searchQuery)) {
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
              matchField: 'addressee'
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
              matchField: 'group name'
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
                snippet: createSnippet(verse.griffith_translation, searchQuery)
              });
            }
          });
        });
      });

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
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setQuery(value);
    
    // Debounce search
    const timeoutId = setTimeout(() => {
      searchData(value);
    }, 300);

    return () => clearTimeout(timeoutId);
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
          className="m-input pr-12"
          placeholder="Search hymns, verses, deities, addressees, groups..."
        />
        <div className="absolute right-2 top-1/2 -translate-y-1/2">
          {loading ? (
            <FontAwesomeIcon icon={faSpinner} className="animate-spin text-gray-400" />
          ) : (
            <button
              onClick={handleSearchClick}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
              type="button"
            >
              <FontAwesomeIcon icon={faSearch} />
            </button>
          )}
        </div>
      </div>

      {showResults && (
        <div className={`search-results-dropdown ${inModal ? 'relative mt-2' : 'absolute top-full left-0 right-0 mt-2'} bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg max-h-96 overflow-y-auto ${inModal ? 'z-[9999]' : 'z-50'}`}>
          <div>
            {/* Filter Bar - Always visible when there are search results */}
            <div className="sticky top-0 bg-white dark:bg-gray-800 px-4 py-3 border-b border-gray-100 dark:border-gray-600 z-10">
              <div className="flex space-x-2">
                <button
                  onClick={() => handleFilterChange('all')}
                  className={`px-3 py-1 text-xs rounded-full transition-colors ${
                    activeFilter === 'all'
                      ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300'
                      : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}
                >
                  All
                </button>
                <button
                  onClick={() => handleFilterChange('hymn')}
                  className={`px-3 py-1 text-xs rounded-full transition-colors ${
                    activeFilter === 'hymn'
                      ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300'
                      : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}
                >
                  Hymn
                </button>
                <button
                  onClick={() => handleFilterChange('translation')}
                  className={`px-3 py-1 text-xs rounded-full transition-colors ${
                    activeFilter === 'translation'
                      ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300'
                      : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}
                >
                  Translation
                </button>
                <button
                  onClick={() => handleFilterChange('transliteration')}
                  className={`px-3 py-1 text-xs rounded-full transition-colors ${
                    activeFilter === 'transliteration'
                      ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300'
                      : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}
                >
                  Transliteration
                </button>
              </div>
            </div>
            
            {/* Results Content */}
            {results.length === 0 ? (
              <div className="p-4 text-left text-gray-500">
                No results found for "{query}" in {activeFilter === 'all' ? 'all categories' : activeFilter}
              </div>
            ) : (
              <div className="py-2">
              {results.map((result, index) => (
                <Link
                  key={index}
                  href={getResultUrl(result)}
                  className="block px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700 border-b border-gray-100 dark:border-gray-600 last:border-b-0 text-left"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 text-left">
                      <div className="font-medium text-gray-900 dark:text-gray-100 text-left">
                        {highlightText(result.title, query)}
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-400 text-left">
                        {highlightText(result.subtitle, query)}
                      </div>
                      {result.snippet && (
                        <div className="text-xs text-gray-600 dark:text-gray-300 text-left mt-1 italic">
                          {highlightText(result.snippet, query)}
                        </div>
                      )}
                    </div>
                    <div className="text-xs text-gray-400 dark:text-gray-500 capitalize ml-2 flex-shrink-0">
                      {result.matchField}
                    </div>
                  </div>
                </Link>
              ))}
              
              {/* Load More Button */}
              {filterResults(allResults, activeFilter).length > results.length && (
                <div className="px-4 py-3 border-t border-gray-100 dark:border-gray-600">
                  <button
                    onClick={loadMoreResults}
                    className="w-full text-center text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 font-medium"
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
