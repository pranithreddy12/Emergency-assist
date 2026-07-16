import { NestFactory } from '@nestjs/core';
import { Logger } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { configureApp } from './app-config';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { bufferLogs: false });
  const prefix = configureApp(app);

  const swaggerConfig = new DocumentBuilder()
    .setTitle('EmergencyAI API')
    .setDescription(
      'AI-powered emergency assistant. Never diagnoses, never prescribes medication.',
    )
    .setVersion('0.1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('docs', app, document);

  const port = Number(process.env.PORT ?? 3000);
  await app.listen(port);
  Logger.log(`EmergencyAI API on http://localhost:${port}/${prefix}`, 'Bootstrap');
  Logger.log(`Swagger docs at http://localhost:${port}/docs`, 'Bootstrap');
}

bootstrap();
