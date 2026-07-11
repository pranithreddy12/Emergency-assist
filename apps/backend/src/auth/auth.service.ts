import {
  Injectable,
  ConflictException,
  UnauthorizedException,
  Logger,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as argon2 from 'argon2';
import { createHash } from 'crypto';
import { AuthProvider, User } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { RegisterDto, LoginDto } from './dto/auth.dto';

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  private readonly accessTtl = Number(process.env.JWT_ACCESS_TTL ?? 900);
  private readonly refreshTtl = Number(process.env.JWT_REFRESH_TTL ?? 1_209_600);

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
  ) {}

  async register(dto: RegisterDto, ctx: { ip?: string; ua?: string } = {}) {
    const existing = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (existing) throw new ConflictException('Email already registered');

    const passwordHash = await argon2.hash(dto.password);
    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        phone: dto.phone,
        passwordHash,
        displayName: dto.displayName,
        provider: AuthProvider.EMAIL,
        // A medical profile is created eagerly so a QR card always exists.
        medicalProfile: { create: {} },
      },
    });

    return this.issueSession(user, ctx);
  }

  async login(dto: LoginDto, ctx: { ip?: string; ua?: string } = {}) {
    const user = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (!user || !user.passwordHash) throw new UnauthorizedException('Invalid credentials');

    const ok = await argon2.verify(user.passwordHash, dto.password);
    if (!ok) throw new UnauthorizedException('Invalid credentials');

    return this.issueSession(user, ctx);
  }

  /** Emergency guest mode — no credentials, limited scope, profile still created. */
  async guest(ctx: { ip?: string; ua?: string } = {}) {
    const user = await this.prisma.user.create({
      data: {
        isGuest: true,
        provider: AuthProvider.GUEST,
        displayName: 'Guest',
        medicalProfile: { create: {} },
      },
    });
    return this.issueSession(user, ctx);
  }

  async refresh(refreshToken: string, ctx: { ip?: string; ua?: string } = {}) {
    let payload: { sub: string; type: string };
    try {
      payload = await this.jwt.verifyAsync(refreshToken, {
        secret: process.env.JWT_REFRESH_SECRET,
      });
    } catch {
      throw new UnauthorizedException('Invalid refresh token');
    }
    if (payload.type !== 'refresh') throw new UnauthorizedException('Invalid token type');

    const hash = this.hashToken(refreshToken);
    const session = await this.prisma.session.findFirst({
      where: { userId: payload.sub, refreshTokenHash: hash, revokedAt: null },
      include: { user: true },
    });
    if (!session || session.expiresAt < new Date()) {
      throw new UnauthorizedException('Session expired');
    }

    // Rotate: revoke the old session, issue a fresh pair.
    await this.prisma.session.update({
      where: { id: session.id },
      data: { revokedAt: new Date() },
    });
    return this.issueSession(session.user, ctx);
  }

  async logout(userId: string, refreshToken: string) {
    const hash = this.hashToken(refreshToken);
    await this.prisma.session.updateMany({
      where: { userId, refreshTokenHash: hash, revokedAt: null },
      data: { revokedAt: new Date() },
    });
    return { success: true };
  }

  private async issueSession(user: User, ctx: { ip?: string; ua?: string }): Promise<TokenPair> {
    const base = { sub: user.id, role: user.role, isGuest: user.isGuest };
    const accessToken = await this.jwt.signAsync(
      { ...base, type: 'access' },
      { secret: process.env.JWT_ACCESS_SECRET, expiresIn: this.accessTtl },
    );
    const refreshToken = await this.jwt.signAsync(
      { ...base, type: 'refresh' },
      { secret: process.env.JWT_REFRESH_SECRET, expiresIn: this.refreshTtl },
    );

    await this.prisma.session.create({
      data: {
        userId: user.id,
        refreshTokenHash: this.hashToken(refreshToken),
        ip: ctx.ip,
        userAgent: ctx.ua,
        expiresAt: new Date(Date.now() + this.refreshTtl * 1000),
      },
    });

    return { accessToken, refreshToken, expiresIn: this.accessTtl };
  }

  private hashToken(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }
}
