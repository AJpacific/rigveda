import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';
import type { RigvedaData } from '../../../types/rigveda';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const filePath = path.join(process.cwd(), 'src/data', 'rigveda_complete.json');
    const jsonData = await fs.readFile(filePath, 'utf8');
    const data = JSON.parse(jsonData) as RigvedaData;
    
    // Select random mandala
    const mandala = data.mandalas[Math.floor(Math.random() * data.mandalas.length)];
    if (!mandala || !mandala.hymns || mandala.hymns.length === 0) {
      return NextResponse.json({ error: 'No hymns found' }, { status: 404 });
    }
    
    // Select random hymn
    const hymn = mandala.hymns[Math.floor(Math.random() * mandala.hymns.length)];
    if (!hymn || !hymn.verses || hymn.verses.length === 0) {
      return NextResponse.json({ error: 'No verses found' }, { status: 404 });
    }
    
    // Select random verse
    const verse = hymn.verses[Math.floor(Math.random() * hymn.verses.length)];

    return NextResponse.json({
      mandala: mandala.mandala_number,
      sukta: hymn.hymn_number,
      verse: verse.verse_number,
      title: hymn.addressee,
      translation: verse.griffith_translation,
      devanagari_text: verse.devanagari_text,
      padapatha_text: verse.padapatha_text,
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Unexpected error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}


