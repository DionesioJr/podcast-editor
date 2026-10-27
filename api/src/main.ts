import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { UnprocessableEntityException, ValidationPipe as NestValidationPipe } from '@nestjs/common';
import type { Request, Response } from 'express';

import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { translateConstraints } from './common/validation/translate-constraints';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const port = process.env.PORT ?? 3000;

  app.useGlobalFilters(new HttpExceptionFilter());

  app.useGlobalPipes(
    new NestValidationPipe({
      transform: true,
      forbidNonWhitelisted: true,
      whitelist: true,
      exceptionFactory: (errors: any[]) => {
        const message = errors
          .flatMap((err) => {
            const field = err.property;
            const constraints = translateConstraints(err.constraints || {});
            return constraints.map((c) => `${field} ${c}`);
          })
          .join('; ');

        const exception = new UnprocessableEntityException(message);
        (exception as any).response = {
          statusCode: 422,
          code: 'VALIDATION_ERROR',
          message,
        };
        return exception;
      },
    }),
  );

  const config = new DocumentBuilder()
    .setTitle('Podcast Editor API')
    .setDescription('Documentação da API do Podcast Editor')
    .setVersion('1.0')
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('docs', app, document);

  app.getHttpServer().get('/docs-json', (req: Request, res: Response) => {
    res.json(document);
  });

  app.setGlobalPrefix('v1', {
    exclude: ['/health', '/docs', '/docs-json'],
  });

  await app.listen(port);
}

bootstrap();
