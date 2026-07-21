import { Controller, Get } from '@nestjs/common';

// Liveness probe. Railway hits /v1/health (see railway.json). No auth, no I/O -
// just proves the process is up and serving.
@Controller('health')
export class HealthController {
  @Get()
  check() {
    return { status: 'ok' };
  }
}
