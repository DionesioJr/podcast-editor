const apiUrl = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000';

export const api = {
  baseURL: apiUrl,
  timeout: 30000,
};
