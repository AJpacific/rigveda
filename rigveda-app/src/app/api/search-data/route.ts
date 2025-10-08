import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

export async function GET() {
  try {
    const filePath = path.join(process.cwd(), 'src', 'data', 'rigveda_complete.json');
    const fileContent = await fs.readFile(filePath, 'utf-8');
    const rigvedaData = JSON.parse(fileContent);
    return NextResponse.json(rigvedaData);
  } catch (error) {
    console.error('Error loading search data:', error);
    return NextResponse.json({ error: 'Failed to load data' }, { status: 500 });
  }
}
