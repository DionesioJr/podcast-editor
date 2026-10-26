import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Response } from 'express';

@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: HttpException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const status = exception.getStatus();
    const exceptionResponse = exception.getResponse();

    const body: any =
      typeof exceptionResponse === 'object' ? exceptionResponse : {};

    const message =
      typeof exceptionResponse === 'string'
        ? exceptionResponse
        : body.message || exception.message;

    const code = body.code || this.deriveCode(status, message);

    response.status(status).json({
      statusCode: status,
      code,
      message,
    });
  }

  private deriveCode(status: number, message: string): string {
    if (status === HttpStatus.UNPROCESSABLE_ENTITY) {
      return 'VALIDATION_ERROR';
    }
    if (status === HttpStatus.BAD_REQUEST) {
      return 'VALIDATION_ERROR';
    }
    if (status === HttpStatus.UNAUTHORIZED) {
      return 'UNAUTHORIZED';
    }
    if (status === HttpStatus.FORBIDDEN) {
      return 'FORBIDDEN';
    }
    if (status === HttpStatus.NOT_FOUND) {
      return 'NOT_FOUND';
    }
    if (status === HttpStatus.CONFLICT) {
      return 'CONFLICT';
    }
    if (status === HttpStatus.TOO_MANY_REQUESTS) {
      return 'RATE_LIMIT_EXCEEDED';
    }
    return 'INTERNAL_ERROR';
  }
}
