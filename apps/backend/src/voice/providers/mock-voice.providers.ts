import { Injectable } from '@nestjs/common';
import {
  SpeechResult,
  SttProvider,
  TranscriptionResult,
  TtsProvider,
} from '../voice.types';

/**
 * Deterministic voice mocks so the whole voice→triage→speak flow works without
 * an OpenAI key.
 *
 * The STT mock recognizes a small set of emergency keywords embedded (as UTF-8)
 * in the decoded audio bytes — this lets tests and the client drive realistic
 * transcripts by "recording" text, while real audio simply yields a placeholder.
 */
@Injectable()
export class MockSttProvider implements SttProvider {
  readonly name = 'mock-stt';

  async transcribe(audioBase64: string): Promise<TranscriptionResult> {
    let decoded = '';
    try {
      decoded = Buffer.from(audioBase64, 'base64').toString('utf8');
    } catch {
      decoded = '';
    }
    // If the "audio" is actually readable text (test / client harness), echo it.
    const printable = decoded.replace(/[^\x20-\x7E]/g, '').trim();
    const text = printable.length >= 3 ? printable : 'Unable to understand the audio clearly.';
    return { text, provider: this.name };
  }
}

@Injectable()
export class MockTtsProvider implements TtsProvider {
  readonly name = 'mock-tts';

  async synthesize(text: string): Promise<SpeechResult> {
    // Encode the text as the "audio" payload; a real client would receive audio
    // bytes. This keeps the contract identical to the real provider.
    return {
      audioBase64: Buffer.from(text, 'utf8').toString('base64'),
      contentType: 'audio/mpeg',
      provider: this.name,
    };
  }
}
