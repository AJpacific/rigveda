import fs from 'fs/promises';
import path from 'path';
import Link from 'next/link';
import type { RigvedaData, Hymn } from '../../types/rigveda';

export async function generateStaticParams() {
  return Array.from({ length: 10 }, (_, i) => ({ mandala: (i + 1).toString() }));
}

export default async function MandalaPage({ params }: { params: Promise<{ mandala: string }> }) {
  const { mandala: mandalaStr } = await params;
  const mandala = parseInt(mandalaStr, 10);
  
  const filePath = path.join(process.cwd(), 'src/data', 'rigveda_complete.json');
  const jsonData = await fs.readFile(filePath, 'utf8');
  const data = JSON.parse(jsonData) as RigvedaData;
  
  const mandalaData = data.mandalas.find(m => m.mandala_number === mandala);
  if (!mandalaData) {
    return <div>Mandala not found</div>;
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Mandala {mandala} ({mandalaData.hymns.length} hymns)</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {mandalaData.hymns.map((hymn: Hymn) => (
          <Link key={hymn.hymn_number} href={`/${mandala}/${hymn.hymn_number}`} className="group block">
            <div className="m-card m-elevation-1 p-5 hover:m-elevation-2 transition-shadow">
              <div className="font-semibold text-lg">Hymn {hymn.hymn_number}</div>
              <div className="text-sm text-muted">{hymn.addressee}</div>
              <div className="mt-4 space-y-1 text-xs text-primary">
                <div>Hymn Group: <span className="text-foreground">{hymn.group_name}</span></div>
                <div>Verses: <span className="text-foreground">{hymn.verses.length}</span></div>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
