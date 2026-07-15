import { Inject, Injectable } from '@nestjs/common';
import {
  TRANSLATION_PROVIDER,
  VISION_PROVIDER,
  TranslationProvider,
  VisionProvider,
} from './ai.types';
import { TriageService } from '../triage/triage.service';

@Injectable()
export class AiService {
  constructor(
    @Inject(VISION_PROVIDER) private readonly vision: VisionProvider,
    @Inject(TRANSLATION_PROVIDER) private readonly translation: TranslationProvider,
    private readonly triage: TriageService,
  ) {}

  /**
   * Analyze an emergency photo into neutral observations, then run triage on the
   * derived complaint. The vision layer never diagnoses — it only describes.
   */
  async analyzeImage(imageBase64: string, mime?: string) {
    const vision = await this.vision.analyze(imageBase64, mime);
    const triage = await this.triage.assess({
      chiefComplaint: vision.suggestedComplaint,
      freeText: vision.observations.join('. '),
    });
    return { vision, triage };
  }

  translate(text: string, targetLanguage: string) {
    return this.translation.translate(text, targetLanguage);
  }
}
