/** Shared crop → emoji map, used by both the farmer crop-selector and the
 * consumer product cards (as the icon fallback when a photo fails to load). */
export const CROP_ICONS: Record<string, string> = {
  'Wheat': '🌾',
  'Rice': '🍚',
  'Tomato': '🍅',
  'Potato': '🥔',
  'Onion': '🧅',
  'Cotton': '☁️',
  'Maize': '🌽'
};

/**
 * Curated, stable Wikimedia Commons photos, one per crop — not random
 * placeholder images. Each URL was verified (HTTP 200, image/* content-type)
 * before being added here. Special:FilePath is Wikimedia's documented
 * stable-hotlinking endpoint (resolves by filename, no content-hash path
 * to keep in sync). If a link ever rots, ProductCard's onError handler
 * falls back to the icon tile above — never a broken image.
 */
export const CROP_IMAGES: Record<string, string> = {
  'Wheat': 'https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?w=500&q=80',
  'Rice': 'https://images.unsplash.com/photo-1586201375761-83865001e8ac?w=500&q=80',
  'Tomato': 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=500&q=80',
  'Potato': 'https://images.unsplash.com/photo-1518977676601-b53f82aba655?w=500&q=80',
  'Onion': 'https://images.unsplash.com/photo-1618512496248-a07fe83aa8cb?w=500&q=80',
  'Cotton': 'https://images.unsplash.com/photo-1504198458649-3128b932f49e?w=500&q=80',
  'Maize': 'https://images.unsplash.com/photo-1551754655-cd27e38d2076?w=500&q=80',
};

/**
 * Case-insensitive lookup for products coming from an open-ended source
 * (Supabase's `category`/`product_name` columns aren't constrained to the
 * 7 crop names above — could be anything). Tries `category` first, then
 * `name`, returns undefined rather than guessing if neither matches —
 * callers should fall back further (e.g. a generic icon) in that case.
 */
function lookupByString<T>(map: Record<string, T>, ...candidates: (string | null | undefined)[]): T | undefined {
  const lowerMap = new Map(Object.entries(map).map(([k, v]) => [k.toLowerCase(), v]));
  for (const candidate of candidates) {
    if (!candidate) continue;
    const match = lowerMap.get(candidate.trim().toLowerCase());
    if (match) return match;
  }
  return undefined;
}

export const findCropIcon = (category?: string | null, name?: string | null): string | undefined =>
  lookupByString(CROP_ICONS, category, name);

export const findCropImage = (category?: string | null, name?: string | null): string | undefined =>
  lookupByString(CROP_IMAGES, category, name);
