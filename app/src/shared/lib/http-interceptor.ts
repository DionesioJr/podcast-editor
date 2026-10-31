import { BASE_URL } from '@src/config/api';
import { ApiError } from './api-error';

interface ApiErrorBody {
  code?: string;
  message?: string;
}

export interface ExtractedError {
  code: string;
  message?: string;
}

const FALLBACK_CODE = 'SERVER_ERROR';

export function buildRequestUrl(endpoint: string): string {
  const baseUrl = new URL(BASE_URL);
  const url = new URL(endpoint, baseUrl);

  if (url.origin !== baseUrl.origin) {
    throw new ApiError('SERVER_ERROR', 400);
  }

  return url.toString();
}

export async function extractError(
  response: Response,
): Promise<ExtractedError> {
  try {
    const body = (await response.json()) as ApiErrorBody;
    const code =
      typeof body?.code === 'string' && body.code.trim()
        ? body.code.trim()
        : FALLBACK_CODE;
    const message =
      typeof body?.message === 'string' && body.message.trim()
        ? body.message.trim()
        : undefined;

    return { code, message };
  } catch {
    return { code: FALLBACK_CODE };
  }
}

export async function extractErrorCode(response: Response): Promise<string> {
  const { code } = await extractError(response);

  return code;
}

export async function interceptResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const { code, message } = await extractError(response);
    throw new ApiError(code, response.status, message);
  }

  if (response.status === 204) {
    return undefined as unknown as T;
  }

  const text = await response.text();
  if (!text) {
    return undefined as unknown as T;
  }

  try {
    return JSON.parse(text) as T;
  } catch {
    throw new ApiError('SERVER_ERROR', response.status);
  }
}
