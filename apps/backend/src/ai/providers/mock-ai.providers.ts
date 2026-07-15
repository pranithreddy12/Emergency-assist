import { Injectable } from '@nestjs/common';
import {
  TranslationProvider,
  TranslationResult,
  VisionObservation,
  VisionProvider,
  VISION_DISCLAIMER,
} from '../ai.types';

/**
 * Deterministic AI mocks so image-analysis and translation flows work without an
 * OpenAI key. The vision mock cannot truly see, so if the "image" base64 decodes
 * to readable text (test/client harness) it uses that as the described scene;
 * otherwise it returns a neutral prompt to describe the situation verbally.
 */
@Injectable()
export class MockVisionProvider implements VisionProvider {
  readonly name = 'mock-vision';

  async analyze(imageBase64: string): Promise<VisionObservation> {
    let decoded = '';
    try {
      decoded = Buffer.from(imageBase64, 'base64').toString('utf8').replace(/[^\x20-\x7E]/g, '').trim();
    } catch {
      decoded = '';
    }
    if (decoded.length >= 3) {
      return {
        observations: [`Reported scene: ${decoded}`],
        suggestedComplaint: decoded,
        provider: this.name,
        disclaimer: VISION_DISCLAIMER,
      };
    }
    return {
      observations: ['Could not extract details from the image.'],
      suggestedComplaint: 'Please describe what you can see about the emergency.',
      provider: this.name,
      disclaimer: VISION_DISCLAIMER,
    };
  }
}

@Injectable()
export class MockTranslationProvider implements TranslationProvider {
  readonly name = 'mock-translation';

  async translate(text: string, targetLanguage: string): Promise<TranslationResult> {
    return {
      translatedText: text,
      targetLanguage,
      provider: this.name,
      note: 'Mock mode returns the source text. Set AI_PROVIDER=openai with a key for real translation.',
    };
  }
}
