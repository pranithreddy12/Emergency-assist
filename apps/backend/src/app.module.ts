import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { AuditInterceptor } from './common/interceptors/audit.interceptor';
import { PrismaModule } from './prisma/prisma.module';
import { CommonModule } from './common/common.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { MedicalProfileModule } from './medical-profile/medical-profile.module';
import { TriageModule } from './triage/triage.module';
import { EmergencyModule } from './emergency/emergency.module';
import { GuidanceModule } from './guidance/guidance.module';
import { MapsModule } from './maps/maps.module';
import { HospitalsModule } from './hospitals/hospitals.module';
import { AmbulanceModule } from './ambulance/ambulance.module';
import { NotificationsModule } from './notifications/notifications.module';
import { ContactsModule } from './contacts/contacts.module';
import { PrearrivalModule } from './prearrival/prearrival.module';
import { TimelineModule } from './timeline/timeline.module';
import { AnalyticsModule } from './analytics/analytics.module';
import { AdminModule } from './admin/admin.module';
import { VoiceModule } from './voice/voice.module';
import { HealthController } from './health.controller';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ThrottlerModule.forRoot([{ ttl: 60_000, limit: 120 }]),
    PrismaModule,
    CommonModule,
    MapsModule,
    NotificationsModule,
    AuthModule,
    UsersModule,
    MedicalProfileModule,
    TriageModule,
    EmergencyModule,
    GuidanceModule,
    HospitalsModule,
    AmbulanceModule,
    ContactsModule,
    PrearrivalModule,
    TimelineModule,
    AnalyticsModule,
    AdminModule,
    VoiceModule,
  ],
  controllers: [HealthController],
  providers: [
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    { provide: APP_INTERCEPTOR, useClass: AuditInterceptor },
  ],
})
export class AppModule {}
