import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Obter ConfigService
  const configService = app.get(ConfigService);
  const port = configService.get<number>('port');
  const nodeEnv = configService.get<string>('nodeEnv');
  const corsEnabled = configService.get<boolean>('cors.enabled');
  const corsOrigin = configService.get<string>('cors.origin');

  // Configuração de CORS
  if (corsEnabled) {
    app.enableCors({
      origin: corsOrigin,
      credentials: true,
    });
  }

  // Configuração de validação global
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // Remove propriedades não definidas nos DTOs
      transform: true, // Transforma payloads para instâncias de DTOs
      forbidNonWhitelisted: true, // Lança erro se houver propriedades não permitidas
      transformOptions: {
        enableImplicitConversion: true, // Converte tipos automaticamente
      },
    }),
  );

  await app.listen(port);

  console.log('=========================================');
  console.log('🚀 Linos Panificadora - Backend Started');
  console.log('=========================================');
  console.log(`📍 URL: http://localhost:${port}`);
  console.log(`🌍 Environment: ${nodeEnv}`);
  console.log(`🔓 CORS: ${corsEnabled ? 'Enabled' : 'Disabled'} (${corsOrigin})`);
  console.log(`✅ Health Check: http://localhost:${port}/health`);
  console.log('=========================================');
}

bootstrap();
