import { Module } from '@nestjs/common';
import { AiService } from './ai.service';
import { AiController } from './ai.controller';
import { MockVisionProvider, MockTranslationProvider } from './providers/mock-ai.providers';
import { OpenAiVisionProvider, OpenAiTranslationProvider } from './providers/openai-ai.providers';
import { VISION_PROVIDER, TRANSLATION_PROVIDER } from './ai.types';
import { TriageModule } from '../triage/triage.module';

/** AI_PROVIDER=mock|openai selects vision + translation; OpenAI falls back to mock. */
@Module({
  imports: [TriageModule],
  controllers: [AiController],
  providers: [
    MockVisionProvider,
    MockTranslationProvider,
    OpenAiVisionProvider,
    OpenAiTranslationProvider,
    {
      provide: VISION_PROVIDER,
      inject: [MockVisionProvider, OpenAiVisionProvider],
      useFactory: (mock: MockVisionProvider, openai: OpenAiVisionProvider) =>
        (process.env.AI_PROVIDER ?? 'mock') === 'openai' ? openai : mock,
    },
    {
      provide: TRANSLATION_PROVIDER,
      inject: [MockTranslationProvider, OpenAiTranslationProvider],
      useFactory: (mock: MockTranslationProvider, openai: OpenAiTranslationProvider) =>
        (process.env.AI_PROVIDER ?? 'mock') === 'openai' ? openai : mock,
    },
    AiService,
  ],
  exports: [AiService],
})
export class AiModule {}
