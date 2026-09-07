import {
  Farmer,
  MilkTest,
  MilkCollection,
  Device,
  Alert,
  DairySettings,
  DashboardSummary,
  User,
  AuditLog
} from '../types';

const API_BASE = '/api';

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  count?: number;
  summary?: any;
  error?: string;
  message?: string;
  token?: string;
  user?: User;
  collection?: MilkCollection;
  qualityAssessment?: any;
}

export async function apiClient<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  const url = `${API_BASE}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;
  
  const token = localStorage.getItem('milkguard_token');
  const defaultHeaders: Record<string, string> = {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  };

  if (token) {
    defaultHeaders['Authorization'] = `Bearer ${token}`;
  }

  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        ...defaultHeaders,
        ...((options.headers as Record<string, string>) || {})
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

export const api = {
  // Auth APIs
  login: (credentials: { username: string; password?: string }) =>
    apiClient<{ user: User; token: string }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials)
    }),
  getMe: () => apiClient<User>('/auth/me'),
  logout: () =>
    apiClient<any>('/auth/logout', {
      method: 'POST'
    }),
  getUsers: () => apiClient<User[]>('/auth/users'),
  updateUser: (userId: string, data: Partial<User>) =>
    apiClient<User>(`/auth/users/${userId}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    }),

  // Audit Logs
  getAuditLogs: (params?: { action?: string; role?: string; userId?: string; customerCode?: string; limit?: number }) => {
    const qs = params ? '?' + new URLSearchParams(params as any).toString() : '';
    return apiClient<AuditLog[]>(`/audit-logs${qs}`);
  },
  logAudit: (event: Partial<AuditLog>) =>
    apiClient<AuditLog>('/audit-logs', {
      method: 'POST',
      body: JSON.stringify(event)
    }),

  getSummary: () => apiClient<DashboardSummary>('/dashboard/summary'),
  getFarmers: (params?: { search?: string; animalType?: string; status?: string }) => {
    const qs = params ? '?' + new URLSearchParams(params as any).toString() : '';
    return apiClient<Farmer[]>(`/farmers${qs}`);
  },
  getFarmerById: (id: string) => apiClient<Farmer & { tests?: MilkTest[] }>(`/farmers/${id}`),
  getFarmerByCustomerCode: (code: string) => apiClient<Farmer & { tests?: MilkTest[] }>(`/farmers/code/${encodeURIComponent(code)}`),
  createFarmer: (farmer: Partial<Farmer>) =>
    apiClient<Farmer>('/farmers', {
      method: 'POST',
      body: JSON.stringify(farmer)
    }),
  updateFarmer: (id: string, farmer: Partial<Farmer>) =>
    apiClient<Farmer>(`/farmers/${id}`, {
      method: 'PUT',
      body: JSON.stringify(farmer)
    }),
  deleteFarmer: (id: string) =>
    apiClient<any>(`/farmers/${id}`, {
      method: 'DELETE'
    }),
  getTests: (params?: { farmerId?: string; customerCode?: string; result?: string; date?: string; search?: string }) => {
    const qs = params ? '?' + new URLSearchParams(params as any).toString() : '';
    return apiClient<MilkTest[]>(`/tests${qs}`);
  },
  getTestById: (id: string) => apiClient<MilkTest>(`/tests/${id}`),
  createTest: (testData: {
    farmerId: string;
    customerCode?: string;
    farmerName?: string;
    deviceId: string;
    quantity: number;
    temperature?: number;
    ph?: number;
    fat?: number;
    density?: number;
    conductivity?: number;
    milkLevel?: number;
    operatorDecision?: 'ACCEPT' | 'REJECT';
    overrideReason?: string;
    notes?: string;
  }) =>
    apiClient<MilkTest>('/tests', {
      method: 'POST',
      body: JSON.stringify(testData)
    }),
  getCollections: () => apiClient<MilkCollection[]>('/collections'),
  getDevices: () => apiClient<Device[]>('/devices'),
  getDeviceById: (id: string) => apiClient<Device>(`/devices/${id}`),
  registerDevice: (device: Partial<Device>) =>
    apiClient<Device>('/devices', {
      method: 'POST',
      body: JSON.stringify(device)
    }),
  updateDevice: (id: string, device: Partial<Device>) =>
    apiClient<Device>(`/devices/${id}`, {
      method: 'PUT',
      body: JSON.stringify(device)
    }),
  deleteDevice: (id: string) =>
    apiClient<any>(`/devices/${id}`, {
      method: 'DELETE'
    }),
  triggerDeviceHeartbeat: (id: string) =>
    apiClient<Device>(`/devices/${id}/heartbeat`, {
      method: 'POST'
    }),
  sendDeviceTelemetry: (deviceId: string, reading: any) =>
    apiClient<{ reading: any }>(`/devices/${encodeURIComponent(deviceId)}/telemetry`, {
      method: 'POST',
      body: JSON.stringify(reading)
    }),
  getLatestTelemetry: (deviceId: string) =>
    apiClient<any>(`/devices/${encodeURIComponent(deviceId)}/telemetry/latest`),
  simulateSensorTick: (deviceId?: string) =>
    apiClient<any>(`/sensors/simulate${deviceId ? `?deviceId=${encodeURIComponent(deviceId)}` : ''}`),
  getAlerts: (params?: { status?: string; severity?: string }) => {
    const qs = params ? '?' + new URLSearchParams(params as any).toString() : '';
    return apiClient<Alert[]>(`/alerts${qs}`);
  },
  updateAlertStatus: (id: string, status: string) =>
    apiClient<Alert>(`/alerts/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ status })
    }),
  getSettings: () => apiClient<DairySettings>('/settings'),
  updateSettings: (settings: Partial<DairySettings>) =>
    apiClient<DairySettings>('/settings', {
      method: 'PUT',
      body: JSON.stringify(settings)
    })
};

