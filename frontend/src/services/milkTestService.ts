import { apiClient } from './api';
import { MilkTest, QualityResult } from '../types';

export const milkTestService = {
  async getAll(params?: { farmerId?: string; result?: string; date?: string; search?: string }) {
    const query = new URLSearchParams();
    if (params?.farmerId) query.set('farmerId', params.farmerId);
    if (params?.result) query.set('result', params.result);
    if (params?.date) query.set('date', params.date);
    if (params?.search) query.set('search', params.search);

    return apiClient<MilkTest[]>(`/tests?${query.toString()}`);
  },

  async getById(id: string) {
    return apiClient<MilkTest>(`/tests/${id}`);
  },

  async create(data: {
    farmerId: string;
    farmerName?: string;
    deviceId?: string;
    quantity: number;
    temperature: number;
    ph: number;
    fat: number;
    density: number;
    conductivity: number;
    milkLevel?: number;
    notes?: string;
  }) {
    return apiClient<{ data: MilkTest; qualityAssessment: QualityResult }>('/tests', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }
};
