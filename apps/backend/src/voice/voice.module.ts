import { Module } from '@nestjs/common';
import { VoiceService } from './voice.service';
import { VoiceController } from './voice.controller';
import { MockSttProvider, MockTtsProvider } from './providers/mock-voice.providers';
import { OpenAiSttProvider, OpenAiTtsProvider } from './providers/openai-voice.providers';
import { STT_PROVIDER, TTS_PROVIDER } from './voice.types';
import { TriageModule } from '../triage/triage.module';

/**
 * Voice provider selection is env-driven (VOICE_PROVIDER=mock|openai). The
 * OpenAI providers fall back to the mock on missing key / failure.
 */
@Module({
  imports: [TriageModule],
  controllers: [VoiceController],
  providers: [
    MockSttProvider,
    MockTtsProvider,
    OpenAiSttProvider,
    OpenAiTtsProvider,
    {
      provide: STT_PROVIDER,
      inject: [MockSttProvider, OpenAiSttProvider],
      useFactory: (mock: MockSttProvider, openai: OpenAiSttProvider) =>
        (process.env.VOICE_PROVIDER ?? 'mock') === 'openai' ? openai : mock,
    },
    {
      provide: TTS_PROVIDER,
      inject: [MockTtsProvider, OpenAiTtsProvider],
      useFactory: (mock: MockTtsProvider, openai: OpenAiTtsProvider) =>
        (process.env.VOICE_PROVIDER ?? 'mock') === 'openai' ? openai : mock,
    },
    VoiceService,
  ],
  exports: [VoiceService],
})
export class VoiceModule {}
