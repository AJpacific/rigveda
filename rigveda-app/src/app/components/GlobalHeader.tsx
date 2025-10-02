'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowLeft, faUpRightFromSquare, faBars, faHome, faArrowRight, faSearch, faRobot } from '@fortawesome/free-solid-svg-icons';
import AskAIModal from './AskAIModal';

const CSE_SRC = 'https://cse.google.com/cse.js?cx=658dcffd2ee984f58';

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
  const containerId = 'gcse-search-container';

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

  // Force re-init helper: clear container and re-render
  const forceReinitCse = () => {
    try {
      const container = document.getElementById(containerId);
      const googleObj = (window as unknown as { google?: GoogleCSE }).google;
      if (!container || !googleObj?.search?.cse?.element?.render) return;
      container.innerHTML = '';
      googleObj.search.cse.element.render({ div: containerId, tag: 'search' });
    } catch {}
  };

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

    const isClearButton = (el: HTMLElement | null) => {
      if (!el) return false;
      const aria = (el.getAttribute('aria-label') || '').toLowerCase();
      const title = (el.getAttribute('title') || '').toLowerCase();
      return el.classList.contains('gsc-clear-button') || aria.includes('clear') || title.includes('clear');
    };

    const onClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null;
      // Handle clear button clicks
      let el: HTMLElement | null = target;
      while (el && el !== container && !isClearButton(el) && el.tagName !== 'A') {
        el = el.parentElement as HTMLElement | null;
      }
      if (!el || el === container) return;

      if (isClearButton(el)) {
        // Let CSE clear first, then reinit to avoid blank state
        setTimeout(() => { if (!detailUrl) { forceReinitCse(); } }, 0);
        return;
      }

      // Handle result link clicks (open in preview)
      if (el.tagName === 'A') {
        const anchor = el as HTMLAnchorElement;
        const href = anchor.getAttribute('href');
        if (!href) return;
        e.preventDefault();
        e.stopPropagation();
        setDetailUrl(href);
      }
    };

    const onInput = (e: Event) => {
      const t = e.target as HTMLInputElement | null;
      if (!t) return;
      const cls = (t.className || '').toString();
      // CSE input tends to have class gsc-input
      if (cls.includes('gsc-input') && t.value.trim() === '' && !detailUrl) {
        setTimeout(() => forceReinitCse(), 0);
      }
    };

    container.addEventListener('click', onClick, true);
    container.addEventListener('input', onInput, true);
    return () => {
      container.removeEventListener('click', onClick, true);
      container.removeEventListener('input', onInput, true);
    };
  }, [searchOpen, cseReady, detailUrl]);

  // Lock/unlock page scroll when dialog is open
  useEffect(() => {
    if (!searchOpen) return;
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
  }, [searchOpen]);

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
          <button onClick={() => { setSearchOpen(true); setDetailUrl(null); }} className="m-btn m-btn-outlined text-xs sm:text-sm" aria-label="Search Google">
            <FontAwesomeIcon icon={faSearch} className="sm:mr-2" />
            <span className="hidden sm:inline">Search</span>
          </button>
          <Link href="/search" className="m-btn m-btn-outlined text-xs sm:text-sm" aria-label="Ask AI" onClick={(e) => { e.preventDefault(); setAskInitial(undefined); setAskOpen(true); }}>
            <FontAwesomeIcon icon={faRobot} className="sm:mr-2" />
            <span className="hidden sm:inline">Ask AI</span>
          </Link>
        </nav>
      </div>
    </header>
  );

  const renderHymnHeader = (meta: NonNullable<HymnHeaderMeta>) => (
    <header className="m-appbar">
      <div className="container mx-auto px-4 m-appbar-inner" style={{ display: 'grid', gridTemplateColumns: 'auto 1fr auto', alignItems: 'center', gap: '8px' }}>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-1 sm:gap-2 justify-self-start">
          <Link href="/" className="m-btn m-btn-outlined text-xs sm:text-sm" aria-label="Home">
            <FontAwesomeIcon icon={faHome} />
            <span className="hidden sm:inline ml-2">Home</span>
          </Link>
          <Link href={`/${meta.mandala}`} className="m-btn m-btn-outlined text-xs sm:text-sm" aria-label="Mandala index">
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

        <div className="grid grid-cols-2 gap-1 sm:flex sm:items-center sm:gap-2 text-sm justify-self-end">
          <button onClick={() => { setSearchOpen(true); setDetailUrl(null); }} className="m-btn m-btn-outlined text-xs sm:text-sm" aria-label="Search Google">
            <FontAwesomeIcon icon={faSearch} className="sm:mr-2" />
            <span className="hidden sm:inline">Search</span>
          </button>
          <Link href="/search" className="m-btn m-btn-outlined text-xs sm:text-sm" aria-label="Ask AI" onClick={(e) => { e.preventDefault(); setAskInitial(undefined); setAskOpen(true); }}>
            <FontAwesomeIcon icon={faRobot} className="sm:mr-2" />
            <span className="hidden sm:inline">Ask AI</span>
          </Link>
          {meta.prevPath ? (
            <Link href={meta.prevPath} className="m-btn m-btn-outlined" aria-label="Previous hymn">
              <FontAwesomeIcon icon={faArrowLeft} />
            </Link>
          ) : (
            <span className="m-btn m-btn-outlined" aria-hidden="true" style={{opacity:0.35,pointerEvents:'none'}}>
              <FontAwesomeIcon icon={faArrowLeft} />
            </span>
          )}
          {meta.nextPath ? (
            <Link href={meta.nextPath} className="m-btn m-btn-outlined" aria-label="Next hymn">
              <FontAwesomeIcon icon={faArrowRight} />
            </Link>
          ) : (
            <span className="m-btn m-btn-outlined" aria-hidden="true" style={{opacity:0.35,pointerEvents:'none'}}>
              <FontAwesomeIcon icon={faArrowRight} />
            </span>
          )}
        </div>
      </div>
    </header>
  );

  return (
    <>
      {hymnMeta ? renderHymnHeader(hymnMeta) : renderDefault()}

      {searchOpen && (
        <div className="m-dialog-overlay" role="dialog" aria-modal="true">
          <div className="m-dialog wide">
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
                    If the page fails to load here, use "Open" to view in a new tab.
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {askOpen && (
        <AskAIModal
          open={askOpen}
          onClose={() => setAskOpen(false)}
          initialQuestion={askInitial}
          title={hymnMeta ? `Ask AI · Hymn ${hymnMeta.sukta}` : 'Ask AI'}
          contextPrefix={hymnMeta ? `Mandala ${hymnMeta.mandala}, Hymn ${hymnMeta.sukta}: ${hymnMeta.title}\n` : ''}
        />
      )}
    </>
  );
}
