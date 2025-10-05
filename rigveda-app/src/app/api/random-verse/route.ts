import { NextResponse } from 'next/server';

type Verse = {
  number: number;
  translation: string;
  sanskrit?: Array<{ sep?: string; word?: string; translit?: string }>;
  sanskrit_lines?: Array<Array<{ sep?: string; word?: string; translit?: string }>>;
};

type Hymn = {
  sukta: number;
  title: string;
  group?: string | null;
  stanzas?: number | null;
  verses: Verse[];
};

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const mandalaNum = Math.floor(Math.random() * 10) + 1; // 1..10
    const mod = (await import(`../../../data/mandala${mandalaNum}.json`)) as {
      default?: { hymns: Hymn[] };
      hymns?: Hymn[];
    };
    const hymns = mod.default?.hymns ?? mod.hymns ?? [];
    if (!Array.isArray(hymns) || hymns.length === 0) {
      return NextResponse.json({ error: 'No hymns found' }, { status: 404 });
    }
    const hymn = hymns[Math.floor(Math.random() * hymns.length)];
    const verses = Array.isArray(hymn?.verses) ? hymn.verses : [];
    if (verses.length === 0) {
      return NextResponse.json({ error: 'No verses found' }, { status: 404 });
    }
    const verse = verses[Math.floor(Math.random() * verses.length)];

    return NextResponse.json({
      mandala: mandalaNum,
      sukta: hymn.sukta,
      verse: verse.number,
      title: hymn.title,
      translation: verse.translation,
      sanskrit: verse.sanskrit ?? [],
      sanskrit_lines: verse.sanskrit_lines ?? null,
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Unexpected error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}


