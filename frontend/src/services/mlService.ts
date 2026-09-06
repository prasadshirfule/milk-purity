import { apiClient } from './api';
import { SensorReading, MLPredictionResponse } from '../types';

export const mlService = {
  async predict(reading: SensorReading) {
    return apiClient<MLPredictionResponse>('/ml/predict', {
      method: 'POST',
      body: JSON.stringify(reading)
    });
  }
};
