import 'reflect-metadata';
import './platform/config/load-dotenv.bootstrap.js';
import cors from '@fastify/cors';
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
    { bufferLogs: true },
  );

  app.useLogger(app.get(PinoLogger));
  await app.register(cors as never, {
    origin: env.CORS_ORIGINS.split(',').map((o) => o.trim()),
    credentials: true,
  });

  const openApi = new DocumentBuilder()
    .setTitle('Credential Verification Platform')
    .setDescription('Adapter-based, provider-independent verification of external credentials.')
    .setVersion(env.APP_VERSION)
    .build();
  const document = SwaggerModule.createDocument(app, openApi);
  SwaggerModule.setup('api/docs', app, document, { jsonDocumentUrl: 'api/docs-json' });

  app.enableShutdownHooks();
  await app.listen(env.PORT, env.HOST);

  Logger.log(`credential-verifier listening on http://${env.HOST}:${String(env.PORT)}`);
}

bootstrap().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
