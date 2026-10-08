import { Controller, Get, Inject, Param, Post, Body } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { API_PREFIX } from '@hirekiwi/contracts';
import { AuditAccess } from '../../common/decorators/audit-access.decorator.js';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';
import { Roles } from '../../common/guards/roles.decorator.js';
import type { RequestUser } from '../../common/guards/jwt-auth.guard.js';
import { EvidenceService } from '../evidence/evidence.service.js';
import { SkillLevelExplanationService } from '../evidence/skill-level-explanation.service.js';

/**
 * Moved out of `placement` (S8-VV-P1, cleanup plan C06): a candidate's
 * evidence/education/claims/skills are inspected here by TPO staff, companies
 * and B2B partners alike — "candidate inspection" is a neutral home that
 * doesn't imply the TPO-mediated placement flow being retired around it.
 *
 * No class-level TenantScopeGuard: every route here also serves COMPANY,
 * B2B_PARTNER and SUPER_ADMIN callers, who have no institution.
 */
@ApiTags('candidate-inspection')
@Controller(`${API_PREFIX}/candidate-inspection`)
export class CandidateInspectionController {
  constructor(
    @Inject(EvidenceService) private readonly evidence: EvidenceService,
    @Inject(SkillLevelExplanationService)
    private readonly skillExplanation: SkillLevelExplanationService,
  ) {}

  @Get(':studentId/evidence')
  @Roles('INSTITUTION_ADMIN', 'PLACEMENT_STAFF', 'COMPANY', 'B2B_PARTNER', 'SUPER_ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get candidate evidence records categorized by provenance (VER-01).' })
  getCandidateEvidenceProvenance(
    @CurrentUser() user: RequestUser,
    @Param('studentId') studentId: string,
  ) {
    return this.evidence.getCandidateEvidenceProvenance(user, studentId);
  }

  @Get(':studentId/education')
  @Roles('INSTITUTION_ADMIN', 'PLACEMENT_STAFF', 'COMPANY', 'B2B_PARTNER', 'SUPER_ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: "Get a candidate's relevant education and evidence (T2)." })
  getCandidateEducation(@CurrentUser() user: RequestUser, @Param('studentId') studentId: string) {
    return this.evidence.getCandidateEducation(user, studentId);
  }

  @Get(':studentId/claims')
  @Roles('INSTITUTION_ADMIN', 'PLACEMENT_STAFF', 'COMPANY', 'B2B_PARTNER', 'SUPER_ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get verification status for candidate individual skill claims (T3).' })
  getCandidateSkillClaims(@CurrentUser() user: RequestUser, @Param('studentId') studentId: string) {
    return this.evidence.getCandidateSkillClaims(user, studentId);
  }

  @Get(':studentId/skills')
  @Roles('INSTITUTION_ADMIN', 'PLACEMENT_STAFF', 'COMPANY', 'B2B_PARTNER', 'SUPER_ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: "Get a candidate's demonstrated skills and proficiency level (T4)." })
  getCandidateDemonstratedSkills(
    @CurrentUser() user: RequestUser,
    @Param('studentId') studentId: string,
  ) {
    return this.evidence.getCandidateDemonstratedSkills(user, studentId);
  }

  @Get(':studentId/skills/:skillCode/explanation')
  @Roles('INSTITUTION_ADMIN', 'PLACEMENT_STAFF', 'COMPANY', 'B2B_PARTNER', 'SUPER_ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get explanation for a candidate skill (T5).' })
  getCandidateSkillExplanation(
    @CurrentUser() user: RequestUser,
    @Param('studentId') studentId: string,
    @Param('skillCode') skillCode: string,
  ) {
    return this.skillExplanation.getCandidateSkillExplanation(user, studentId, skillCode);
  }

  @Post(':studentId/evidence/:evidenceId/review')
  @Roles('INSTITUTION_ADMIN', 'PLACEMENT_STAFF', 'SUPER_ADMIN')
  @ApiBearerAuth()
  @ApiOperation({
    summary:
      'Reviewer marks candidate evidence accepted, rejected, or needing information (VER-01).',
  })
  reviewCandidateEvidence(
    @CurrentUser() user: RequestUser,
    @Param('studentId') studentId: string,
    @Param('evidenceId') evidenceId: string,
    @Body() body: unknown,
  ) {
    return this.evidence.reviewEvidence(user, studentId, evidenceId, body);
  }

  @Get(':studentId/evidence/:evidenceId/versions')
  @AuditAccess('evidence', 'evidenceId', {
    action: 'evidence.accessed',
    subjectParam: 'studentId',
  })
  @Roles('INSTITUTION_ADMIN', 'PLACEMENT_STAFF', 'COMPANY', 'B2B_PARTNER', 'SUPER_ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List historical evidence versions for a candidate (VER-01).' })
  listCandidateEvidenceVersions(
    @CurrentUser() user: RequestUser,
    @Param('studentId') studentId: string,
    @Param('evidenceId') evidenceId: string,
  ) {
    return this.evidence.listCandidateEvidenceVersions(user, studentId, evidenceId);
  }

  @Get(':studentId/evidence/:evidenceId/versions/:versionNumber')
  @AuditAccess('evidence', 'evidenceId', {
    action: 'evidence.accessed',
    subjectParam: 'studentId',
  })
  @Roles('INSTITUTION_ADMIN', 'PLACEMENT_STAFF', 'COMPANY', 'B2B_PARTNER', 'SUPER_ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get a specific historical evidence version (VER-01).' })
  getCandidateEvidenceVersion(
    @CurrentUser() user: RequestUser,
    @Param('studentId') studentId: string,
    @Param('evidenceId') evidenceId: string,
    @Param('versionNumber') versionNumber: string,
  ) {
    return this.evidence.getCandidateEvidenceVersion(
      user,
      studentId,
      evidenceId,
      Number.parseInt(versionNumber, 10),
    );
  }

  @Get('_meta')
  meta() {
    return {
      module: 'candidate-inspection',
      owner: 'placement',
      purpose: 'Third-party (TPO/company) read access to a candidate evidence trail.',
      status: 'active',
    };
  }
}
