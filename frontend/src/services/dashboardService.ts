import { apiClient } from './api';
import { DashboardSummary } from '../types';

export const dashboardService = {
  async getSummary() {
    return apiClient<DashboardSummary>('/dashboard/summary');
  },

  async getCollectionTrend(days: number = 7) {
    return apiClient<{ date: string; liters: number; amount: number; avgFat: number }[]>(
      `/dashboard/collection?days=${days}`
    );
  },

  async getQualityAnalytics() {
    return apiClient<{
      averages: { ph: number; fat: number; density: number; conductivity: number; temperature: number };
      thresholds: any;
      distribution: { classification: string; count: number }[];
    }>('/dashboard/quality');
  }
};
