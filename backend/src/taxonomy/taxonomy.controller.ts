import { Controller, Get } from '@nestjs/common';
import { DirectusService } from '../directus/directus.service';

// Reference data - no lifecycle/status column, read in full.
@Controller()
export class TaxonomyController {
  constructor(private readonly directus: DirectusService) {}

  @Get('categories')
  categories() {
    return this.directus.get('/items/categories', { query: { fields: '*', limit: -1 } });
  }

  @Get('occasions')
  occasions() {
    return this.directus.get('/items/occasions', { query: { fields: '*', limit: -1 } });
  }
}
