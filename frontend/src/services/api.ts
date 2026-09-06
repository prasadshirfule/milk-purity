const API_BASE = '/api';

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  count?: number;
  summary?: any;
  error?: string;
  message?: string;
}

export async function apiClient<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  const url = `${API_BASE}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;
  const defaultHeaders: HeadersInit = {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  };

  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        ...defaultHeaders,
        ...options.headers
      }
    });

    const data = await response.json();
    return data;
  } catch (error: any) {
    // If backend is unreachable, throw so caller / demo context can provide fallback
    console.warn(`API call failed for ${endpoint}:`, error?.message || error);
    return {
      success: false,
      error: error?.message || 'Network error / backend unavailable'
    };
  }
}
