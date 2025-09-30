import fs from 'fs/promises';
import path from 'path';
import HymnClient from './HymnClient';
import type { Hymn } from '../../../types/rigveda';

export async function generateStaticParams() {
  const params: { mandala: string; sukta: string }[] = [];
  for (let m = 1; m <= 10; m++) {
    const filePath = path.join(process.cwd(), 'src/data', `mandala${m}.json`);
    const jsonData = await fs.readFile(filePath, 'utf8');
    const data = JSON.parse(jsonData) as { hymns: Hymn[] };
    data.hymns.forEach((hymn: Hymn) => {
      params.push({ mandala: m.toString(), sukta: hymn.sukta.toString() });
    });
  }
  return params;
}

export default async function HymnPage({ params }: { params: Promise<{ mandala: string; sukta: string }> }) {
  const { mandala: mandalaStr, sukta: suktaStr } = await params;
  const mandala = parseInt(mandalaStr, 10);
  const sukta = parseInt(suktaStr, 10);
  const filePath = path.join(process.cwd(), 'src/data', `mandala${mandala}.json`);
  const jsonData = await fs.readFile(filePath, 'utf8');
  const data = JSON.parse(jsonData) as { hymns: Hymn[] };
  const hymns: Hymn[] = data.hymns;
  const index = hymns.findIndex((h) => h.sukta === sukta);
  const hymn = hymns[index];

  if (!hymn) {
    return <div>Hymn not found</div>;
  }

  const prevPath = index > 0 ? `/${mandala}/${hymns[index - 1].sukta}` : null;
  const nextPath = index < hymns.length - 1 ? `/${mandala}/${hymns[index + 1].sukta}` : null;

  return (
    <HymnClient
      hymn={hymn}
      mandala={mandala}
      sukta={sukta}
      prevPath={prevPath}
      nextPath={nextPath}
    />
  );
}
