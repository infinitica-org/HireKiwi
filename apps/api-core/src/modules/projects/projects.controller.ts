import { Body, Controller, Delete, Get, HttpCode, Inject, Param, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import {
  API_PREFIX,
  type ListMyProjectsResponse,
  type ProjectDocumentDto,
  type ProjectDto,
  type ReplaceProjectResponse,
} from '@smart/contracts';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';
import type { RequestUser } from '../../common/guards/jwt-auth.guard.js';
import { Roles } from '../../common/guards/roles.decorator.js';
import { ProjectsService } from './projects.service.js';

@ApiTags('projects')
@Controller(`${API_PREFIX}/projects`)
export class ProjectsController {
  constructor(@Inject(ProjectsService) private readonly service: ProjectsService) {}

  @Get()
  @Roles('STUDENT')
  @ApiBearerAuth()
  @ApiOperation({ summary: "List the caller's own submitted projects, newest first." })
  listMine(@CurrentUser() user: RequestUser): Promise<ListMyProjectsResponse> {
    return this.service.listMine(user.sub);
  }

  @Post()
  @Roles('STUDENT')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a project from the CN-T08 template and enqueue SE-T03.' })
  @ApiResponse({ status: 201, description: 'Project row with status SUBMITTED (processing).' })
  @ApiResponse({ status: 422, description: 'Template fields failed validation.' })
  create(@CurrentUser() user: RequestUser, @Body() body: unknown): Promise<ProjectDto> {
    return this.service.create(user.sub, body);
  }

  @Get(':projectId')
  @Roles('STUDENT')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Project row plus verification report; poll while SUBMITTED.' })
  @ApiResponse({
    status: 200,
    description: 'Owned project. Report is null until SE-T03 writes it.',
  })
  @ApiResponse({ status: 403, description: 'JWT subject does not own this project.' })
  @ApiResponse({ status: 404, description: 'Unknown projectId.' })
  get(
    @CurrentUser() user: RequestUser,
    @Param('projectId') projectId: string,
  ): Promise<ProjectDto> {
    return this.service.getForStudent(user.sub, projectId);
  }

  @Post(':projectId/documents/upload-url')
  @Roles('STUDENT')
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Th6-600 — presigned PUT (15 min) for a PDF/PNG project evidence file, max 10 MB.',
  })
  @ApiResponse({ status: 201, description: 'Presigned upload URL and object key.' })
  createDocumentUploadUrl(
    @CurrentUser() user: RequestUser,
    @Param('projectId') projectId: string,
    @Body() body: unknown,
  ) {
    return this.service.createDocumentUploadUrl(user.sub, projectId, body);
  }

  @Post(':projectId/documents')
  @Roles('STUDENT')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Th6-600 — attach an uploaded evidence file to an owned project.' })
  @ApiResponse({ status: 201, description: 'Attached evidence file.' })
  @ApiResponse({ status: 422, description: 'File bytes, extension and type disagree.' })
  attachDocument(
    @CurrentUser() user: RequestUser,
    @Param('projectId') projectId: string,
    @Body() body: unknown,
  ): Promise<ProjectDocumentDto> {
    return this.service.attachDocument(user.sub, projectId, body);
  }

  @HttpCode(204)
  @Delete(':projectId/documents/:documentId')
  @Roles('STUDENT')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Th6-600 — remove an evidence file from an owned project.' })
  removeDocument(
    @CurrentUser() user: RequestUser,
    @Param('projectId') projectId: string,
    @Param('documentId') documentId: string,
  ): Promise<void> {
    return this.service.removeDocument(user.sub, projectId, documentId);
  }

  @Post(':projectId/replace')
  @Roles('STUDENT')
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Replace an owned project with another; the old project becomes inactive.',
  })
  @ApiResponse({
    status: 200,
    description: 'Old project marked inactive; replacement remains the current project.',
  })
  @ApiResponse({ status: 400, description: 'Self-replacement or invalid request.' })
  @ApiResponse({ status: 403, description: 'JWT subject does not own one or both projects.' })
  @ApiResponse({ status: 404, description: 'Unknown project id.' })
  @ApiResponse({ status: 409, description: 'Project is already inactive.' })
  replace(
    @CurrentUser() user: RequestUser,
    @Param('projectId') projectId: string,
    @Body() body: unknown,
  ): Promise<ReplaceProjectResponse> {
    return this.service.replace(user.sub, projectId, body);
  }
}
