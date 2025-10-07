import fs from 'fs/promises';
import path from 'path';
import HymnClient from './HymnClient';
import type { RigvedaData, Hymn } from '../../../types/rigveda';

export async function generateStaticParams() {
  const params: { mandala: string; sukta: string }[] = [];
  const filePath = path.join(process.cwd(), 'src/data', 'rigveda_complete.json');
  const jsonData = await fs.readFile(filePath, 'utf8');
  const data = JSON.parse(jsonData) as RigvedaData;
  
  data.mandalas.forEach((mandala) => {
    mandala.hymns.forEach((hymn) => {
      params.push({ 
        mandala: mandala.mandala_number.toString(), 
        sukta: hymn.hymn_number.toString() 
      });
    });
  });
  return params;
}

export default async function HymnPage({ params }: { params: Promise<{ mandala: string; sukta: string }> }) {
  const { mandala: mandalaStr, sukta: suktaStr } = await params;
  const mandala = parseInt(mandalaStr, 10);
  const sukta = parseInt(suktaStr, 10);
  
  const filePath = path.join(process.cwd(), 'src/data', 'rigveda_complete.json');
  const jsonData = await fs.readFile(filePath, 'utf8');
  const data = JSON.parse(jsonData) as RigvedaData;
  
  const mandalaData = data.mandalas.find(m => m.mandala_number === mandala);
  if (!mandalaData) {
    return <div>Mandala not found</div>;
  }
  
  const hymns: Hymn[] = mandalaData.hymns;
  const index = hymns.findIndex((h) => h.hymn_number === sukta);
  const hymn = hymns[index];

  if (!hymn) {
    return <div>Hymn not found</div>;
  }

  const prevPath = index > 0 ? `/${mandala}/${hymns[index - 1].hymn_number}` : null;
  const nextPath = index < hymns.length - 1 ? `/${mandala}/${hymns[index + 1].hymn_number}` : null;

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
