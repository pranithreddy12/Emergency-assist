import { Inject, Injectable } from '@nestjs/common';
import {
  STT_PROVIDER,
  TTS_PROVIDER,
  SttProvider,
  TtsProvider,
} from './voice.types';
import { TriageService } from '../triage/triage.service';

@Injectable()
export class VoiceService {
  constructor(
    @Inject(STT_PROVIDER) private readonly stt: SttProvider,
    @Inject(TTS_PROVIDER) private readonly tts: TtsProvider,
    private readonly triage: TriageService,
  ) {}

  transcribe(audioBase64: string, mime?: string) {
    return this.stt.transcribe(audioBase64, mime);
  }

  speak(text: string) {
    return this.tts.synthesize(text);
  }

  /**
   * Hands-free assist: transcribe the caller's audio, run triage on the text,
   * and synthesize a short spoken summary of the guidance. Never diagnoses.
   */
  async assist(audioBase64: string, mime?: string) {
    const transcription = await this.stt.transcribe(audioBase64, mime);
    const result = await this.triage.assess({
      chiefComplaint: transcription.text,
      freeText: transcription.text,
    });

    const spokenSummary = this.buildSpokenSummary(result.severity, result.recommendedActions);
    const speech = await this.tts.synthesize(spokenSummary);

    return {
      transcript: transcription.text,
      triage: result,
      spokenSummary,
      audio: speech,
    };
  }

  private buildSpokenSummary(severity: string, actions: string[]): string {
    const lead =
      severity === 'CRITICAL' || severity === 'HIGH'
        ? 'This may be serious. Call your local emergency number now.'
        : 'Here is some first-aid guidance.';
    const firstSteps = actions.slice(0, 3).join(' ');
    return `${lead} ${firstSteps} This is guidance only, not a diagnosis.`;
  }
}
