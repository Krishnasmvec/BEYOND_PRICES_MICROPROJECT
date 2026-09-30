export interface Language {
  code: string;
  label: string;
}

// Structure is generic per-language-file — adding Tamil, Punjabi, Marathi
// etc. later is a new dictionary file plus one entry here, no other code
// changes. English + Hindi ship first per the confirmed scope.
export const SUPPORTED_LANGUAGES: Language[] = [
  { code: 'en', label: 'English' },
  { code: 'hi', label: 'हिन्दी' },
];

export const DEFAULT_LANGUAGE = 'en';
