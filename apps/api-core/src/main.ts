// Must be the first import: registers OpenTelemetry auto-instrumentation
// before fastify/pg/ioredis/kafkajs are required anywhere else. No-op unless
// OTEL_EXPORTER_OTLP_ENDPOINT is set — see tracing.ts.
import './tracing.js';
import 'reflect-metadata';
import './platform/config/load-dotenv.bootstrap.js';
import cookie from '@fastify/cookie';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import multipart from '@fastify/multipart';
import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { FastifyAdapter, type NestFastifyApplication } from '@nestjs/platform-fastify';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { Logger as PinoLogger } from 'nestjs-pino';
import { AppModule } from './app.module.js';
import { env } from './platform/config/env.js';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter({ trustProxy: true, logger: false }),
    // The JSON parser below keeps the raw body for webhook signatures (S6-VB-01). Nest's default
    // body parsers must stay off: with them on, app.listen() registers a second
    // application/json parser and boot fails with FST_ERR_CTP_ALREADY_PRESENT.
    { bufferLogs: true, bodyParser: false },
  );

  const fastifyInstance = app.getHttpAdapter().getInstance();
  if (fastifyInstance.hasContentTypeParser('application/json')) {
    fastifyInstance.removeContentTypeParser('application/json');
  }
  fastifyInstance.addContentTypeParser(
    'application/json',
    { parseAs: 'string' },
    (req: unknown, body: string, done: (err: Error | null, result?: unknown) => void) => {
      try {
        (req as Record<string, unknown>).rawBody = body;
        const json = JSON.parse(body || '{}') as unknown;
        done(null, json);
      } catch (err: unknown) {
        const error = err instanceof Error ? err : new Error('Invalid JSON');
        (error as unknown as Record<string, unknown>).statusCode = 400;
        done(error, undefined);
      }
    },
  );

  app.useLogger(app.get(PinoLogger));
  await app.register(helmet as never, { contentSecurityPolicy: false });
  await app.register(cookie as never);
  await app.register(multipart as never, { limits: { fileSize: 5 * 1024 * 1024 } });
  await app.register(cors as never, {
    origin: (origin: string | undefined, cb: (err: Error | null, allow: boolean) => void) => {
      if (!origin) return cb(null, true);
      const allowed = env.CORS_ORIGINS.split(',').map((o) => o.trim());
      if (
        allowed.includes(origin) ||
        /^http:\/\/localhost(:\d+)?$/.test(origin) ||
        /^http:\/\/127\.0\.0\.1(:\d+)?$/.test(origin)
      ) {
        return cb(null, true);
      }
      return cb(null, true);
    },
    credentials: true,
    methods: ['GET', 'HEAD', 'POST', 'PUT', 'PATCH', 'DELETE'],
  });

  const openApi = new DocumentBuilder()
    .setTitle('HireKiwi API')
    .setDescription(
      'Platform core for the HireKiwi Intellectual Talent Network & role-specific readiness certification. Health probes are unauthenticated; product routes use Bearer JWT.',
    )
    .setVersion(env.APP_VERSION)
    .addBearerAuth()
    .addTag('proctoring', 'HMAC integrity ingest, Blob HUD, CV checkpoints')
    .addTag('certificate', 'Issuance, visibility control, public verification')
    .addTag('webhooks', 'Outbound HMAC-SHA256 signed event delivery')
    .build();
  try {
    const document = SwaggerModule.createDocument(app, openApi);
    SwaggerModule.setup('api/docs', app, document, {
      jsonDocumentUrl: 'api/docs-json',
      swaggerOptions: { persistAuthorization: true },
    });
  } catch (error: unknown) {
    Logger.error(
      error instanceof Error ? error.message : error,
      error instanceof Error ? error.stack : undefined,
      'Swagger',
    );
  }

  app.enableShutdownHooks();
  await app.listen(env.PORT, env.HOST);

  Logger.log(`HireKiwi API listening on http://${env.HOST}:${String(env.PORT)} (${env.NODE_ENV})`);
  Logger.log(`Swagger UI at http://${env.HOST}:${String(env.PORT)}/api/docs`);
}

bootstrap().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
