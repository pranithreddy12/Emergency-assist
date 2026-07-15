export const VISION_PROVIDER = Symbol('VISION_PROVIDER');
export const TRANSLATION_PROVIDER = Symbol('TRANSLATION_PROVIDER');

export interface VisionObservation {
  /** Neutral, non-diagnostic observations a bystander could report. */
  observations: string[];
  /** A short chief-complaint phrase suitable for feeding the triage engine. */
  suggestedComplaint: string;
  provider: string;
  disclaimer: string;
}

export interface TranslationResult {
  translatedText: string;
  targetLanguage: string;
  provider: string;
  note?: string;
}

export interface VisionProvider {
  readonly name: string;
  analyze(imageBase64: string, mime?: string): Promise<VisionObservation>;
}

export interface TranslationProvider {
  readonly name: string;
  translate(text: string, targetLanguage: string): Promise<TranslationResult>;
}

export const VISION_DISCLAIMER =
  'Automated visual observations only — not a diagnosis. Confirm with responders and ' +
  'call your local emergency number for any serious situation.';
