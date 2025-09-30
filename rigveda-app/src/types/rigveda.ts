export type SanskritSepToken = {
  sep: string;
};

export type SanskritWordToken = {
  word: string;
  translit?: string;
  sep?: undefined;
};

export type SanskritToken = SanskritSepToken | SanskritWordToken;

export type Verse = {
  number: number;
  translation: string;
  sanskrit?: SanskritToken[];
  sanskrit_lines?: SanskritToken[][];
};

export type Hymn = {
  sukta: number;
  title: string;
  group?: string | null;
  stanzas?: number | null;
  verses: Verse[];
  audio?: string;
  verseTimecodes?: number[];
};


