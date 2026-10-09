import 'reflect-metadata';
import './platform/config/load-dotenv.bootstrap.js';
import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module.js';

/** Runs the BullMQ workers only — no HTTP server. Deployed as a separate process from main.ts. */
async function bootstrap(): Promise<void> {
  await NestFactory.createApplicationContext(AppModule, { bufferLogs: true });
  Logger.log('credential-verifier worker started.');
}

bootstrap().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
