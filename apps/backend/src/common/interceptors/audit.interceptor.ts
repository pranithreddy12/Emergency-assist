import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
  Logger,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Request } from 'express';
import { PrismaService } from '../../prisma/prisma.service';

const MUTATING = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);

/**
 * HIPAA-inspired audit trail. Records every state-changing request — who, what
 * action, which resource, from where — WITHOUT ever persisting request bodies
 * (which may contain credentials or PHI). Writes are fire-and-forget so they
 * never delay the response or fail the request.
 */
@Injectable()
export class AuditInterceptor implements NestInterceptor {
  private readonly logger = new Logger(AuditInterceptor.name);

  constructor(private readonly prisma: PrismaService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    if (context.getType() !== 'http') return next.handle();

    const req = context.switchToHttp().getRequest<Request>();
    if (!MUTATING.has(req.method)) return next.handle();

    const user = (req as Request & { user?: { userId?: string } }).user;
    const userId = user?.userId;
    const action = `${req.method} ${req.route?.path ?? req.path}`;
    const resource = req.path;
    const ip = req.ip;
    // Only non-sensitive route params are recorded — never the body.
    const meta = { params: req.params };

    return next.handle().pipe(
      tap({
        next: () => this.record(action, resource, userId, ip, meta),
        error: () => this.record(`${action} [failed]`, resource, userId, ip, meta),
      }),
    );
  }

  private record(
    action: string,
    resource: string,
    userId: string | undefined,
    ip: string | undefined,
    meta: Record<string, unknown>,
  ): void {
    this.prisma.auditLog
      .create({ data: { action, resource, userId, ip, meta: meta as never } })
      .catch((err) => this.logger.error('Audit write failed', err as Error));
  }
}
