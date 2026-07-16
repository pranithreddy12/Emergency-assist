import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { configureApp } from '../src/app-config';

/**
 * Full-stack e2e: boots the real Nest app (Prisma + all modules) and drives an
 * emergency flow over HTTP. Requires the Postgres from docker-compose to be up.
 */
describe('EmergencyAI e2e', () => {
  let app: INestApplication;
  let http: ReturnType<typeof request>;
  let accessToken: string;
  let qrToken: string;
  let incidentId: string;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleRef.createNestApplication();
    configureApp(app); // exact same middleware as production
    await app.init();
    http = request(app.getHttpServer());
  });

  afterAll(async () => {
    await app?.close();
  });

  it('GET /health → ok', async () => {
    const res = await http.get('/api/v1/health').expect(200);
    expect(res.body.status).toBe('ok');
  });

  it('POST /auth/guest → issues tokens', async () => {
    const res = await http.post('/api/v1/auth/guest').expect(201);
    expect(res.body.accessToken).toBeDefined();
    accessToken = res.body.accessToken;
  });

  it('GET /users/me → returns the guest', async () => {
    const res = await http
      .get('/api/v1/users/me')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);
    expect(res.body.isGuest).toBe(true);
  });

  it('rejects unauthenticated access to a protected route', async () => {
    await http.get('/api/v1/users/me').expect(401);
  });

  it('PUT /medical-profile → updates and returns a QR token', async () => {
    const res = await http
      .put('/api/v1/medical-profile')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ bloodGroup: 'O_NEG', allergies: ['Penicillin'] })
      .expect(200);
    expect(res.body.bloodGroup).toBe('O_NEG');
    expect(res.body.qrToken).toBeDefined();
    qrToken = res.body.qrToken;
  });

  it('GET /medical-card/:qrToken → public card (no auth)', async () => {
    const res = await http.get(`/api/v1/medical-card/${qrToken}`).expect(200);
    expect(res.body.bloodGroup).toBe('O_NEG');
    expect(res.body.allergies).toContain('Penicillin');
  });

  it('POST /triage/assess → classifies a cardiac emergency as CRITICAL', async () => {
    const res = await http
      .post('/api/v1/triage/assess')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ chiefComplaint: 'severe chest pain radiating to left arm', isBreathing: true })
      .expect(201);
    expect(res.body.severity).toBe('CRITICAL');
    expect(res.body.suggestedFacility).toBe('CARDIAC');
    expect(res.body.disclaimer).toMatch(/not a medical diagnosis/i);
  });

  it('validation: rejects a triage request missing chiefComplaint', async () => {
    await http
      .post('/api/v1/triage/assess')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ isBreathing: true })
      .expect(400);
  });

  it('POST /incidents → raises SOS and persists a triage report', async () => {
    const res = await http
      .post('/api/v1/incidents')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        latitude: 37.7749,
        longitude: -122.4194,
        triage: { chiefComplaint: 'unconscious, not breathing', isConscious: false, isBreathing: false },
      })
      .expect(201);
    expect(res.body.status).toBe('ACTIVE');
    expect(res.body.severity).toBe('CRITICAL');
    expect(res.body.triageReport.confidence).toBeGreaterThan(0);
    incidentId = res.body.id;
  });

  it('PATCH /incidents/:id/status → enforces the state machine', async () => {
    await http
      .patch(`/api/v1/incidents/${incidentId}/status`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ status: 'DISPATCHED' })
      .expect(200);
    // illegal jump should be rejected
    await http
      .patch(`/api/v1/incidents/${incidentId}/status`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ status: 'RESOLVED' })
      .expect(400);
  });

  it('GET /guidance → returns the 16 first-aid topics (public)', async () => {
    const res = await http.get('/api/v1/guidance').expect(200);
    expect(res.body.count).toBe(16);
  });

  it('GET /hospitals/search → returns nearby hospitals with travel time', async () => {
    const res = await http
      .get('/api/v1/hospitals/search?latitude=37.7749&longitude=-122.4194&limit=3')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);
    expect(Array.isArray(res.body.hospitals)).toBe(true);
    if (res.body.hospitals.length > 0) {
      expect(res.body.hospitals[0].travelTimeSeconds).toBeGreaterThanOrEqual(0);
    }
  });

  it('RBAC: guest cannot reach admin endpoints', async () => {
    await http
      .get('/api/v1/admin/users')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(403);
  });

  it('AI translate returns the text and target language (mock)', async () => {
    const res = await http
      .post('/api/v1/ai/translate')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ text: 'Apply firm pressure to the wound.', targetLanguage: 'French' })
      .expect(201);
    expect(res.body.targetLanguage).toBe('French');
    expect(res.body.translatedText).toContain('firm pressure');
  });

  it('AI analyze-image derives observations and runs triage without diagnosing', async () => {
    const scene = Buffer.from('person with severe chest pain and sweating').toString('base64');
    const res = await http
      .post('/api/v1/ai/analyze-image')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ imageBase64: scene })
      .expect(201);
    expect(res.body.triage.severity).toBe('CRITICAL');
    expect(res.body.vision.disclaimer).toMatch(/not a diagnosis/i);
  });

  it('voice assist transcribes, triages, and returns a spoken summary', async () => {
    const audio = Buffer.from('he is not breathing').toString('base64');
    const res = await http
      .post('/api/v1/voice/assist')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ audioBase64: audio })
      .expect(201);
    expect(res.body.triage.severity).toBe('CRITICAL');
    expect(res.body.spokenSummary).toMatch(/not a diagnosis/i);
    expect(res.body.audio.audioBase64.length).toBeGreaterThan(0);
  });

  it('sets security headers (helmet)', async () => {
    const res = await http.get('/api/v1/health').expect(200);
    expect(res.headers['x-content-type-options']).toBe('nosniff');
    expect(res.headers['x-dns-prefetch-control']).toBeDefined();
  });

  it('enforces the password policy on register', async () => {
    await http
      .post('/api/v1/auth/register')
      .send({ email: `weak_${Date.now()}@test.com`, password: 'allletters' })
      .expect(400);
  });

  it('uploads, lists, downloads and deletes a medical document', async () => {
    const contents = 'PATIENT RECORD: blood type O-';
    const upload = await http
      .post('/api/v1/documents')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        label: 'Test record',
        contentType: 'text/plain',
        data: Buffer.from(contents).toString('base64'),
      })
      .expect(201);
    expect(upload.body.id).toBeDefined();
    expect(upload.body.sizeBytes).toBe(contents.length);
    const docId = upload.body.id as string;

    const list = await http
      .get('/api/v1/documents')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);
    expect(list.body.some((d: { id: string }) => d.id === docId)).toBe(true);

    const raw = await http
      .get(`/api/v1/documents/raw/${docId}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);
    expect(raw.text).toBe(contents);

    await http
      .delete(`/api/v1/documents/${docId}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);
  });

  it('rotates refresh tokens and detects reuse (revokes all sessions)', async () => {
    // Fresh session with its own refresh token.
    const guest = await http.post('/api/v1/auth/guest').expect(201);
    const r1 = guest.body.refreshToken as string;

    // First rotation works and yields a new token.
    const rotated = await http.post('/api/v1/auth/refresh').send({ refreshToken: r1 }).expect(200);
    const r2 = rotated.body.refreshToken as string;
    expect(r2).not.toBe(r1);

    // Replaying the OLD (now-revoked) token is treated as theft → 401.
    await http.post('/api/v1/auth/refresh').send({ refreshToken: r1 }).expect(401);

    // ...and the reuse response revoked the legitimate new token too.
    await http.post('/api/v1/auth/refresh').send({ refreshToken: r2 }).expect(401);
  });
});
