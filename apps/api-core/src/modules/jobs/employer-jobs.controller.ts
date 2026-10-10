import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Inject,
  NotFoundException,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import {
  API_PREFIX,
  CreateEmployerJobRequestSchema,
  DuplicateEmployerJobRequestSchema,
  ListEmployerJobsQuerySchema,
  UpdateEmployerJobRequestSchema,
  UuidSchema,
  type CreateMatchRunResponse,
  type EmployerJobDto,
  type EmployerJobVisibility,
  type ListEmployerJobsResponse,
  type MatchRunDto,
} from '@hirekiwi/contracts';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';
import { Roles } from '../../common/guards/roles.decorator.js';
import type { RequestUser } from '../../common/guards/jwt-auth.guard.js';
import { EmployerJobsService } from './employer-jobs.service.js';

function jobIdOrNotFound(id: string): string {
  const parsed = UuidSchema.safeParse(id);
  if (!parsed.success) {
    throw new NotFoundException({ error: 'not_found', message: 'Job not found.', statusCode: 404 });
  }
  return parsed.data;
}

/** JOB-01 — employer job management. Authorisation is the company permission map in the service. */
@ApiTags('jobs')
@ApiBearerAuth()
@Controller(`${API_PREFIX}/employer/jobs`)
@Roles('COMPANY')
export class EmployerJobsController {
  constructor(@Inject(EmployerJobsService) private readonly jobs: EmployerJobsService) {}

  @Get()
  @ApiOperation({ summary: 'List the company jobs with applicant counts.' })
  list(
    @CurrentUser() user: RequestUser,
    @Query() query: Record<string, string | undefined>,
  ): Promise<ListEmployerJobsResponse> {
    return this.jobs.list(user.sub, ListEmployerJobsQuerySchema.parse(query));
  }

  @Post()
  @ApiOperation({ summary: 'Create a DRAFT job for a campus the company has access to.' })
  create(@CurrentUser() user: RequestUser, @Body() body: unknown): Promise<EmployerJobDto> {
    return this.jobs.create(user.sub, CreateEmployerJobRequestSchema.parse(body));
  }

  @Get(':id/visibility')
  @ApiOperation({ summary: 'Is this job live for students, and why or why not.' })
  visibility(
    @CurrentUser() user: RequestUser,
    @Param('id') id: string,
  ): Promise<EmployerJobVisibility> {
    return this.jobs.visibility(user.sub, jobIdOrNotFound(id));
  }

  @Get(':id')
  @ApiOperation({ summary: 'One of the company jobs.' })
  get(@CurrentUser() user: RequestUser, @Param('id') id: string): Promise<EmployerJobDto> {
    return this.jobs.get(user.sub, jobIdOrNotFound(id));
  }

  /** JOB-03 — trigger an AI-suggested-candidates run for this job (company-facing match run). */
  @Post(':id/match-runs')
  @HttpCode(202)
  @ApiOperation({ summary: 'Trigger an AI-suggested-candidates run for this job.' })
  createMatchRun(
    @CurrentUser() user: RequestUser,
    @Param('id') id: string,
  ): Promise<CreateMatchRunResponse> {
    return this.jobs.createMatchRunForJob(user.sub, jobIdOrNotFound(id));
  }

  @Get(':id/match-runs/:runId')
  @ApiOperation({ summary: 'Poll the status/result of an AI-suggested-candidates run.' })
  getMatchRun(
    @CurrentUser() user: RequestUser,
    @Param('id') id: string,
    @Param('runId') runId: string,
  ): Promise<MatchRunDto> {
    return this.jobs.getMatchRunForJob(user.sub, jobIdOrNotFound(id), jobIdOrNotFound(runId));
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Edit a DRAFT or OPEN job.' })
  update(
    @CurrentUser() user: RequestUser,
    @Param('id') id: string,
    @Body() body: unknown,
  ): Promise<EmployerJobDto> {
    return this.jobs.update(
      user.sub,
      jobIdOrNotFound(id),
      UpdateEmployerJobRequestSchema.parse(body),
    );
  }

  @Delete(':id')
  @HttpCode(204)
  @ApiOperation({ summary: 'Delete a DRAFT job with no applications.' })
  remove(@CurrentUser() user: RequestUser, @Param('id') id: string): Promise<void> {
    return this.jobs.remove(user.sub, jobIdOrNotFound(id));
  }

  @Post(':id/publish')
  @HttpCode(200)
  @ApiOperation({
    summary: 'Publish a DRAFT job (company verification).',
  })
  publish(@CurrentUser() user: RequestUser, @Param('id') id: string): Promise<EmployerJobDto> {
    return this.jobs.publish(user.sub, jobIdOrNotFound(id));
  }

  @Post(':id/close')
  @HttpCode(200)
  @ApiOperation({ summary: 'Close an OPEN job; applicants are kept.' })
  close(@CurrentUser() user: RequestUser, @Param('id') id: string): Promise<EmployerJobDto> {
    return this.jobs.close(user.sub, jobIdOrNotFound(id));
  }

  @Post(':id/duplicate')
  @ApiOperation({ summary: 'Copy a job into a new DRAFT, optionally for another campus.' })
  duplicate(
    @CurrentUser() user: RequestUser,
    @Param('id') id: string,
    @Body() body: unknown,
  ): Promise<EmployerJobDto> {
    return this.jobs.duplicate(
      user.sub,
      jobIdOrNotFound(id),
      DuplicateEmployerJobRequestSchema.parse(body ?? {}),
    );
  }
}
