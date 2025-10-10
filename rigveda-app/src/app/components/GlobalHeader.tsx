'use client';

import Link from 'next/link';
import { useEffect, useState, useRef } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowLeft, faUpRightFromSquare, faBars, faHome, faArrowRight, faSearch, faRobot, faChevronDown, faTimes, faBook, faInfo } from '@fortawesome/free-solid-svg-icons';
import AskAIModal from './AskAIModal';
import UniversalSearch from './UniversalSearch';
import DictionaryModal from './DictionaryModal';
import RigvedaOverviewModal from './RigvedaOverviewModal';

const CSE_SRC = 'https://cse.google.com/cse.js?cx=658dcffd2ee984f58';

// Simple Google icon component
const GoogleIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
  </svg>
);

type HymnHeaderMeta = {
  mandala: number;
  sukta: number;
  title: string;
  group?: string;
  stanzas?: number;
  prevPath: string | null;
  nextPath: string | null;
} | null;

type GoogleCSEElement = {
  render: (opts: { div: string; tag: 'search' | string }) => void;
  getAllElements?: () => { execute?: (query: string) => void }[];
};

type GoogleCSE = {
  search?: { cse?: { element?: GoogleCSEElement } };
};

export default function GlobalHeader() {
  const [searchOpen, setSearchOpen] = useState(false);
  const [cseReady, setCseReady] = useState(false);
  const [detailUrl, setDetailUrl] = useState<string | null>(null);
  const [hymnMeta, setHymnMeta] = useState<HymnHeaderMeta>(null);
  const [askOpen, setAskOpen] = useState(false);
  const [askInitial, setAskInitial] = useState<string | undefined>(undefined);
  const [universalSearchOpen, setUniversalSearchOpen] = useState(false);
  const [searchDropdownOpen, setSearchDropdownOpen] = useState(false);
  const [navDropdownOpen, setNavDropdownOpen] = useState(false);
  const [dictionaryOpen, setDictionaryOpen] = useState(false);
  const [rigvedaOverviewOpen, setRigvedaOverviewOpen] = useState(false);
  const containerId = 'gcse-search-container';
  const lastQueryRef = useRef<string>('');

  // Listen for hymn metadata from hymn pages
  useEffect(() => {
    const onMeta = (e: Event) => {
      try {
        const ce = e as CustomEvent<HymnHeaderMeta>;
        setHymnMeta(ce.detail ?? null);
      } catch {
        setHymnMeta(null);
      }
    };
    window.addEventListener('hymn:meta', onMeta as EventListener);
    return () => window.removeEventListener('hymn:meta', onMeta as EventListener);
  }, []);

  // Load Google CSE script once
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const existing = document.querySelector(`script[src="${CSE_SRC}"]`) as HTMLScriptElement | null;
    const markReady = () => setCseReady(true);
    if (existing) {
      const googleObj = (window as unknown as { google?: GoogleCSE }).google;
      if (googleObj?.search?.cse?.element) {
        setCseReady(true);
      } else {
        existing.addEventListener('load', markReady, { once: true });
      }
      return;
    }
    const s = document.createElement('script');
    s.src = CSE_SRC;
    s.async = true;
    s.addEventListener('load', markReady, { once: true });
    document.head.appendChild(s);
  }, []);

  // Render helper: render CSE into container if not present
  const renderCseIfNeeded = () => {
    try {
      const container = document.getElementById(containerId);
      const hasControl = !!container?.querySelector('.gsc-control-cse');
      const googleObj = (window as unknown as { google?: GoogleCSE }).google;
      if (container && !hasControl && googleObj?.search?.cse?.element?.render) {
        googleObj.search.cse.element.render({ div: containerId, tag: 'search' });
      }
    } catch {}
  };

  // (forceReinitCse removed; no longer needed)

  // Render search UI into container when modal opens and CSE is ready
  useEffect(() => {
    if (!searchOpen || !cseReady) return;
    renderCseIfNeeded();
  }, [searchOpen, cseReady]);

  // Intercept result clicks and clear button; handle empty input
  useEffect(() => {
    if (!searchOpen || !cseReady) return;
    const container = document.getElementById(containerId);
    if (!container) return;

    const onClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null;

      // If Google UI "Clear" button was clicked, prevent it from wiping results.
      // We only clear the input's visible value and keep existing results.
      const inputEl = container.querySelector('input.gsc-input') as HTMLInputElement | null;
      if (target && (target.closest('.gsc-clear-button') || target.closest('.gscb_a'))) {
        try {
          e.preventDefault();
          e.stopPropagation();
        } catch {}
        if (inputEl) {
          inputEl.value = '';
          // Do not dispatch input events to avoid triggering a new search
          inputEl.focus();
        }
        return;
      }

      // Intercept result links to open preview
      let el: HTMLElement | null = target;
      while (el && el !== container && el.tagName !== 'A') {
        el = el.parentElement as HTMLElement | null;
      }
      if (!el || el === container) return;
      if (el.tagName === 'A') {
        const anchor = el as HTMLAnchorElement;
        const href = anchor.getAttribute('href');
        if (!href) return;
        e.preventDefault();
        e.stopPropagation();
        setDetailUrl(href);
      }
    };

    container.addEventListener('click', onClick, true);
    // Track last non-empty query so we can restore results if CSE blanks them
    const input = container.querySelector('input.gsc-input') as HTMLInputElement | null;
    const onInput = () => {
      try {
        const v = (input?.value || '').trim();
        if (v) lastQueryRef.current = v;
      } catch {}
    };
    input?.addEventListener('input', onInput, true);
    return () => {
      container.removeEventListener('click', onClick, true);
      input?.removeEventListener('input', onInput, true);
    };
  }, [searchOpen, cseReady]);

  // Ensure CSE UI persists and avoid blank state after clear
  useEffect(() => {
    if (!searchOpen || !cseReady) return;
    const container = document.getElementById(containerId);
    if (!container) return;

    const ensureControl = () => {
      try {
        const hasControl = !!container.querySelector('.gsc-control-cse');
        const input = container.querySelector('input.gsc-input') as HTMLInputElement | null;
        const hasInput = !!input;
        const isEmpty = container.innerHTML.trim().length === 0;
        const hasResults = !!container.querySelector('.gsc-result, .gs-result, .gsc-webResult');
        const googleObj = (window as unknown as { google?: GoogleCSE }).google;
        // Rebuild if control missing OR input missing (blank UI)
        if ((!hasControl || !hasInput || isEmpty) && googleObj?.search?.cse?.element?.render) {
          container.innerHTML = '';
          googleObj.search.cse.element.render({ div: containerId, tag: 'search' });
        } else {
          // If results went blank unexpectedly, re-execute last query but keep input blank afterward
          if (!hasResults && lastQueryRef.current) {
            const all = googleObj?.search?.cse?.element?.getAllElements?.();
            if (Array.isArray(all) && typeof all[0]?.execute === 'function') {
              all[0].execute(lastQueryRef.current);
              setTimeout(() => { if (input) input.value = ''; }, 120);
            }
          }
        }
        // Ensure container visible
        (container as HTMLElement).style.display = '';
      } catch {}
    };

    // Initial check in case the UI was cleared before opening
    ensureControl();

    const observer = new MutationObserver(() => {
      ensureControl();
    });
    observer.observe(container, { childList: true, subtree: true });
    return () => observer.disconnect();
  }, [searchOpen, cseReady]);

  // Lock/unlock page scroll when dialog is open
  useEffect(() => {
    if (!searchOpen && !universalSearchOpen && !dictionaryOpen) return;
    try {
      // Only apply scroll lock to body, not html to avoid header issues
      document.body.classList.add('no-scroll');
      document.body.style.overflow = 'hidden';
    } catch {}
    return () => {
      try {
        document.body.classList.remove('no-scroll');
        document.body.style.overflow = '';
      } catch {}
    };
  }, [searchOpen, universalSearchOpen, dictionaryOpen]);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      
      if (searchDropdownOpen && !target.closest('.search-dropdown-container')) {
        setSearchDropdownOpen(false);
      }
      
      if (navDropdownOpen && !target.closest('.nav-dropdown-container')) {
        setNavDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [searchDropdownOpen, navDropdownOpen]);

  // Measure header height for subappbars
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const setHeightVar = () => {
      const header = document.querySelector('header.m-appbar') as HTMLElement | null;
      const h = header?.offsetHeight || 56;
      document.documentElement.style.setProperty('--global-appbar-height', `${h}px`);
    };
    setHeightVar();
    window.addEventListener('resize', setHeightVar);
    return () => window.removeEventListener('resize', setHeightVar);
  }, []);

  const renderDefault = () => (
    <header className="m-appbar">
      <div className="container mx-auto px-4 m-appbar-inner">
        <Link href="/" className="m-appbar-title text-lg sm:text-xl">RigVeda</Link>
        <nav className="flex items-center gap-1 sm:gap-2">
          {/* About Rigveda Button */}
          <button
            onClick={() => setRigvedaOverviewOpen(true)}
            className="m-btn m-btn-outlined text-sm"
            aria-label="About Rigveda"
          >
            <FontAwesomeIcon icon={faInfo} />
            <span className="hidden sm:inline ml-2">About Rigveda</span>
          </button>
          
          {/* Search Dropdown */}
          <div className="relative search-dropdown-container">
            <button 
              onClick={() => setSearchDropdownOpen(!searchDropdownOpen)}
              className="m-btn m-btn-outlined text-sm"
              aria-label="Search Options"
            >
              <FontAwesomeIcon icon={faSearch} />
              <span className="hidden sm:inline ml-2">Search</span>
              <FontAwesomeIcon icon={faChevronDown} className="text-xs ml-1" />
            </button>
            
            {searchDropdownOpen && (
              <div className="absolute right-0 top-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 min-w-48" style={{ colorScheme: 'light' }}>
                <div className="py-1">
                  <button 
                    onClick={() => {
                      setUniversalSearchOpen(true);
                      setSearchDropdownOpen(false);
                    }}
                    className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 flex items-center gap-2 text-gray-900"
                  >
                    <FontAwesomeIcon icon={faSearch} />
                    <span>Search Rigveda</span>
                  </button>
                  <button 
                    onClick={() => {
                      setDictionaryOpen(true);
                      setSearchDropdownOpen(false);
                    }}
                    className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 flex items-center gap-2 text-gray-900"
                  >
                    <FontAwesomeIcon icon={faBook} />
                    <span>Dictionary</span>
                  </button>
                  <button 
                    onClick={() => {
                      setSearchOpen(true);
                      setDetailUrl(null);
                      setSearchDropdownOpen(false);
                    }}
                    className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 flex items-center gap-2 text-gray-900"
                  >
                    <GoogleIcon />
                    <span>Google Search</span>
                  </button>
                  <Link 
                    href="/search" 
                    onClick={(e) => { 
                      e.preventDefault(); 
                      setAskInitial(undefined); 
                      setAskOpen(true); 
                      setSearchDropdownOpen(false);
                    }}
                    className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 flex items-center gap-2 block"
                  >
                    <FontAwesomeIcon icon={faRobot} />
                    <span>Ask AI</span>
                  </Link>
                </div>
              </div>
            )}
          </div>
        </nav>
      </div>
    </header>
  );

  const renderHymnHeader = (meta: NonNullable<HymnHeaderMeta>) => (
    <header className="m-appbar">
      <div className="container mx-auto px-4">
        {/* Top row: Heading on left, Dropdowns on right */}
        <div className="flex items-center justify-between py-3">
          {/* Left side: Hymn title and info */}
          <div className="text-left">
            <div className="text-[10px] uppercase tracking-[0.3em] text-[color:var(--olive-green)]">
              <Link href="/" className="hover:text-[color:var(--primary-600)] transition-colors duration-200">RIGVEDA</Link> • Mandala {meta.mandala}
            </div>
            <h1 className="text-sm sm:text-base font-semibold">Hymn {meta.sukta}: {meta.title}</h1>
            <div className="text-[11px] sm:text-[12px] text-[color:var(--muted)] mt-0.5 flex flex-wrap items-center gap-x-2">
              <span>Group: <span className="font-medium text-[color:var(--olive-green)]">{meta.group || 'Unknown'}</span></span>
              <span className="hidden sm:inline">·</span>
              <span>Stanzas: <span className="font-medium text-[color:var(--olive-green)]">{meta.stanzas ?? '-'}</span></span>
            </div>
          </div>

          {/* Right side: Dropdowns */}
          <div className="flex flex-col sm:flex-row items-end sm:items-center gap-1 sm:gap-2">
            {/* Search Dropdown */}
            <div className="relative search-dropdown-container">
              <button 
                onClick={() => setSearchDropdownOpen(!searchDropdownOpen)}
                className="m-btn m-btn-outlined text-sm"
                aria-label="Search Options"
              >
                <FontAwesomeIcon icon={faSearch} />
                <span className="hidden sm:inline ml-2">Search</span>
                <FontAwesomeIcon icon={faChevronDown} className="text-xs ml-1" />
              </button>
              
              {searchDropdownOpen && (
                <div className="absolute right-0 top-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 min-w-48" style={{ colorScheme: 'light' }}>
                  <div className="py-1">
                    <button 
                      onClick={() => {
                        setUniversalSearchOpen(true);
                        setSearchDropdownOpen(false);
                      }}
                      className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 flex items-center gap-2 text-gray-900"
                    >
                      <FontAwesomeIcon icon={faSearch} />
                      <span>Search Rigveda</span>
                    </button>
                    <button 
                      onClick={() => {
                        setDictionaryOpen(true);
                        setSearchDropdownOpen(false);
                      }}
                      className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 flex items-center gap-2 text-gray-900"
                    >
                      <FontAwesomeIcon icon={faBook} />
                      <span>Dictionary</span>
                    </button>
                    <button 
                      onClick={() => {
                        setSearchOpen(true);
                        setDetailUrl(null);
                        setSearchDropdownOpen(false);
                      }}
                      className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 flex items-center gap-2 text-gray-900"
                    >
                      <GoogleIcon />
                      <span>Google Search</span>
                    </button>
                    <Link 
                      href="/search" 
                      onClick={(e) => { 
                        e.preventDefault(); 
                        setAskInitial(undefined); 
                        setAskOpen(true); 
                        setSearchDropdownOpen(false);
                      }}
                      className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 flex items-center gap-2 block"
                    >
                      <FontAwesomeIcon icon={faRobot} />
                      <span>Ask AI</span>
                    </Link>
                  </div>
                </div>
              )}
            </div>

            {/* Navigation Dropdown */}
            <div className="relative nav-dropdown-container">
              <button 
                onClick={() => setNavDropdownOpen(!navDropdownOpen)}
                className="m-btn m-btn-outlined text-sm"
                aria-label="Navigation Options"
              >
                <FontAwesomeIcon icon={faBars} />
                <span className="hidden sm:inline ml-2">Navigate</span>
                <FontAwesomeIcon icon={faChevronDown} className="text-xs ml-1" />
              </button>
              
              {navDropdownOpen && (
                <div className="absolute right-0 top-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 min-w-48" style={{ colorScheme: 'light' }}>
                  <div className="py-1">
                    <Link 
                      href="/"
                      onClick={() => setNavDropdownOpen(false)}
                      className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 flex items-center gap-2 text-gray-900 block"
                    >
                      <FontAwesomeIcon icon={faHome} />
                      <span>Home</span>
                    </Link>
                    <Link 
                      href={`/${meta.mandala}`}
                      onClick={() => setNavDropdownOpen(false)}
                      className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 flex items-center gap-2 text-gray-900 block"
                    >
                      <FontAwesomeIcon icon={faBars} />
                      <span>Hymns</span>
                    </Link>
                    {meta.prevPath ? (
                      <Link 
                        href={meta.prevPath}
                        onClick={() => setNavDropdownOpen(false)}
                        className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 flex items-center gap-2 text-gray-900 block"
                      >
                        <FontAwesomeIcon icon={faArrowLeft} />
                        <span>Previous</span>
                      </Link>
                    ) : (
                      <span className="w-full px-4 py-2 text-left text-sm text-gray-400 flex items-center gap-2">
                        <FontAwesomeIcon icon={faArrowLeft} />
                        <span>Previous</span>
                      </span>
                    )}
                    {meta.nextPath ? (
                      <Link 
                        href={meta.nextPath}
                        onClick={() => setNavDropdownOpen(false)}
                        className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 flex items-center gap-2 text-gray-900 block"
                      >
                        <FontAwesomeIcon icon={faArrowRight} />
                        <span>Next</span>
                      </Link>
                    ) : (
                      <span className="w-full px-4 py-2 text-left text-sm text-gray-400 flex items-center gap-2">
                        <FontAwesomeIcon icon={faArrowRight} />
                        <span>Next</span>
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );

  // Debug log
  console.log('universalSearchOpen state:', universalSearchOpen);

  return (
    <>
      {hymnMeta ? renderHymnHeader(hymnMeta) : renderDefault()}

      {searchOpen && (
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
              setSearchOpen(false);
            }
          }}
        >
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[70vh] sm:max-h-[80vh] overflow-hidden animate-in fade-in-0 zoom-in-95 duration-300" style={{ width: '100%' }}>
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                  <GoogleIcon className="text-red-600 text-lg" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">{detailUrl ? 'Preview' : 'Google Search'}</h2>
                  <p className="text-sm text-gray-500">{detailUrl ? 'Viewing search result' : 'Search the web'}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {detailUrl && (
                  <button 
                    onClick={() => setDetailUrl(null)} 
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors duration-200 flex items-center gap-2" 
                    aria-label="Back to results"
                  >
                    <FontAwesomeIcon icon={faArrowLeft} />
                    <span className="hidden sm:inline">Back</span>
                  </button>
                )}
                {detailUrl && (
                  <a 
                    href={detailUrl} 
                    target="_blank" 
                    rel="noreferrer noopener" 
                    className="px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors duration-200 flex items-center gap-2" 
                    aria-label="Open in new tab"
                  >
                    <FontAwesomeIcon icon={faUpRightFromSquare} />
                    <span className="hidden sm:inline">Open</span>
                  </a>
                )}
                <button 
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    e.nativeEvent.stopImmediatePropagation();
                    setDetailUrl(null);
                    setSearchOpen(false);
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
            </div>
            <div className="p-6 max-h-[calc(70vh-120px)] sm:max-h-[calc(80vh-120px)] overflow-y-auto">
              {!cseReady && <div className="text-sm text-gray-500 flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin"></div>
                Loading search…
              </div>}
              <div id={containerId} className={detailUrl ? 'gcse-search hidden' : 'gcse-search'} />
              {detailUrl && (
                <div>
                  <div className="m-embed-container">
                    <iframe className="embedded-frame" src={detailUrl} title="Result preview" />
                  </div>
                  <div className="mt-4 p-3 bg-blue-50 rounded-lg text-sm text-blue-700">
                    If the page fails to load here, use &quot;Open&quot; to view in a new tab.
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <AskAIModal
        open={askOpen}
        onClose={() => setAskOpen(false)}
        initialQuestion={askInitial}
        title={hymnMeta ? `Ask AI` : 'Ask AI'}
      />

      <DictionaryModal
        open={dictionaryOpen}
        onClose={() => setDictionaryOpen(false)}
      />

      <RigvedaOverviewModal
        open={rigvedaOverviewOpen}
        onClose={() => setRigvedaOverviewOpen(false)}
      />

      {universalSearchOpen && (
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
              setUniversalSearchOpen(false);
            }
          }}
        >
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[70vh] sm:max-h-[80vh] overflow-hidden animate-in fade-in-0 zoom-in-95 duration-300" style={{ width: '100%' }}>
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                  <FontAwesomeIcon icon={faSearch} className="text-blue-600 text-lg" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">Search Rigveda</h2>
                  <p className="text-sm text-gray-500">Find hymns, verses, and more</p>
                </div>
              </div>
              <button 
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  e.nativeEvent.stopImmediatePropagation();
                  setUniversalSearchOpen(false);
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
              <UniversalSearch 
                inModal={true} 
                onResultClick={() => setUniversalSearchOpen(false)} 
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
}
