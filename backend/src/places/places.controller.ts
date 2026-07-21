import { Controller, Get, Param } from '@nestjs/common';
import { PlacesService } from './places.service';

@Controller('places')
export class PlacesController {
  constructor(private readonly places: PlacesService) {}

  @Get()
  findAll() {
    return this.places.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.places.findOne(id);
  }
}
