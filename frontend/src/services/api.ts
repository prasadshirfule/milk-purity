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

    const contentType = response.headers.get('content-type') || '';
    let parsedBody: any = null;

    if (contentType.includes('application/json')) {
      try {
        parsedBody = await response.json();
      } catch (jsonErr) {
        parsedBody = null;
      }
    } else {
      const textBody = await response.text();
      parsedBody = textBody ? { message: textBody } : null;
    }

    if (!response.ok) {
      const errorMessage =
        parsedBody?.error ||
        parsedBody?.message ||
        `HTTP ${response.status}: ${response.statusText || 'Request failed'}`;
      return {
        success: false,
        error: errorMessage
      };
    }

    if (parsedBody && typeof parsedBody === 'object') {
      return parsedBody as ApiResponse<T>;
    }

    return {
      success: true,
      data: parsedBody as T
    };
  } catch (error: any) {
    console.warn(`API call failed for ${endpoint}:`, error?.message || error);
    return {
      success: false,
      error: error?.message || 'Network error / backend service unreachable'
    };
  }
}
