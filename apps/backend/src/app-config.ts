import { INestApplication, ValidationPipe } from '@nestjs/common';
import helmet from 'helmet';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';

/**
 * Applies the production HTTP configuration (prefix, security headers, CORS,
 * validation, error filter). Shared by main.ts and the e2e tests so the two can
 * never drift — the e2e exercises the exact same security middleware as prod.
 */
export function configureApp(app: INestApplication): string {
  const prefix = process.env.API_PREFIX ?? 'api/v1';
  app.setGlobalPrefix(prefix);

  // Security headers. crossOriginResourcePolicy relaxed so the SPA/mobile can
  // read API responses cross-origin.
  app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));

  // CORS: reflect only explicitly-allowed origins (never a wildcard with
  // credentials). Set ALLOWED_ORIGINS as a comma-separated list in production.
  const allowed = (process.env.ALLOWED_ORIGINS ?? '')
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean);
  app.enableCors({
    origin: (origin, cb) => {
      if (!origin || allowed.length === 0 || allowed.includes(origin)) {
        return cb(null, true);
      }
      return cb(new Error(`Origin ${origin} not allowed by CORS`), false);
    },
    credentials: true,
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );
  app.useGlobalFilters(new HttpExceptionFilter());

  return prefix;
}
