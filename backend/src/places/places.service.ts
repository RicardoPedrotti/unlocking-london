import { Injectable, NotFoundException } from '@nestjs/common';
import { DirectusService } from '../directus/directus.service';
import { Place } from '../common/types';
// Single-source normalization (plain JS so the runnable check can import it).
import { normalizePlace } from '../common/normalize.js';

// Expansion per API_CONTRACT.md. `gallery.directus_files_id` added so the
// documented gallery flatten actually has data (bare `*` returns junction ids).
const FIELDS = '*,category.*,hero_image,gallery.directus_files_id,tags.tags_id.*,occasions.occasions_id.*,reviews.*';

@Injectable()
export class PlacesService {
  constructor(private readonly directus: DirectusService) {}

  async findAll(): Promise<Place[]> {
    const rows = await this.directus.get('/items/places', {
      query: { fields: FIELDS, 'filter[status][_eq]': 'published', limit: -1 },
    });
    return (rows ?? []).map(normalizePlace) as Place[];
  }

  async findOne(id: string): Promise<Place> {
    // Admin token bypasses the published filter, so enforce it here.
    const row = await this.directus.get(`/items/places/${id}`, { query: { fields: FIELDS } });
    if (!row || row.status !== 'published') throw new NotFoundException(`Place ${id} not found`);
    return normalizePlace(row) as Place;
  }
}
