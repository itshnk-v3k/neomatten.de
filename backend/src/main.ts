import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // All routes are served under /api (matches the Angular dev proxy).
  app.setGlobalPrefix('api');

  // Allow the main site (4200) and the admin app (4300) in development.
  app.enableCors({
    origin: ['http://localhost:4200', 'http://localhost:4300'],
    credentials: true,
  });

  // Global validation: strip unknown props, transform payloads to DTO types.
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // Swagger / OpenAPI docs at /api/docs.
  const config = new DocumentBuilder()
    .setTitle('NEOMATTEN API')
    .setDescription(
      'NEOMATTEN backend API — auth, orders, products, users, settings.',
    )
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  const port = process.env.PORT ?? 5000;
  await app.listen(port);
}
bootstrap();
