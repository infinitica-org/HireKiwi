import { Module } from '@nestjs/common';
import { RateLimitInterceptor } from '../../common/interceptors/rate-limit.interceptor.js';
import { RateLimitAdminController } from './rate-limit-admin.controller.js';
import { RateLimitService } from './rate-limit.service.js';

@Module({
  controllers: [RateLimitAdminController],
  providers: [RateLimitService, RateLimitInterceptor],
  exports: [RateLimitService, RateLimitInterceptor],
})
export class RateLimitModule {}
