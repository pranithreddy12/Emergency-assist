export const STT_PROVIDER = Symbol('STT_PROVIDER');
export const TTS_PROVIDER = Symbol('TTS_PROVIDER');

export interface TranscriptionResult {
  text: string;
  provider: string;
  durationMs?: number;
}

export interface SpeechResult {
  /** base64-encoded audio (data URI body) so the client can play it offline. */
  audioBase64: string;
  contentType: string;
  provider: string;
}

export interface SttProvider {
  readonly name: string;
  /** audioBase64: base64 of an audio clip; mime hints the codec. */
  transcribe(audioBase64: string, mime?: string): Promise<TranscriptionResult>;
}

export interface TtsProvider {
  readonly name: string;
  synthesize(text: string): Promise<SpeechResult>;
}
