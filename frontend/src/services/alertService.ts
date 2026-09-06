import { apiClient } from './api';
import { Alert } from '../types';

export const alertService = {
  async getAll(params?: { status?: string; severity?: string }) {
    const query = new URLSearchParams();
    if (params?.status) query.set('status', params.status);
    if (params?.severity) query.set('severity', params.severity);

    return apiClient<Alert[]>(`/alerts?${query.toString()}`);
  },

  async updateStatus(id: string, status: 'ACTIVE' | 'RESOLVED' | 'DISMISSED') {
    return apiClient<Alert>(`/alerts/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ status })
    });
  }
};
