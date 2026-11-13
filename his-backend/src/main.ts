import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import { DomainExceptionFilter } from './shared/domain/infrastructure/filters/domain-exception.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Activa validaciones de DTOs (class-validator)
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }));

  // Traduce automáticamente cualquier DomainException a HTTP 400
  app.useGlobalFilters(new DomainExceptionFilter());

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();