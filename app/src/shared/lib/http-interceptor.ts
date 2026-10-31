import { BASE_URL } from '@src/config/api';
import { ApiError } from './api-error';

interface ApiErrorBody {
  code?: string;
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

export async function extractErrorCode(response: Response): Promise<string> {
  try {
    const body = (await response.json()) as ApiErrorBody;
    const code = body?.code;
    return typeof code === 'string' && code.trim() ? code : FALLBACK_CODE;
  } catch {
    return FALLBACK_CODE;
  }
}

export async function interceptResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const code = await extractErrorCode(response);
    throw new ApiError(code, response.status);
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
