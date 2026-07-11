import { UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service';

/**
 * Unit-tests the security-critical refresh-token rotation + reuse detection
 * with a mocked Prisma + JWT, so it runs without a database (and in CI).
 */
function build(sessionRow: any) {
  const calls = {
    updateMany: 0,
    update: 0,
    create: 0,
    revokedAllFor: null as string | null,
  };
  const prisma: any = {
    session: {
      findFirst: jest.fn().mockResolvedValue(sessionRow),
      update: jest.fn().mockImplementation(() => {
        calls.update += 1;
        return Promise.resolve({});
      }),
      updateMany: jest.fn().mockImplementation(({ where }: any) => {
        calls.updateMany += 1;
        calls.revokedAllFor = where.userId;
        return Promise.resolve({ count: 3 });
      }),
      create: jest.fn().mockImplementation(() => {
        calls.create += 1;
        return Promise.resolve({});
      }),
    },
  };
  const jwt: any = {
    verifyAsync: jest.fn().mockResolvedValue({ sub: 'user-1', type: 'refresh' }),
    signAsync: jest.fn().mockResolvedValue('signed.token'),
  };
  return { service: new AuthService(prisma, jwt), prisma, jwt, calls };
}

const future = new Date(Date.now() + 3_600_000);

describe('AuthService.refresh — rotation & reuse detection', () => {
  it('rotates a valid, non-revoked session (revokes old, issues new)', async () => {
    const { service, calls } = build({
      id: 's1',
      userId: 'user-1',
      revokedAt: null,
      expiresAt: future,
      user: { id: 'user-1', role: 'USER', isGuest: false },
    });
    const tokens = await service.refresh('some.refresh.token');
    expect(tokens.accessToken).toBeDefined();
    expect(tokens.refreshToken).toBeDefined();
    expect(calls.update).toBe(1); // old session revoked
    expect(calls.create).toBe(1); // new session issued
    expect(calls.updateMany).toBe(0); // not a reuse
  });

  it('detects reuse of an already-revoked token and revokes ALL user sessions', async () => {
    const { service, calls } = build({
      id: 's1',
      userId: 'user-1',
      revokedAt: new Date(), // already rotated / logged out
      expiresAt: future,
      user: { id: 'user-1', role: 'USER', isGuest: false },
    });
    await expect(service.refresh('replayed.token')).rejects.toBeInstanceOf(UnauthorizedException);
    expect(calls.updateMany).toBe(1);
    expect(calls.revokedAllFor).toBe('user-1'); // blast-radius = all sessions
    expect(calls.create).toBe(0); // no new session issued
  });

  it('rejects an unknown refresh token', async () => {
    const { service } = build(null);
    await expect(service.refresh('ghost.token')).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('rejects an expired (but not revoked) session', async () => {
    const { service, calls } = build({
      id: 's1',
      userId: 'user-1',
      revokedAt: null,
      expiresAt: new Date(Date.now() - 1000),
      user: { id: 'user-1', role: 'USER', isGuest: false },
    });
    await expect(service.refresh('old.token')).rejects.toBeInstanceOf(UnauthorizedException);
    expect(calls.create).toBe(0);
  });
});
