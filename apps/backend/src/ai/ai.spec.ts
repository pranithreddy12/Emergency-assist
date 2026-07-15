import { MockVisionProvider, MockTranslationProvider } from './providers/mock-ai.providers';
import { AiService } from './ai.service';
import { TriageService } from '../triage/triage.service';
import { MockTriageProvider } from '../triage/providers/mock-triage.provider';

function makeService() {
  const triage = new TriageService(new MockTriageProvider());
  return new AiService(new MockVisionProvider(), new MockTranslationProvider(), triage);
}

describe('AI vision + translation', () => {
  it('vision analysis never returns a diagnosis and carries a disclaimer', async () => {
    const vision = new MockVisionProvider();
    const scene = Buffer.from('person with heavy bleeding on the arm').toString('base64');
    const r = await vision.analyze(scene);
    expect(r.observations.length).toBeGreaterThan(0);
    expect(r.disclaimer).toMatch(/not a diagnosis/i);
  });

  it('analyze-image feeds observations into triage', async () => {
    const service = makeService();
    const scene = Buffer.from('severe chest pain and sweating').toString('base64');
    const res = await service.analyzeImage(scene);
    expect(res.vision.suggestedComplaint).toContain('chest pain');
    expect(res.triage.severity).toBe('CRITICAL');
  });

  it('translation preserves text in mock mode and echoes the target language', async () => {
    const service = makeService();
    const r = await service.translate('Apply firm pressure.', 'Spanish');
    expect(r.translatedText).toBe('Apply firm pressure.');
    expect(r.targetLanguage).toBe('Spanish');
    expect(r.provider).toContain('mock');
  });
});
