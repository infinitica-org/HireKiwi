import {
  BadRequestException,
  Controller,
  Get,
  Inject,
  Post,
  Req,
  ServiceUnavailableException,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { FastifyRequest } from 'fastify';
import type { Multipart, MultipartFile } from '@fastify/multipart';
import { API_PREFIX, type UniversityLogoResponse } from '@hirekiwi/contracts';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';
import type { RequestUser } from '../../common/guards/jwt-auth.guard.js';
import { Roles } from '../../common/guards/roles.decorator.js';
import { TenantScopeGuard } from '../../common/guards/tenant-scope.guard.js';
import { PrismaService } from '../../platform/prisma/prisma.service.js';
import { StorageService } from '../../platform/storage/storage.service.js';

const MAX_LOGO_BYTES = 2 * 1024 * 1024;
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

/** The college's logo: the TPO uploads it, and the college's students see it on their dashboard. */
@ApiTags('university-campus')
@ApiBearerAuth()
@Controller(`${API_PREFIX}/university/logo`)
@UseGuards(TenantScopeGuard)
@Roles('INSTITUTION_ADMIN', 'PLACEMENT_STAFF')
export class UniversityLogoController {
  constructor(
    @Inject(PrismaService) private readonly prisma: PrismaService,
    @Inject(StorageService) private readonly storage: StorageService,
  ) {}

  private institutionId(user: RequestUser): string {
    if (!user.inst) {
      throw new BadRequestException({
        error: 'validation_failed',
        message: 'Your account is not linked to a college.',
        statusCode: 400,
      });
    }
    return user.inst;
  }

  private async signed(key: string | null): Promise<string | null> {
    if (!key) return null;
    try {
      return await this.storage.getSignedDownloadUrl(key);
    } catch {
      return null;
    }
  }

  @Get()
  @ApiOperation({ summary: 'The college logo as a signed address, or null.' })
  async get(@CurrentUser() user: RequestUser): Promise<UniversityLogoResponse> {
    const row = await this.prisma.institution.findUnique({
      where: { id: this.institutionId(user) },
      select: { logoStorageKey: true },
    });
    return { logoUrl: await this.signed(row?.logoStorageKey ?? null) };
  }

  @Post()
  @Roles('INSTITUTION_ADMIN')
  @ApiOperation({ summary: 'Upload or replace the college logo (JPEG, PNG or WebP, max 2MB).' })
  async upload(
    @CurrentUser() user: RequestUser,
    @Req() request: FastifyRequest,
  ): Promise<UniversityLogoResponse> {
    const institutionId = this.institutionId(user);
    const parts = (
      request as FastifyRequest & { parts: (opts?: unknown) => AsyncIterableIterator<Multipart> }
    ).parts({ limits: { fileSize: MAX_LOGO_BYTES } });

    let buffer: Buffer | null = null;
    let fileName = 'logo';
    let mimeType = 'application/octet-stream';
    try {
      for await (const part of parts) {
        if (part.type === 'file') {
          const file = part as MultipartFile;
          mimeType = file.mimetype;
          fileName = file.filename;
          buffer = await file.toBuffer();
        }
      }
    } catch {
      throw new BadRequestException({
        error: 'validation_failed',
        message: 'The logo must be 2MB or smaller.',
        statusCode: 400,
      });
    }
    if (!buffer || !ALLOWED_TYPES.includes(mimeType)) {
      throw new BadRequestException({
        error: 'validation_failed',
        message: 'Choose a JPEG, PNG or WebP image for the logo.',
        statusCode: 400,
      });
    }

    let key: string;
    try {
      key = await this.storage.upload({
        buffer,
        namespace: `institution-logos/${institutionId}`,
        fileName,
        contentType: mimeType,
      });
    } catch {
      throw new ServiceUnavailableException({
        error: 'storage_unavailable',
        message: 'Logo storage is unavailable right now. Please try again.',
        statusCode: 503,
      });
    }

    await this.prisma.institution.update({
      where: { id: institutionId },
      data: { logoStorageKey: key },
    });
    return { logoUrl: await this.signed(key) };
  }
}
