import fs from 'fs/promises';
import path from 'path';
import Link from 'next/link';

export async function generateStaticParams() {
  return Array.from({ length: 10 }, (_, i) => ({ mandala: (i + 1).toString() }));
}

export default async function MandalaPage({ params }: { params: { mandala: string } }) {
  const mandala = parseInt(params.mandala);
  const filePath = path.join(process.cwd(), 'src/data', `mandala${mandala}.json`);
  const jsonData = await fs.readFile(filePath, 'utf8');
  const data = JSON.parse(jsonData);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Mandala {mandala}</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {data.hymns.map((hymn: any) => (
          <Link key={hymn.sukta} href={`/${mandala}/${hymn.sukta}`} className="group block">
            <div className="rounded-xl p-5 shadow-sm transition-all border border-[color:var(--burnt-umber)] bg-white text-[color:var(--midnight-blue)] hover:shadow-md">
              <div className="font-semibold text-lg">Hymn {hymn.sukta}</div>
              <div className="text-sm text-[color:var(--muted)]">{hymn.title}</div>
              <div className="mt-4 space-y-1 text-xs text-[color:var(--olive-green)]">
                {hymn.group && <div>Hymn Group: <span className="text-[color:var(--midnight-blue)]">{hymn.group}</span></div>}
                {hymn.stanzas && <div>Stanzas: <span className="text-[color:var(--midnight-blue)]">{hymn.stanzas}</span></div>}
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
