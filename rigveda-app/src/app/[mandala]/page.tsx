import fs from 'fs/promises';
import path from 'path';
import Link from 'next/link';
import type { Hymn } from '../../types/rigveda';

export async function generateStaticParams() {
  return Array.from({ length: 10 }, (_, i) => ({ mandala: (i + 1).toString() }));
}

export default async function MandalaPage({ params }: { params: Promise<{ mandala: string }> }) {
  const { mandala: mandalaStr } = await params;
  const mandala = parseInt(mandalaStr, 10);
  const filePath = path.join(process.cwd(), 'src/data', `mandala${mandala}.json`);
  const jsonData = await fs.readFile(filePath, 'utf8');
  const data = JSON.parse(jsonData) as { hymns: Hymn[] };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Mandala {mandala}</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {data.hymns.map((hymn: Hymn) => (
          <Link key={hymn.sukta} href={`/${mandala}/${hymn.sukta}`} className="group block">
            <div className="m-card m-elevation-1 p-5 hover:m-elevation-2 transition-shadow">
              <div className="font-semibold text-lg">Hymn {hymn.sukta}</div>
              <div className="text-sm text-muted">{hymn.title}</div>
              <div className="mt-4 space-y-1 text-xs text-primary">
                {hymn.group && <div>Hymn Group: <span className="text-foreground">{hymn.group}</span></div>}
                {hymn.stanzas && <div>Stanzas: <span className="text-foreground">{hymn.stanzas}</span></div>}
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
