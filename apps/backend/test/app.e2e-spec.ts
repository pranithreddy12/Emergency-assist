import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../src/app.module';

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
    app.setGlobalPrefix('api/v1');
    app.useGlobalPipes(
      new ValidationPipe({ whitelist: true, transform: true, forbidNonWhitelisted: true }),
    );
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
});
