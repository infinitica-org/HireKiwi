import { Module } from '@nestjs/common';
import { PrismaModule } from '../../platform/prisma/prisma.module.js';
import { IrtCalibrationService } from './irt-calibration.service.js';
import { IrtValidationService } from './irt-validation.service.js';

/**
 * Shadow IRT calibration + validation. Nothing exported here is wired into
 * v1 scoring or certificate issuance — see IrtCalibrationService's header
 * for the scope boundary.
 *
 * Owner: Ramansh.
 */
@Module({
  imports: [PrismaModule],
  providers: [IrtCalibrationService, IrtValidationService],
  exports: [IrtCalibrationService, IrtValidationService],
})
export class IrtModule {}
