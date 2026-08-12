import type en from './dictionaries/en';

// Deep-maps en's literal string values to `string` so hi.ts (and future
// language files) are structurally required to cover every key en.ts has,
// with a plain string value — a missing or mistyped key fails `tsc` instead
// of silently falling back to English at runtime.
type DeepStringify<T> = { [K in keyof T]: T[K] extends string ? string : DeepStringify<T[K]> };

export type Dictionary = DeepStringify<typeof en>;

type Join<K, P> = K extends string ? (P extends string ? `${K}.${P}` : never) : never;

type Paths<T> = {
  [K in keyof T]: T[K] extends string ? K : Join<K, Paths<T[K]>>;
}[keyof T];

export type TranslationKey = Paths<typeof en>;
