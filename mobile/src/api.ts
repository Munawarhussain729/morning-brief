import { API_BASE_URL } from './config';
import type { BriefResponse } from './types';

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    ...options,
  });

  if (!response.ok) {
    throw new Error(`Request failed with ${response.status}`);
  }

  return response.json() as Promise<T>;
}

export function fetchBrief(): Promise<BriefResponse> {
  return request<BriefResponse>('/api/brief');
}

export function refreshBrief(): Promise<{ briefId: string }> {
  return request<{ briefId: string }>('/api/refresh', { method: 'POST' });
}
