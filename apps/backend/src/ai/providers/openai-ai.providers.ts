import { Injectable, Logger } from '@nestjs/common';
import OpenAI from 'openai';
import {
  TranslationProvider,
  TranslationResult,
  VisionObservation,
  VisionProvider,
  VISION_DISCLAIMER,
} from '../ai.types';
import { MockVisionProvider, MockTranslationProvider } from './mock-ai.providers';

const VISION_SYSTEM =
  'You are an emergency first-aid vision assistant. Describe only what is visibly ' +
  'observable to a bystander (e.g. visible bleeding, someone lying motionless, a burn). ' +
  'DO NOT diagnose conditions or name diseases. Return JSON: ' +
  '{ "observations": string[], "suggestedComplaint": string }.';

@Injectable()
export class OpenAiVisionProvider implements VisionProvider {
  readonly name = 'openai-vision';
  private readonly logger = new Logger(OpenAiVisionProvider.name);
  private readonly client?: OpenAI;
  private readonly model = process.env.OPENAI_VISION_MODEL ?? 'gpt-4o-mini';

  constructor(private readonly fallback: MockVisionProvider) {
    const key = process.env.OPENAI_API_KEY;
    if (key) this.client = new OpenAI({ apiKey: key });
  }

  async analyze(imageBase64: string, mime = 'image/jpeg'): Promise<VisionObservation> {
    if (!this.client) return this.fallback.analyze(imageBase64);
    try {
      const res = await this.client.chat.completions.create({
        model: this.model,
        temperature: 0.2,
        response_format: { type: 'json_object' },
        messages: [
          { role: 'system', content: VISION_SYSTEM },
          {
            role: 'user',
            content: [
              { type: 'text', text: 'Describe observable emergency details in this image.' },
              { type: 'image_url', image_url: { url: `data:${mime};base64,${imageBase64}` } },
            ],
          },
        ],
      });
      const parsed = JSON.parse(res.choices[0]?.message?.content ?? '{}');
      return {
        observations: parsed.observations ?? [],
        suggestedComplaint: parsed.suggestedComplaint ?? '',
        provider: this.name,
        disclaimer: VISION_DISCLAIMER,
      };
    } catch (err) {
      this.logger.error('OpenAI vision failed; using mock', err as Error);
      return this.fallback.analyze(imageBase64);
    }
  }
}

@Injectable()
export class OpenAiTranslationProvider implements TranslationProvider {
  readonly name = 'openai-translation';
  private readonly logger = new Logger(OpenAiTranslationProvider.name);
  private readonly client?: OpenAI;
  private readonly model = process.env.OPENAI_MODEL ?? 'gpt-4o-mini';

  constructor(private readonly fallback: MockTranslationProvider) {
    const key = process.env.OPENAI_API_KEY;
    if (key) this.client = new OpenAI({ apiKey: key });
  }

  async translate(text: string, targetLanguage: string): Promise<TranslationResult> {
    if (!this.client) return this.fallback.translate(text, targetLanguage);
    try {
      const res = await this.client.chat.completions.create({
        model: this.model,
        temperature: 0,
        messages: [
          {
            role: 'system',
            content: `Translate the user's text to ${targetLanguage}. Preserve meaning and any safety instructions exactly. Return only the translation.`,
          },
          { role: 'user', content: text },
        ],
      });
      return {
        translatedText: res.choices[0]?.message?.content?.trim() ?? text,
        targetLanguage,
        provider: this.name,
      };
    } catch (err) {
      this.logger.error('OpenAI translation failed; using mock', err as Error);
      return this.fallback.translate(text, targetLanguage);
    }
  }
}
