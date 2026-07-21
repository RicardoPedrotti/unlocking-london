// Content shapes returned to the app. Mirrors app/src/lib/types.ts.
// Directus ids are integers; serialized as-is (app treats id as string | number).

export type Status = 'draft' | 'published' | 'archived';
export type PriceBand = '£' | '££' | '£££' | '££££';

export interface Category {
  id: number | string;
  name: string;
  slug: string;
  pin_icon: string;
  pin_color: string;
}

export interface Tag {
  id: number | string;
  name: string;
  slug: string;
}

export interface Occasion {
  id: number | string;
  name: string;
  slug: string;
}

export interface Review {
  id: number | string;
  place: number | string;
  body: string;
  verdict?: string | null;
  pull_quote?: string | null;
  author?: string | null;
  images?: string[] | null;
  published_at?: string | null;
  status: Status;
}

export interface Place {
  id: number | string;
  title: string;
  slug: string;
  category: Category | number | string;
  area: string;
  geo: { lat: number; lng: number };
  address?: string | null;
  price_band?: PriceBand | null;
  hero_image?: string | null; // Directus file id
  gallery?: string[] | null;
  opening_hours?: Record<string, string> | null;
  booking_url?: string | null;
  external_ids?: Record<string, string> | null;
  status: Status;
  tags: Tag[];
  occasions: Occasion[];
  reviews: Review[];
}

export interface TasteProfile {
  id: number | string;
  user: string;
  onboarding: {
    cuisines?: string[];
    price_bands?: PriceBand[];
    vibes?: string[];
    occasions?: string[];
  };
  updated_at?: string;
}
