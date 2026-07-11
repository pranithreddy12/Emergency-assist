import { Injectable, Logger } from '@nestjs/common';
import OpenAI from 'openai';
import {
  SpeechResult,
  SttProvider,
  TranscriptionResult,
  TtsProvider,
} from '../voice.types';
import { MockSttProvider, MockTtsProvider } from './mock-voice.providers';

/** OpenAI Whisper transcription; falls back to the mock without a key. */
@Injectable()
export class OpenAiSttProvider implements SttProvider {
  readonly name = 'openai-whisper';
  private readonly logger = new Logger(OpenAiSttProvider.name);
  private readonly client?: OpenAI;

  constructor(private readonly fallback: MockSttProvider) {
    const apiKey = process.env.OPENAI_API_KEY;
    if (apiKey) this.client = new OpenAI({ apiKey });
  }

  async transcribe(audioBase64: string, mime = 'audio/webm'): Promise<TranscriptionResult> {
    if (!this.client) return this.fallback.transcribe(audioBase64);
    try {
      const buffer = Buffer.from(audioBase64, 'base64');
      const file = new File([buffer], 'audio', { type: mime });
      const res = await this.client.audio.transcriptions.create({
        file,
        model: process.env.OPENAI_STT_MODEL ?? 'whisper-1',
      });
      return { text: res.text, provider: this.name };
    } catch (err) {
      this.logger.error('Whisper failed; using mock', err as Error);
      return this.fallback.transcribe(audioBase64);
    }
  }
}

/** OpenAI TTS; falls back to the mock without a key. */
@Injectable()
export class OpenAiTtsProvider implements TtsProvider {
  readonly name = 'openai-tts';
  private readonly logger = new Logger(OpenAiTtsProvider.name);
  private readonly client?: OpenAI;

  constructor(private readonly fallback: MockTtsProvider) {
    const apiKey = process.env.OPENAI_API_KEY;
    if (apiKey) this.client = new OpenAI({ apiKey });
  }

  async synthesize(text: string): Promise<SpeechResult> {
    if (!this.client) return this.fallback.synthesize(text);
    try {
      const res = await this.client.audio.speech.create({
        model: process.env.OPENAI_TTS_MODEL ?? 'tts-1',
        voice: 'alloy',
        input: text,
      });
      const buffer = Buffer.from(await res.arrayBuffer());
      return {
        audioBase64: buffer.toString('base64'),
        contentType: 'audio/mpeg',
        provider: this.name,
      };
    } catch (err) {
      this.logger.error('OpenAI TTS failed; using mock', err as Error);
      return this.fallback.synthesize(text);
    }
  }
}
