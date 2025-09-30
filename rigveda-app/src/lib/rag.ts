export type SearchIndexEntry = {
  mandala: number;
  sukta: number;
  verse: string;
  title: string;
  group: string | null;
  stanzas: number | null;
  text: string;
};

export function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s\.]/gu, ' ')
    .split(/\s+/)
    .filter(Boolean);
}

export function rankContexts(query: string, entries: SearchIndexEntry[], limit = 12): SearchIndexEntry[] {
  const qTokens = tokenize(query);
  if (!qTokens.length) return [];
  const scored = entries.map((e) => {
    const t = e.text.toLowerCase();
    let score = 0;
    for (const w of qTokens) {
      const matches = t.split(w).length - 1;
      if (matches > 0) score += 2 + Math.min(matches, 3) * 0.5;
    }
    return { e, score };
  });
  scored.sort((a, b) => b.score - a.score);
  return scored.filter(s => s.score > 0).slice(0, limit).map(s => s.e);
}

export function buildContextSnippet(entries: SearchIndexEntry[]): string {
  return entries.map((e) => {
    const ref = `${e.mandala}.${e.sukta}.${e.verse}`;
    return `(${ref}) ${e.text}`;
  }).join('\n');
}

export function parseReference(raw: string): { mandala: number; sukta: number; verse?: number } | null {
  const s = raw.trim().toLowerCase();
  // Patterns: 10.67, 10.67.1, 10:67, mandala 10 sukta 67 verse 1
  const dot = s.match(/^\s*(\d+)\s*[\.:]\s*(\d+)(?:\s*[\.:]\s*(\d+))?\s*$/);
  if (dot) {
    const mandala = parseInt(dot[1], 10);
    const sukta = parseInt(dot[2], 10);
    const verse = dot[3] ? parseInt(dot[3], 10) : undefined;
    if (mandala && sukta) return { mandala, sukta, verse };
  }
  const words = s.match(/mandala\s*(\d+).*?(?:sukta|hymn)\s*(\d+)(?:.*?verse\s*(\d+))?/);
  if (words) {
    const mandala = parseInt(words[1], 10);
    const sukta = parseInt(words[2], 10);
    const verse = words[3] ? parseInt(words[3], 10) : undefined;
    if (mandala && sukta) return { mandala, sukta, verse };
  }
  return null;
}

export async function loadHymnEntries(mandala: number, sukta: number): Promise<SearchIndexEntry[] | null> {
  try {
    // Read from src/data (available to the server at build/dev time)
    const mod = await import(`../data/mandala${mandala}.json`);
    const hymns = (mod as any).default?.hymns ?? (mod as any).hymns;
    const hymn = hymns?.find((h: any) => h.sukta === sukta);
    if (!hymn) return null;
    const entries: SearchIndexEntry[] = hymn.verses.map((v: any) => ({
      mandala,
      sukta,
      verse: v.number,
      title: hymn.title,
      group: hymn.group ?? null,
      stanzas: hymn.stanzas ?? hymn.verses?.length ?? null,
      text: [
        v.translation,
        ...(Array.isArray(v.sanskrit) ? v.sanskrit.map((w: any) => `${w.word} ${w.translit}`) : []),
      ].filter(Boolean).join(' '),
    }));
    return entries;
  } catch (e) {
    return null;
  }
}
