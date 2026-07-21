import { Controller, Get, Param, Query, Res } from '@nestjs/common';
import { Response } from 'express';
import { DirectusService } from '../directus/directus.service';

// Streams Directus assets so the R2/Directus bucket stays private - the app
// only ever hits this backend. Transform params are passed through.
@Controller('assets')
export class AssetsController {
  constructor(private readonly directus: DirectusService) {}

  @Get(':id')
  async get(
    @Param('id') id: string,
    @Res() res: Response,
    @Query('width') width?: string,
    @Query('height') height?: string,
    @Query('quality') quality?: string,
    @Query('fit') fit?: string,
  ): Promise<void> {
    const upstream = await this.directus.assetResponse(id, { width, height, quality, fit });
    res.setHeader('Content-Type', upstream.headers.get('content-type') ?? 'application/octet-stream');
    const cacheControl = upstream.headers.get('cache-control');
    if (cacheControl) res.setHeader('Cache-Control', cacheControl);
    // ponytail: buffer the whole image (these are small). Switch to
    // Readable.fromWeb(upstream.body).pipe(res) if large originals appear.
    res.send(Buffer.from(await upstream.arrayBuffer()));
  }
}
