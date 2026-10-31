import { getErrorMessage } from '@src/i18n';

export class ApiError extends Error {
  readonly code: string;
  readonly statusCode: number;

  constructor(code: string, statusCode: number = 500) {
    super(getErrorMessage(code || 'SERVER_ERROR'));
    this.name = 'ApiError';
    this.code = code;
    this.statusCode = statusCode;
  }
}

export function handleApiError(error: unknown): ApiError {
  if (error instanceof ApiError) {
    return error;
  }

  if (error instanceof Error) {
    return new ApiError(error.message, 500);
  }

  return new ApiError('SERVER_ERROR', 500);
}
