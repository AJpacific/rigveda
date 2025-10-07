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
  verse_number: string;
  devanagari_text: string;
  griffith_translation: string;
  padapatha_text: string;
};

export type Hymn = {
  hymn_number: number;
  group_name: string;
  addressee: string;
  verses: Verse[];
  audio_url?: string;
};

export type Mandala = {
  mandala_number: number;
  hymns: Hymn[];
};

export type RigvedaData = {
  metadata: {
    title: string;
    total_mandalas: number;
    total_hymns: number;
    total_verses: number;
  };
  mandalas: Mandala[];
};


