import { MockSttProvider, MockTtsProvider } from './providers/mock-voice.providers';
import { VoiceService } from './voice.service';
import { MockTriageProvider } from '../triage/providers/mock-triage.provider';
import { TriageService } from '../triage/triage.service';

function makeVoiceService() {
  const stt = new MockSttProvider();
  const tts = new MockTtsProvider();
  const triage = new TriageService(new MockTriageProvider());
  return new VoiceService(stt, tts, triage);
}

describe('Voice', () => {
  it('transcribes text-encoded audio (mock)', async () => {
    const stt = new MockSttProvider();
    const audio = Buffer.from('chest pain and sweating').toString('base64');
    const r = await stt.transcribe(audio);
    expect(r.text).toBe('chest pain and sweating');
  });

  it('synthesizes speech into base64 audio (mock)', async () => {
    const tts = new MockTtsProvider();
    const r = await tts.synthesize('help is on the way');
    expect(r.audioBase64.length).toBeGreaterThan(0);
    expect(r.contentType).toContain('audio');
  });

  it('assist: transcribe -> triage -> spoken guidance, CRITICAL for not-breathing', async () => {
    const service = makeVoiceService();
    const audio = Buffer.from('he is not breathing').toString('base64');
    const res = await service.assist(audio);
    expect(res.transcript).toBe('he is not breathing');
    expect(res.triage.severity).toBe('CRITICAL');
    expect(res.spokenSummary).toMatch(/emergency/i);
    expect(res.spokenSummary).toMatch(/not a diagnosis/i);
    expect(res.audio.audioBase64.length).toBeGreaterThan(0);
  });
});
