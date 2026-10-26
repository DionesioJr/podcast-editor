import { getErrorMessage } from '@src/i18n';

export class ApiError extends Error {
  constructor(public code: string, public statusCode: number = 500) {
    const message = getErrorMessage(code);
    super(message);
    this.name = 'ApiError';
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
