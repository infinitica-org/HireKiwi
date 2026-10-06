import { Global, Module } from '@nestjs/common';
import { ReferenceDataCache } from './reference-data-cache.service.js';

@Global()
@Module({
  providers: [ReferenceDataCache],
  exports: [ReferenceDataCache],
})
export class ReferenceDataCacheModule {}
