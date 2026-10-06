import { Module } from '@nestjs/common';
import { InputResolverService } from './input-resolver.service.js';
import { IssuerDetectorService } from './issuer-detector.service.js';
import { VerifierRegistryService } from './verifier-registry.service.js';
import { VerificationOrchestratorService } from './verification-orchestrator.service.js';
import { VerificationProcessor } from './verification.processor.js';
import { VerificationsController } from './verifications.controller.js';

@Module({
  controllers: [VerificationsController],
  providers: [
    InputResolverService,
    IssuerDetectorService,
    VerifierRegistryService,
    VerificationOrchestratorService,
    VerificationProcessor,
  ],
  exports: [VerificationOrchestratorService],
})
export class VerificationModule {}
