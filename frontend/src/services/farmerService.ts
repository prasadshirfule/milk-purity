import { apiClient } from './api';
import { Farmer } from '../types';

export const farmerService = {
  async getAll(params?: { search?: string; animalType?: string; status?: string }) {
    const query = new URLSearchParams();
    if (params?.search) query.set('search', params.search);
    if (params?.animalType) query.set('animalType', params.animalType);
    if (params?.status) query.set('status', params.status);

    return apiClient<Farmer[]>(`/farmers?${query.toString()}`);
  },

  async getById(id: string) {
    return apiClient<Farmer & { tests: any[] }>(`/farmers/${id}`);
  },

  async create(data: Partial<Farmer>) {
    return apiClient<Farmer>('/farmers', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  },

  async update(id: string, data: Partial<Farmer>) {
    return apiClient<Farmer>(`/farmers/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  },

  async delete(id: string) {
    return apiClient<void>(`/farmers/${id}`, {
      method: 'DELETE'
    });
  }
};
