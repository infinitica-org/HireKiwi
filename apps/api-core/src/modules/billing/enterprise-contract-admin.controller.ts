import { Body, Controller, Get, Inject, Param, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import {
  API_PREFIX,
  CreateEnterpriseContractSchema,
  type EnterpriseContractDto,
} from '@hirekiwi/contracts';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';
import type { RequestUser } from '../../common/guards/jwt-auth.guard.js';
import { Roles } from '../../common/guards/roles.decorator.js';
import { BillingService } from './billing.service.js';

@ApiTags('admin-billing')
@Controller(`${API_PREFIX}/admin/billing/enterprise-contracts`)
export class EnterpriseContractAdminController {
  constructor(@Inject(BillingService) private readonly billingService: BillingService) {}

  @Post()
  @Roles('SUPER_ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a custom enterprise contract for a company.' })
  @ApiResponse({ status: 201, description: 'Enterprise contract draft created.' })
  @ApiResponse({ status: 409, description: 'Contract number or active contract already exists.' })
  async createEnterpriseContract(
    @CurrentUser() user: RequestUser,
    @Body() body: unknown,
  ): Promise<EnterpriseContractDto> {
    const validatedBody = CreateEnterpriseContractSchema.parse(body);
    return this.billingService.createEnterpriseContract(user.sub, validatedBody);
  }

  @Get()
  @Roles('SUPER_ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List all enterprise contracts.' })
  @ApiResponse({ status: 200, description: 'List of enterprise contracts.' })
  async listEnterpriseContracts(): Promise<EnterpriseContractDto[]> {
    return this.billingService.listEnterpriseContracts();
  }

  @Get(':id')
  @Roles('SUPER_ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get enterprise contract details by ID.' })
  @ApiResponse({ status: 200, description: 'Enterprise contract details.' })
  @ApiResponse({ status: 404, description: 'Contract not found.' })
  async getEnterpriseContract(@Param('id') id: string): Promise<EnterpriseContractDto> {
    return this.billingService.getEnterpriseContract(id);
  }

  @Post(':id/approve')
  @Roles('SUPER_ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Approve and activate enterprise contract.' })
  @ApiResponse({
    status: 200,
    description: 'Enterprise contract approved and subscription activated.',
  })
  @ApiResponse({ status: 404, description: 'Contract not found.' })
  async approveEnterpriseContract(
    @CurrentUser() user: RequestUser,
    @Param('id') id: string,
  ): Promise<EnterpriseContractDto> {
    return this.billingService.approveEnterpriseContract(user.sub, id);
  }

  @Post(':id/terminate')
  @Roles('SUPER_ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Terminate active enterprise contract.' })
  @ApiResponse({ status: 200, description: 'Enterprise contract terminated.' })
  @ApiResponse({ status: 404, description: 'Contract not found.' })
  async terminateEnterpriseContract(
    @CurrentUser() user: RequestUser,
    @Param('id') id: string,
  ): Promise<EnterpriseContractDto> {
    return this.billingService.terminateEnterpriseContract(user.sub, id);
  }
}
