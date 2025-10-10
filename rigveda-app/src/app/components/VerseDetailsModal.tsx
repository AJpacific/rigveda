'use client';

import { useState, useEffect, useCallback } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTimes, faSpinner, faBook, faLanguage, faMicroscope, faInfoCircle, faQuestionCircle, faMusic, faList } from '@fortawesome/free-solid-svg-icons';
import { useMobileModalHeight } from '../hooks/useMobileModalHeight';

interface PadaData {
  grammarData?: Array<{
    form: string;
    lemma: string;
    props?: Record<string, unknown>;
  }>;
}

interface VersionData {
  type: string;
  id: string;
  form: string[];
  source: string;
  language: string;
  metricalData?: string[];
}

interface VerseDetailsData {
  mandala: number;
  hymn: number;
  verse: number;
  docId: string;
  sanskrit: string;
  sanskritSource: string;
  sanskritLanguage: string;
  transliteration: string;
  transliterationSource: string;
  translations: {
    english: string;
    author: string;
  };
  deity: string;
  poetFamily: string;
  seer: string;
  meter: string;
  strata: string;
  metricalData?: string;
  padas: PadaData[];
  versions: VersionData[];
  externalResources: unknown[];
  rawData: unknown;
}

interface VerseDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  mandala: number;
  hymn: number;
  verse: number;
}

