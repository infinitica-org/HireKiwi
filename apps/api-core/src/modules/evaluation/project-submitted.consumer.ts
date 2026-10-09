import type { OnModuleInit } from '@nestjs/common';
import { Inject, Injectable, Logger } from '@nestjs/common';
import { ProjectSubmittedEventSchema, HIREKIWI_TOPICS } from '@hirekiwi/contracts';
import { runKafkaHandler } from '@hirekiwi/observability';
import { env } from '../../platform/config/env.js';
import { KafkaService } from '../../platform/kafka/kafka.service.js';
import { ProjectVerifyRunnerService } from './project-verify-runner.service.js';

@Injectable()
export class ProjectSubmittedConsumer implements OnModuleInit {
  private readonly logger = new Logger(ProjectSubmittedConsumer.name);

  constructor(
    @Inject(KafkaService) private readonly kafka: KafkaService,
    @Inject(ProjectVerifyRunnerService) private readonly verifyRunner: ProjectVerifyRunnerService,
  ) {}

  async onModuleInit(): Promise<void> {
    if (env.NODE_ENV === 'test') return;
    try {
      await this.kafka.subscribe({
        topic: HIREKIWI_TOPICS.projectSubmitted,
        module: 'evaluation',
        handler: async (payload, headers) => {
          await runKafkaHandler(headers, async () => {
            const parsed = ProjectSubmittedEventSchema.safeParse(payload);
            if (!parsed.success) {
              this.logger.warn('Ignored malformed hirekiwi.project.submitted payload');
              return;
            }
            const { projectId, studentId } = parsed.data.data;
            await this.verifyRunner.runForProject(projectId, studentId);
          });
        },
      });
    } catch (error) {
      this.logger.warn(
        `project.submitted consumer not started: ${error instanceof Error ? error.message : 'unknown'}`,
      );
    }
  }
}
