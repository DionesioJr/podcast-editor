import { UnprocessableEntityException, ValidationPipe } from '@nestjs/common';
import { ValidationError } from 'class-validator';

import { translateConstraints } from './translate-constraints';

export function createValidationPipe(): ValidationPipe {
  return new ValidationPipe({
    transform: true,
    forbidNonWhitelisted: true,
    whitelist: true,
    exceptionFactory: (errors: ValidationError[]) => {
      const message = errors
        .flatMap((err) => {
          const field = err.property;
          const constraints = translateConstraints(err.constraints || {});
          return constraints.map((c) => `${field} ${c}`);
        })
        .join('; ');

      return new UnprocessableEntityException({
        statusCode: 422,
        code: 'VALIDATION_ERROR',
        message,
      });
    },
  });
}