export default function VerseDetailsModal({ isOpen, onClose, mandala, hymn, verse }: VerseDetailsModalProps) {
  const [data, setData] = useState<VerseDetailsData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'grammar' | 'metrical' | 'versions'>('overview');
  const [strataHelpOpen, setStrataHelpOpen] = useState(false);
  
  // Dynamic height for mobile devices with audio bar consideration
  const { style: modalStyle } = useMobileModalHeight({
    defaultHeight: '80vh',
    mobileHeight: '70vh',
    audioBarHeight: 100, // Account for audio bar
    minHeight: '40vh'
  });

  const fetchVerseDetails = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/rigveda/verse?mandala=${mandala}&hymn=${hymn}&verse=${verse}`);
      if (!response.ok) {
        throw new Error(`Failed to fetch verse details: ${response.status}`);
      }
      const result = await response.json();
      setData(result.data);
    } catch (err) {
      console.error('Error fetching verse details:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch verse details');
    } finally {
      setLoading(false);
    }
  }, [mandala, hymn, verse]);

  useEffect(() => {
    if (isOpen && mandala && hymn && verse) {
      setData(null);
      setError(null);
      setActiveTab('overview');
      fetchVerseDetails();
    } else if (!isOpen) {
      // Reset state when modal closes
      setData(null);
      setError(null);
      setActiveTab('overview');
    }
  }, [isOpen, mandala, hymn, verse, fetchVerseDetails]);

  const renderOverview = () => {
    if (!data) return null;

    return (
      <div className="space-y-6">
        <div className="rounded-xl p-4 shadow-sm" style={{ backgroundColor: 'rgba(138, 75, 45, 0.1)', borderColor: 'rgba(138, 75, 45, 0.2)' }}>
          <div className="flex items-center gap-2 mb-3">
            <FontAwesomeIcon icon={faBook} style={{ color: 'var(--primary)' }} />
            <h3 className="font-semibold" style={{ color: 'var(--accent)' }}>Sanskrit Text</h3>
            <span className="text-xs px-2 py-1 rounded-full" style={{ color: 'var(--primary)', backgroundColor: 'rgba(138, 75, 45, 0.15)' }}>
              {data.sanskritLanguage}
            </span>
          </div>
          <div
            className="text-lg leading-relaxed font-serif"
            style={{ color: 'var(--foreground)' }}
            dangerouslySetInnerHTML={{ __html: data.sanskrit }}
          />
          <div className="text-xs mt-2 flex items-center gap-1" style={{ color: 'var(--primary)' }}>
            <FontAwesomeIcon icon={faInfoCircle} className="text-xs" />
            Source: {data.sanskritSource}
          </div>
        </div>

        <div className="rounded-xl p-4 shadow-sm" style={{ backgroundColor: 'rgba(138, 75, 45, 0.1)', borderColor: 'rgba(138, 75, 45, 0.2)' }}>
          <div className="flex items-center gap-2 mb-3">
            <FontAwesomeIcon icon={faLanguage} style={{ color: 'var(--primary)' }} />
            <h3 className="font-semibold" style={{ color: 'var(--accent)' }}>Transliteration</h3>
          </div>
          <div
            className="text-base leading-relaxed font-mono"
            style={{ color: 'var(--foreground)' }}
            dangerouslySetInnerHTML={{ __html: data.transliteration }}
          />
          <div className="text-xs mt-2 flex items-center gap-1" style={{ color: 'var(--primary)' }}>
            <FontAwesomeIcon icon={faInfoCircle} className="text-xs" />
            Source: {data.transliterationSource}
          </div>
        </div>

        <div className="rounded-xl p-4 shadow-sm" style={{ backgroundColor: 'rgba(138, 75, 45, 0.1)', borderColor: 'rgba(138, 75, 45, 0.2)' }}>
          <div className="flex items-center gap-2 mb-3">
            <FontAwesomeIcon icon={faBook} style={{ color: 'var(--primary)' }} />
            <h3 className="font-semibold" style={{ color: 'var(--accent)' }}>English Translation</h3>
          </div>
          <div className="text-base leading-relaxed" style={{ color: 'var(--foreground)' }}>
            {data.translations.english}
          </div>
          <div className="text-xs mt-2 flex items-center gap-1" style={{ color: 'var(--primary)' }}>
            <FontAwesomeIcon icon={faInfoCircle} className="text-xs" />
            Translator: {data.translations.author}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="border border-gray-200 rounded-xl p-4 shadow-sm" style={{ backgroundColor: 'rgba(138, 75, 45, 0.1)' }}>
            <h4 className="font-semibold text-gray-800 mb-2">
              Deity
            </h4>
            <p className="text-gray-700 font-medium">{data.deity}</p>
          </div>
          <div className="border border-gray-200 rounded-xl p-4 shadow-sm" style={{ backgroundColor: 'rgba(138, 75, 45, 0.1)' }}>
            <h4 className="font-semibold text-gray-800 mb-2">
              Poet Family
            </h4>
            <p className="text-gray-700 font-medium">{data.poetFamily}</p>
          </div>
          <div className="border border-gray-200 rounded-xl p-4 shadow-sm" style={{ backgroundColor: 'rgba(138, 75, 45, 0.1)' }}>
            <h4 className="font-semibold text-gray-800 mb-2">
              Meter
            </h4>
            <p className="text-gray-700 font-medium">{data.meter}</p>
          </div>
          <div className="border border-gray-200 rounded-xl p-4 shadow-sm" style={{ backgroundColor: 'rgba(138, 75, 45, 0.1)' }}>
            <h4 className="font-semibold text-gray-800 mb-2 flex items-center gap-2">
              Strata
              <button
                onClick={() => setStrataHelpOpen(true)}
                className="w-5 h-5 rounded-full bg-white border border-gray-300 hover:bg-gray-50 flex items-center justify-center text-gray-600 hover:text-gray-800 transition-colors duration-200 shadow-sm"
                aria-label="Show strata help"
              >
                <FontAwesomeIcon icon={faQuestionCircle} className="text-sm" />
              </button>
            </h4>
            <p className="text-gray-700 font-medium">{data.strata}</p>
          </div>
        </div>
      </div>
    );
  };

  const renderGrammar = () => {
    if (!data || !data.padas || data.padas.length === 0) {
      return (
        <div className="text-center py-8 text-gray-500">
          <FontAwesomeIcon icon={faMicroscope} className="text-4xl mb-4" />
          <p>No grammatical analysis available</p>
        </div>
      );
    }

    return (
      <div className="space-y-4">
        {data.padas.map((pada, index) => (
          <div key={index} className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <h4 className="font-semibold text-gray-800 mb-3">Pada {index + 1}</h4>
            <div className="space-y-2">
              {pada.grammarData?.map((token, tokenIndex: number) => (
                <div key={tokenIndex} className="flex flex-wrap items-center gap-2 p-2 bg-white rounded border">
                  <span className="font-semibold text-gray-800">{token.form}</span>
                  <span className="text-sm text-gray-600">({token.lemma})</span>
                  {token.props && (
                    <div className="flex flex-wrap gap-1">
                      {Object.entries(token.props).map(([key, value]) => (
                        <span key={key} className="text-xs px-2 py-1 rounded" style={{ backgroundColor: 'rgba(138, 75, 45, 0.15)', color: 'var(--primary)' }}>
                          {key}: {String(value)}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  };

  const renderMetrical = () => {
    if (!data) return null;

    // Process metrical data per pada
    const renderMetricalStructure = () => {
      if (!data.metricalData) return null;

      // Split metrical data by pada (using <br /> or \n as separators)
      let metricalPadas;
      if (data.metricalData.includes('<br />')) {
        metricalPadas = data.metricalData.split('<br />').map(line => line.trim());
      } else if (data.metricalData.includes('\n')) {
        metricalPadas = data.metricalData.split('\n').map(line => line.trim());
      } else {
        // Single line - try to split by spaces or assume single pattern
        metricalPadas = [data.metricalData.trim()];
      }

      // Get form data (pada texts) - using padas data instead
      // const formPadas = data.padas || [];

      return (
        <div className="space-y-4">
          <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
            <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
              <h4 className="font-semibold text-gray-800">Metrical Pattern</h4>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 border-b border-gray-200">Pada</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 border-b border-gray-200">Transliteration & Pattern</th>
                  </tr>
                </thead>
                <tbody>
                  {metricalPadas.map((pattern, pIdx) => {
                    const padaLetter = String.fromCharCode(97 + pIdx); // a, b, c, d
                    
                    // Get Lubotsky transliteration for this pada
                    const lubotskyTransliteration = data.transliteration || '';
                    const lubotskyLines = lubotskyTransliteration.split('<br />').filter(line => line.trim());
                    const padaTransliteration = lubotskyLines[pIdx] || '';
                    
                    // Split pattern into characters
                    const patternChars = pattern.split('');
                    
                    // Create word-to-pattern mapping
                    // const createWordPatternMapping = () => {
                    //   if (!padaTransliteration) return null;
                    //   
                    //   const words = transliterationWords;
                    //   const chars = patternChars;
                    //   
                    //   // Simple mapping: distribute characters evenly among words
                    //   const charsPerWord = Math.ceil(chars.length / words.length);
                    //   const result = [];
                    //   
                    //   let charIndex = 0;
                    //   for (let i = 0; i < words.length; i++) {
                    //     const wordChars = chars.slice(charIndex, charIndex + charsPerWord);
                    //     result.push({
                    //       word: words[i],
                    //       pattern: wordChars
                    //     });
                    //     charIndex += charsPerWord;
                    //   }
                    //   
                    //   return result;
                    // };
                    
                    // const wordPatternMapping = createWordPatternMapping();
                    
                    return (
                      <tr key={pIdx} className="border-b" style={{ borderColor: 'rgba(138, 75, 45, 0.2)', backgroundColor: 'rgba(138, 75, 45, 0.05)' }}>
                        <td className="px-4 py-3 text-sm font-medium text-gray-900">
                          {padaLetter}
                        </td>
                        <td className="px-4 py-3">
                          <div className="space-y-2">
                            {/* Transliteration line */}
                            <div className="text-sm text-gray-600 font-mono">
                              {padaTransliteration || '-'}
                            </div>
                            {/* Pattern line */}
                            <div className="flex items-center gap-1 flex-wrap">
                              {patternChars.map((char, cIdx) => (
                                <span
                                  key={cIdx}
                                  className="px-2 py-1 text-sm font-bold rounded"
                                  style={{ backgroundColor: 'rgba(138, 75, 45, 0.15)', color: 'var(--primary)', borderColor: 'rgba(138, 75, 45, 0.2)' }}
                                >
                                  {char}
                                </span>
                              ))}
                            </div>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      );
    };

    return (
      <div className="space-y-6">
        {data.metricalData && (
          <div className="rounded-lg p-4" style={{ backgroundColor: 'rgba(138, 75, 45, 0.1)', borderColor: 'rgba(138, 75, 45, 0.2)' }}>
            <h3 className="font-semibold mb-3" style={{ color: 'var(--accent)' }}>Metrical Pattern</h3>
            <div className="text-xs mb-4" style={{ color: 'var(--primary)' }}>
              L = Long syllable (Guru), S = Short syllable (Laghu)
            </div>
            {renderMetricalStructure()}
          </div>
        )}
      </div>
    );
  };

  const renderVersions = () => {
    if (!data || !data.versions || data.versions.length === 0) {
      return (
        <div className="text-center py-8 text-gray-500">
          <FontAwesomeIcon icon={faBook} className="text-4xl mb-4" />
          <p>No additional versions available</p>
        </div>
      );
    }

    return (
      <div className="space-y-4">
        {data.versions
          .filter(version => 
            !version.source?.includes('Eichler') && 
            !version.language?.includes('san-Deva')
          )
          .map((version, index) => (
          <div key={index} className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-semibold text-gray-800">{version.type}</h4>
              <span className="text-xs bg-gray-200 text-gray-700 px-2 py-1 rounded">
                {version.language}
              </span>
            </div>
            {version.source && (
              <div className="text-sm text-gray-600 mb-2">Source: {version.source}</div>
            )}
            <div className="text-sm text-gray-700">
              {Array.isArray(version.form) ? version.form.join(' ') : version.form}
            </div>
            {version.metricalData && (
              <div className="mt-2 text-xs font-mono" style={{ color: 'var(--primary)' }}>
                Metrical: {version.metricalData.join(' ')}
              </div>
            )}
          </div>
        ))}
      </div>
    );
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center p-4 pb-20"
      style={{
        backgroundColor: 'rgba(0, 0, 0, 0.1) !important',
        background: 'rgba(0, 0, 0, 0.1) !important',
        paddingTop: '40px',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        position: 'fixed',
      }}
      role="dialog"
      aria-modal="true"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
          try {
            document.body.classList.remove('no-scroll');
          } catch {}
        }
      }}
    >
      <div className="bg-white rounded-2xl shadow-2xl max-w-5xl w-full flex flex-col animate-in fade-in-0 zoom-in-95 duration-300 overflow-hidden mb-4" style={modalStyle}>
        <div className="flex items-center justify-between p-6 border-b border-gray-100 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ backgroundColor: 'rgba(138, 75, 45, 0.15)' }}>
              <FontAwesomeIcon icon={faInfoCircle} className="text-lg" style={{ color: 'var(--primary)' }} />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                Verse Details
              </h2>
              <p className="text-sm text-gray-500">
                Mandala {mandala}, Hymn {hymn}, Verse {verse}
              </p>
            </div>
          </div>
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              e.nativeEvent.stopImmediatePropagation();
              onClose();
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

        <div className="flex border-b border-gray-200 flex-shrink-0 overflow-x-auto">
          {[
            { id: 'overview', label: 'Overview', icon: faBook },
            { id: 'grammar', label: 'Grammar', icon: faMicroscope },
            { id: 'metrical', label: 'Metrical', icon: faMusic },
            { id: 'versions', label: 'Versions', icon: faList },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as 'overview' | 'grammar' | 'metrical' | 'versions')}
              className={`flex items-center gap-2 px-3 sm:px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                activeTab === tab.id
                  ? 'border-2'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
              style={activeTab === tab.id ? { borderColor: 'var(--primary)', color: 'var(--primary)' } : {}}
            >
              <FontAwesomeIcon icon={tab.icon} className="text-xs" />
              <span className="hidden sm:inline">{tab.label}</span>
            </button>
          ))}
        </div>

        <div className="flex-1 p-4 sm:p-6 overflow-y-auto min-h-0">
          {loading && (
            <div className="flex items-center justify-center py-12">
              <FontAwesomeIcon icon={faSpinner} className="text-2xl animate-spin mr-3" style={{ color: 'var(--primary)' }} />
              <span className="text-gray-600">Loading verse details...</span>
            </div>
          )}

          {error && (
            <div className="flex items-center gap-2 p-4 rounded-lg" style={{ backgroundColor: 'rgba(107, 30, 20, 0.1)', borderColor: 'rgba(107, 30, 20, 0.2)', color: 'var(--accent)' }}>
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              {error}
            </div>
          )}

          {!loading && !error && data && (
            <>
              {activeTab === 'overview' && renderOverview()}
              {activeTab === 'grammar' && renderGrammar()}
              {activeTab === 'metrical' && renderMetrical()}
              {activeTab === 'versions' && renderVersions()}
            </>
          )}
        </div>
      </div>

      {/* Strata Help Modal */}
      {strataHelpOpen && (
        <div 
          className="fixed inset-0 z-60 flex items-center justify-center p-4"
          style={{ 
            backgroundColor: 'rgba(0, 0, 0, 0.1) !important',
            background: 'rgba(0, 0, 0, 0.1) !important',
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
              setStrataHelpOpen(false);
            }
          }}
        >
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full flex flex-col animate-in fade-in-0 zoom-in-95 duration-300 overflow-hidden" style={{ maxHeight: '60vh' }}>
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-100 flex-shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ backgroundColor: 'rgba(138, 75, 45, 0.15)' }}>
                  <FontAwesomeIcon icon={faQuestionCircle} className="text-lg" style={{ color: 'var(--primary)' }} />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">
                    Stanza Strata
                  </h2>
                  <p className="text-sm text-gray-500">
                    Classification system for Vedic verses
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setStrataHelpOpen(false)}
                className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-500 hover:text-gray-700 transition-colors duration-200" 
                aria-label="Close"
                type="button"
              >
                <FontAwesomeIcon icon={faTimes} className="text-sm" />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 p-6 overflow-y-auto min-h-0">
              <div className="space-y-4">
                <div className="grid grid-cols-1 gap-3">
                  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                    <span className="font-mono text-lg font-bold text-gray-800 w-8">A</span>
                    <span className="text-gray-700">Archaic</span>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                    <span className="font-mono text-lg font-bold text-gray-800 w-8">a</span>
                    <span className="text-gray-700">Archaic on metrical evidence alone</span>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                    <span className="font-mono text-lg font-bold text-gray-800 w-8">S</span>
                    <span className="text-gray-700">Strophic</span>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                    <span className="font-mono text-lg font-bold text-gray-800 w-8">s</span>
                    <span className="text-gray-700">Strophic on metrical evidence alone</span>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                    <span className="font-mono text-lg font-bold text-gray-800 w-8">N</span>
                    <span className="text-gray-700">Normal</span>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                    <span className="font-mono text-lg font-bold text-gray-800 w-8">n</span>
                    <span className="text-gray-700">Normal on metrical evidence alone</span>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                    <span className="font-mono text-lg font-bold text-gray-800 w-8">C</span>
                    <span className="text-gray-700">Cretic</span>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                    <span className="font-mono text-lg font-bold text-gray-800 w-8">c</span>
                    <span className="text-gray-700">Cretic on metrical evidence alone</span>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                    <span className="font-mono text-lg font-bold text-gray-800 w-8">P</span>
                    <span className="text-gray-700">Popular for linguistic reasons, and possibly also for non-linguistic reasons</span>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                    <span className="font-mono text-lg font-bold text-gray-800 w-8">p</span>
                    <span className="text-gray-700">Popular for non-linguistic reasons</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}