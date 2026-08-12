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
  'Wheat': 'https://commons.wikimedia.org/wiki/Special:FilePath/Wheat_close-up.JPG',
  'Rice': 'https://commons.wikimedia.org/wiki/Special:FilePath/Rice_grains.jpg',
  'Tomato': 'https://commons.wikimedia.org/wiki/Special:FilePath/Tomato_je.jpg',
  'Potato': 'https://commons.wikimedia.org/wiki/Special:FilePath/Solanum_tuberosum_002.JPG',
  'Onion': 'https://commons.wikimedia.org/wiki/Special:FilePath/Red_Onions.jpg',
  'Cotton': 'https://commons.wikimedia.org/wiki/Special:FilePath/Cotton_flower.jpg',
  'Maize': 'https://commons.wikimedia.org/wiki/Special:FilePath/Corncobs.jpg',
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
