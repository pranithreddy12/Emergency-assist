import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { PrismaService } from './prisma/prisma.service';
import { Public } from './common/decorators/public.decorator';

@ApiTags('health')
@Controller('health')
export class HealthController {
  constructor(private readonly prisma: PrismaService) {}

  @Public()
  @Get()
  @ApiOperation({ summary: 'Liveness + DB connectivity probe' })
  async check() {
    // The DB check is time-boxed: when Postgres is unreachable Prisma can block
    // for a long time, which would stall k8s probes and trigger needless pod
    // restarts. Always answer quickly, reporting the DB as down instead.
    const db = await this.pingDb(2000);
    return { status: 'ok', db, time: new Date().toISOString() };
  }

  private async pingDb(timeoutMs: number): Promise<'up' | 'down'> {
    let timer: NodeJS.Timeout | undefined;
    try {
      const timeout = new Promise<never>((_, reject) => {
        timer = setTimeout(() => reject(new Error('db ping timeout')), timeoutMs);
      });
      await Promise.race([this.prisma.$queryRaw`SELECT 1`, timeout]);
      return 'up';
    } catch {
      return 'down';
    } finally {
      if (timer) clearTimeout(timer);
    }
  }
}
