import { Module } from '@nestjs/common';
import { EvidenceModule } from '../evidence/evidence.module.js';
import { CandidateInspectionController } from './candidate-inspection.controller.js';

@Module({
  imports: [EvidenceModule],
  controllers: [CandidateInspectionController],
})
export class CandidateInspectionModule {}
