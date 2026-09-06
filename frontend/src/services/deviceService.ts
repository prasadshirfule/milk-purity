import { apiClient } from './api';
import { Device, SensorReading } from '../types';

export const deviceService = {
  async getAll() {
    return apiClient<Device[]>('/devices');
  },

  async getById(id: string) {
    return apiClient<Device>(`/devices/${id}`);
  },

  async sendHeartbeat(id: string) {
    return apiClient<{ message: string }>(`/devices/${id}/heartbeat`, {
      method: 'POST'
    });
  },

  async getLatestSensors(deviceId: string = 'ESP32-MILK-001') {
    return apiClient<SensorReading>(`/sensors/latest?deviceId=${deviceId}`);
  },

  async simulateTick(deviceId: string = 'ESP32-MILK-001') {
    return apiClient<SensorReading>(`/sensors/simulate?deviceId=${deviceId}`);
  }
};
