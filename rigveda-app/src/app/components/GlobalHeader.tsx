'use client';

import Link from 'next/link';
import { useEffect, useState, useRef } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowLeft, faUpRightFromSquare, faBars, faHome, faArrowRight, faSearch, faRobot } from '@fortawesome/free-solid-svg-icons';
import AskAIModal from './AskAIModal';
import UniversalSearch from './UniversalSearch';

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
    if (!searchOpen && !universalSearchOpen) return;
    try {
      document.documentElement.classList.add('no-scroll');
      document.body.classList.add('no-scroll');
    } catch {}
    return () => {
      try {
        document.documentElement.classList.remove('no-scroll');
        document.body.classList.remove('no-scroll');
      } catch {}
    };
  }, [searchOpen, universalSearchOpen]);

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
        <Link href="/" className="m-appbar-title text-lg sm:text-xl">Rig Veda</Link>
        <nav className="flex items-center gap-1 sm:gap-2">
          <button onClick={() => setUniversalSearchOpen(true)} className="m-btn m-btn-outlined text-sm" aria-label="Universal Search">
            <FontAwesomeIcon icon={faSearch} />
            <span className="hidden sm:inline ml-2">Search</span>
          </button>
          <button onClick={() => { setSearchOpen(true); setDetailUrl(null); }} className="m-btn m-btn-outlined text-sm" aria-label="Search Google">
            <GoogleIcon />
            <span className="hidden sm:inline ml-2">Google Search</span>
          </button>
          <Link href="/search" className="m-btn m-btn-outlined text-sm" aria-label="Ask AI" onClick={(e) => { e.preventDefault(); setAskInitial(undefined); setAskOpen(true); }}>
            <FontAwesomeIcon icon={faRobot} />
            <span className="hidden sm:inline ml-2">Ask AI</span>
          </Link>
        </nav>
      </div>
    </header>
  );

  const renderHymnHeader = (meta: NonNullable<HymnHeaderMeta>) => (
    <header className="m-appbar">
      <div className="container mx-auto px-4 m-appbar-inner" style={{ display: 'grid', gridTemplateColumns: 'auto 1fr auto', alignItems: 'center', gap: '8px' }}>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-1 sm:gap-2 justify-self-start">
          <Link href="/" className="m-btn m-btn-outlined text-sm" aria-label="Home">
            <FontAwesomeIcon icon={faHome} />
            <span className="hidden sm:inline ml-2">Home</span>
          </Link>
          <Link href={`/${meta.mandala}`} className="m-btn m-btn-outlined text-sm" aria-label="Mandala index">
            <FontAwesomeIcon icon={faBars} />
            <span className="hidden sm:inline ml-2">Index</span>
          </Link>
        </div>

        <div className="text-center justify-self-center overflow-hidden" style={{ minWidth: 0 }}>
          <div className="text-[10px] uppercase tracking-[0.3em] text-[color:var(--olive-green)]">Mandala {meta.mandala}</div>
          <h1 className="text-sm sm:text-base font-semibold">Hymn {meta.sukta}: {meta.title}</h1>
          <div className="text-[11px] sm:text-[12px] text-[color:var(--muted)] mt-0.5 flex flex-wrap justify-center items-center gap-x-2">
            <span>Group: <span className="font-medium text-[color:var(--olive-green)]">{meta.group || 'Unknown'}</span></span>
            <span className="hidden sm:inline">·</span>
            <span>Stanzas: <span className="font-medium text-[color:var(--olive-green)]">{meta.stanzas ?? '-'}</span></span>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-1 sm:flex sm:items-center sm:gap-2 text-sm justify-self-end">
          <button onClick={() => {
            console.log('Universal search button clicked');
            setUniversalSearchOpen(true);
          }} className="m-btn m-btn-outlined text-sm" aria-label="Universal Search">
            <FontAwesomeIcon icon={faSearch} />
            <span className="hidden sm:inline ml-2">Search</span>
          </button>
          <button onClick={() => { setSearchOpen(true); setDetailUrl(null); }} className="m-btn m-btn-outlined text-sm" aria-label="Search Google">
            <GoogleIcon />
            <span className="hidden sm:inline ml-2">Google Search</span>
          </button>
          <Link href="/search" className="m-btn m-btn-outlined text-sm" aria-label="Ask AI" onClick={(e) => { e.preventDefault(); setAskInitial(undefined); setAskOpen(true); }}>
            <FontAwesomeIcon icon={faRobot} />
            <span className="hidden sm:inline ml-2">Ask AI</span>
          </Link>
          {meta.prevPath ? (
            <Link href={meta.prevPath} className="m-btn m-btn-outlined text-sm" aria-label="Previous hymn">
              <FontAwesomeIcon icon={faArrowLeft} />
            </Link>
          ) : (
            <span className="m-btn m-btn-outlined text-sm" aria-hidden="true" style={{opacity:0.35,pointerEvents:'none'}}>
              <FontAwesomeIcon icon={faArrowLeft} />
            </span>
          )}
          {meta.nextPath ? (
            <Link href={meta.nextPath} className="m-btn m-btn-outlined text-sm" aria-label="Next hymn">
              <FontAwesomeIcon icon={faArrowRight} />
            </Link>
          ) : (
            <span className="m-btn m-btn-outlined text-sm" aria-hidden="true" style={{opacity:0.35,pointerEvents:'none'}}>
              <FontAwesomeIcon icon={faArrowRight} />
            </span>
          )}
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
        <div className="m-dialog-overlay" role="dialog" aria-modal="true">
          <div className="m-dialog wide m-dialog-plain">
            <div className="m-dialog-header">
              <div className="text-sm uppercase tracking-wide text-muted">{detailUrl ? 'Preview' : 'Search'}</div>
              <div className="flex items-center gap-2">
                {detailUrl && (
                  <button onClick={() => setDetailUrl(null)} className="m-btn m-btn-outlined text-sm" aria-label="Back to results">
                    <FontAwesomeIcon icon={faArrowLeft} />
                    <span className="hidden sm:inline">Back</span>
                  </button>
                )}
                {detailUrl && (
                  <a href={detailUrl} target="_blank" rel="noreferrer noopener" className="m-btn m-btn-text text-sm" aria-label="Open in new tab">
                    <FontAwesomeIcon icon={faUpRightFromSquare} />
                    <span className="hidden sm:inline">Open</span>
                  </a>
                )}
                <button onClick={() => { setDetailUrl(null); setSearchOpen(false); }} className="icon-btn" aria-label="Close">×</button>
              </div>
            </div>
            <div className="m-dialog-body">
              {!cseReady && <div className="text-sm text-muted">Loading search…</div>}
              <div id={containerId} className={detailUrl ? 'gcse-search hidden' : 'gcse-search'} />
              {detailUrl && (
                <div>
                  <div className="m-embed-container">
                    <iframe className="embedded-frame" src={detailUrl} title="Result preview" />
                  </div>
                  <div className="m-note-foot mt-2 text-xs text-muted">
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

      {universalSearchOpen && (
        <div 
          className="m-dialog-overlay" 
          role="dialog" 
          aria-modal="true" 
          style={{ overflow: 'visible', alignItems: 'flex-start', paddingTop: '80px' }}
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setUniversalSearchOpen(false);
            }
          }}
        >
          <div className="m-dialog m-dialog-plain max-w-2xl mx-auto" style={{ maxHeight: '80vh', overflow: 'visible', width: '100%' }}>
            <div className="m-dialog-header">
              <div className="text-sm uppercase tracking-wide text-muted">Universal Search</div>
              <button onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                console.log('Closing universal search modal');
                setUniversalSearchOpen(false);
              }} className="icon-btn" aria-label="Close" style={{ zIndex: 10000 }}>×</button>
            </div>
            <div className="m-dialog-body" style={{ maxHeight: 'calc(80vh - 60px)', overflow: 'auto', position: 'relative' }}>
              <UniversalSearch inModal={true} />
            </div>
          </div>
        </div>
      )}
    </>
  );
}
