import { apiClient } from './api';
import { MilkCollection } from '../types';

export const collectionService = {
  async getAll(params?: { farmerId?: string; date?: string; search?: string }) {
    const query = new URLSearchParams();
    if (params?.farmerId) query.set('farmerId', params.farmerId);
    if (params?.date) query.set('date', params.date);
    if (params?.search) query.set('search', params.search);

    return apiClient<MilkCollection[]>(`/collections?${query.toString()}`);
  },

  async create(data: Partial<MilkCollection>) {
    return apiClient<MilkCollection>('/collections', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }
};
