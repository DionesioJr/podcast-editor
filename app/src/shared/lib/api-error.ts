import { getErrorMessage } from '@src/i18n';

const DEFAULT_HTTP_MESSAGES = new Set([
  'Bad Request',
  'Unauthorized',
  'Forbidden',
  'Not Found',
  'Method Not Allowed',
  'Not Acceptable',
  'Conflict',
  'Payload Too Large',
  'Unprocessable Entity',
  'Too Many Requests',
  'ThrottlerException: Too Many Requests',
  'Internal Server Error',
  'Not Implemented',
  'Bad Gateway',
  'Service Unavailable',
  'Gateway Timeout',
]);

const GENERIC_MESSAGE = 'Erro desconhecido.';

function resolveMessage(code: string, detail?: string): string {
  const translated = getErrorMessage(code);
  const message = detail?.trim();

  if (
    message &&
    translated !== GENERIC_MESSAGE &&
    !DEFAULT_HTTP_MESSAGES.has(message)
  ) {
    return message;
  }

  return translated;
}

export class ApiError extends Error {
  readonly code: string;
  readonly statusCode: number;
  readonly detail?: string;

  constructor(code: string, statusCode: number = 500, detail?: string) {
    const safeCode = code || 'SERVER_ERROR';

    super(resolveMessage(safeCode, detail));
    this.name = 'ApiError';
    this.code = safeCode;
    this.statusCode = statusCode;
    this.detail = detail;
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
