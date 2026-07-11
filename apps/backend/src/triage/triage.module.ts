import { Module } from '@nestjs/common';
import { TriageService } from './triage.service';
import { TriageController } from './triage.controller';
import { MockTriageProvider } from './providers/mock-triage.provider';
import { OpenAiTriageProvider } from './providers/openai-triage.provider';
import { TRIAGE_PROVIDER } from './triage.types';

/**
 * Provider selection is env-driven (AI_PROVIDER=mock|openai). The OpenAI
 * provider itself falls back to the mock on any failure, so triage is always
 * available even without an API key.
 */
@Module({
  controllers: [TriageController],
  providers: [
    MockTriageProvider,
    OpenAiTriageProvider,
    {
      provide: TRIAGE_PROVIDER,
      inject: [MockTriageProvider, OpenAiTriageProvider],
      useFactory: (mock: MockTriageProvider, openai: OpenAiTriageProvider) =>
        (process.env.AI_PROVIDER ?? 'mock') === 'openai' ? openai : mock,
    },
    TriageService,
  ],
  exports: [TriageService],
})
export class TriageModule {}
