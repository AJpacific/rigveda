import { NextRequest, NextResponse } from 'next/server';

const VEDAWEB_API = 'http://vedaweb.uni-koeln.de/rigveda/api/document/id';

interface GrammarToken {
  form: string;
  [key: string]: unknown;
}

interface PadaData {
  grammarData: GrammarToken[];
}

interface VersionData {
  type: string;
  id: string;
  form: string[];
  source: string;
  language: string;
  metricalData?: string[];
  [key: string]: unknown;
}

function formatDocId(mandala: number, hymn: number, verse: number): string {
  const m = String(mandala).padStart(2, '0');
  const h = String(hymn).padStart(3, '0');
  const v = String(verse).padStart(2, '0');
  return `${m}${h}${v}`;
}

function extractSanskrit(padas: PadaData[]): string {
  if (!padas || !Array.isArray(padas)) return "";
  return padas.map(pada => 
    pada.grammarData.map((token: GrammarToken) => token.form || "").join(" ")
  ).join(" | ");
}

function getVersion(versions: VersionData[], type: string, id?: string): VersionData | undefined {
  if (!versions || !Array.isArray(versions)) return undefined;
  return versions.find(v => v.type === type && (id ? v.id === id : true));
}

function getMetricalData(versions: VersionData[]): string | undefined {
  if (!versions || !Array.isArray(versions)) return undefined;
  const lubotskyVersion = versions.find(v => v.id === "version_lubotskyzurich" && v.metricalData);
  // Join with <br /> to preserve pada structure instead of spaces
  return lubotskyVersion ? lubotskyVersion.metricalData?.join("<br />") : undefined;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const mandala = searchParams.get("mandala");
    const hymn = searchParams.get("hymn");
    const verse = searchParams.get("verse");

    if (!mandala || !hymn || !verse) {
      return NextResponse.json(
        { error: "Missing required parameters: mandala, hymn, verse" },
        { status: 400 }
      );
    }

    const mandalaNum = parseInt(mandala);
    const hymnNum = parseInt(hymn);
    const verseNum = parseInt(verse);

    if (isNaN(mandalaNum) || isNaN(hymnNum) || isNaN(verseNum)) {
      return NextResponse.json(
        { error: "Invalid parameters: must be numbers" },
        { status: 400 }
      );
    }

    if (mandalaNum < 1 || mandalaNum > 10 || hymnNum < 1 || verseNum < 1) {
      return NextResponse.json(
        { error: "Parameters out of range" },
        { status: 400 }
      );
    }

    const docId = formatDocId(mandalaNum, hymnNum, verseNum);

    const response = await fetch(`${VEDAWEB_API}/${docId}`, {
      headers: {
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      console.error(`VedaWeb API error: ${response.status} ${response.statusText}`);
      return NextResponse.json(
        { error: `Failed to fetch verse data: ${response.status}` },
        { status: response.status }
      );
    }

    const data = await response.json();

    // Extract and structure the data
    // const sanskritText = extractSanskrit(data.padas);
    const transliterationVersion = getVersion(data.versions, "version", "version_lubotskyzurich");
    
    // Fallback: if specific transliteration not found, try to find any version with transliteration-like language
    let finalTransliterationVersion = transliterationVersion;
    if (!finalTransliterationVersion) {
      const fallbackTransliteration = data.versions?.find((v: VersionData) => 
        v.type === "version" && 
        (v.language?.includes('Latn') || v.language?.includes('transliteration') || v.id?.includes('lubotsky'))
      );
      finalTransliterationVersion = fallbackTransliteration;
    }
    const englishTranslationVersion = getVersion(data.versions, "translation", "translation_griffith");
    const sanskritVersion = getVersion(data.versions, "version", "version_eichler");
    const metricalData = getMetricalData(data.versions);

    const verseData = {
      // Basic identification
      mandala: mandalaNum,
      hymn: hymnNum,
      verse: verseNum,
      docId: docId,
      
      // Text content
      sanskrit: sanskritVersion?.form?.join("<br />") || "Sanskrit text not available",
      sanskritSource: sanskritVersion?.source || "D. Eichler",
      sanskritLanguage: sanskritVersion?.language || "san-Deva",
      
      transliteration: finalTransliterationVersion?.form?.join("<br />") || "Transliteration not available",
      transliterationSource: finalTransliterationVersion?.source || "Lubotsky, Zurich",
      
      // Translations
      translations: {
        english: englishTranslationVersion?.form?.join(" ") || "English translation not available",
        author: englishTranslationVersion?.source || "Ralph Griffith"
      },
      
      // Metadata
      deity: data.hymnAddressee || "N/A",
      poetFamily: data.hymnGroup || "N/A",
      seer: data.hymnAuthor || "N/A",
      meter: data.stanzaType || data.hymnMeter || "N/A",
      strata: data.strata || "N/A",
      
      // Advanced data
      metricalData: metricalData,
      padas: data.padas || [],
      versions: data.versions || [],
      externalResources: data.externalResources || [],
      
      // Raw data for advanced analysis
      rawData: data
    };

    return NextResponse.json({ data: verseData });

  } catch (error) {
    console.error('Error in verse API route:', error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
