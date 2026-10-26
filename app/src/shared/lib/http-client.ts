import { BASE_URL } from '@src/config/api';
import { ApiError } from './api-error';

interface ErrorResponse {
  code?: string;
  message?: string;
}

interface RequestOptions extends RequestInit {
  timeout?: number;
}

async function request<T>(
  endpoint: string,
  options: RequestOptions = {}
): Promise<T> {
  const { timeout = 30000, ...init } = options;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const url = new URL(endpoint, BASE_URL);
    const baseUrl = new URL(BASE_URL);

    if (url.origin !== baseUrl.origin) {
      throw new ApiError('SERVER_ERROR', 400);
    }

    const response = await fetch(url.toString(), {
      ...init,
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const data = (await response.json()) as ErrorResponse;
      const code = data.code || 'SERVER_ERROR';
      throw new ApiError(code, response.status);
    }

    return response.json() as Promise<T>;
  } catch (error) {
    clearTimeout(timeoutId);

    if (error instanceof ApiError) {
      throw error;
    }

    if (error instanceof TypeError && error.message.includes('Failed to fetch')) {
      throw new ApiError('NETWORK_ERROR', 0);
    }

    if (error instanceof Error && error.name === 'AbortError') {
      throw new ApiError('TIMEOUT', 0);
    }

    throw new ApiError('SERVER_ERROR', 500);
  }
}

export const httpClient = {
  get<T>(endpoint: string, options?: RequestOptions) {
    return request<T>(endpoint, { ...options, method: 'GET' });
  },
  post<T>(endpoint: string, body?: unknown, options?: RequestOptions) {
    return request<T>(endpoint, {
      ...options,
      method: 'POST',
      body: body ? JSON.stringify(body) : undefined,
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
    });
  },
  put<T>(endpoint: string, body?: unknown, options?: RequestOptions) {
    return request<T>(endpoint, {
      ...options,
      method: 'PUT',
      body: body ? JSON.stringify(body) : undefined,
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
    });
  },
  patch<T>(endpoint: string, body?: unknown, options?: RequestOptions) {
    return request<T>(endpoint, {
      ...options,
      method: 'PATCH',
      body: body ? JSON.stringify(body) : undefined,
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
    });
  },
  delete<T>(endpoint: string, options?: RequestOptions) {
    return request<T>(endpoint, { ...options, method: 'DELETE' });
  },
};
