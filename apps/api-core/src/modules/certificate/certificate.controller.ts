import { Body, Controller, Get, Inject, Param, Patch, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { API_PREFIX } from '@hirekiwi/contracts';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';
import { Public } from '../../common/guards/public.decorator.js';
import type { RequestUser } from '../../common/guards/jwt-auth.guard.js';
import { CertificateService } from './certificate.service.js';

@ApiTags('certificate')
@Controller(API_PREFIX)
export class CertificateController {
  constructor(@Inject(CertificateService) private readonly service: CertificateService) {}

  @Get('certificate/_meta')
  meta() {
    return this.service.getMeta();
  }

  @Get('certificates/mine')
  async mine(@CurrentUser() user: RequestUser) {
    return this.service.getStudentCertificates(user.sub);
  }

  @Patch('certificates/:certificateId/visibility')
  async setVisibility(
    @CurrentUser() user: RequestUser,
    @Param('certificateId') certificateId: string,
    @Body() body: { isPublic: boolean },
  ) {
    return this.service.updateVisibility(certificateId, user.sub, body.isPublic);
  }

  @Get('certificates/:certificateId/pdf')
  async getPdf(@CurrentUser() user: RequestUser, @Param('certificateId') certificateId: string) {
    return this.service.getPdfDownloadUrl(certificateId, user.sub);
  }

  @Public()
  @Get('verify/:certificateId')
  async verify(@Param('certificateId') certificateId: string, @Query('sig') sig?: string) {
    return this.service.getPublicVerification(certificateId, sig);
  }
}
