/**
 * Directus content types. Mirrors the collections in /directus/bootstrap.
 * Deferred features (favourites, lists, ratings, plans, swipes) are intentionally
 * absent — the shapes below are neutral so those collections slot in later.
 */

export type Status = 'draft' | 'published' | 'archived';
export type PriceBand = '£' | '££' | '£££' | '££££';

export interface Category {
  id: string;
  name: string;
  slug: string;
  /** SF Symbol name for the branded map pin. */
  pin_icon: string;
  /** Hex colour for the branded map pin. */
  pin_color: string;
}

export interface Tag {
  id: string;
  name: string;
  slug: string;
}

export interface Occasion {
  id: string;
  name: string;
  slug: string;
}

export interface Review {
  id: string;
  place: string;
  body: string;
  verdict?: string | null;
  pull_quote?: string | null;
  author?: string | null;
  images?: string[] | null;
  published_at?: string | null;
  status: Status;
}

export interface Place {
  id: string;
  title: string;
  slug: string;
  category: Category | string;
  area: string;
  /** { lat, lng } — required; the map depends on it. */
  geo: { lat: number; lng: number };
  address?: string | null;
  price_band?: PriceBand | null;
  hero_image?: string | null; // Directus file id
  gallery?: string[] | null;
  opening_hours?: Record<string, string> | null;
  booking_url?: string | null;
  external_ids?: Record<string, string> | null;
  status: Status;
  tags?: Tag[];
  occasions?: Occasion[];
  reviews?: Review[];
}

export interface TasteProfile {
  id: string;
  user: string;
  /** cuisines, price bands, vibes, occasions of interest */
  onboarding: {
    cuisines?: string[];
    price_bands?: PriceBand[];
    vibes?: string[];
    occasions?: string[];
  };
  updated_at?: string;
}
