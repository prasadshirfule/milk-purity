import { Request, Response } from 'express';
import { sensorService } from '../services/sensorService';
import { QualityService } from '../services/qualityService';
import { dataRepository } from '../services/seedService';

export const receiveSensorReading = async (req: Request, res: Response): Promise<void> => {
  try {
    const validation = sensorService.validateReading(req.body);
    if (!validation.valid || !validation.reading) {
      res.status(400).json({ success: false, error: validation.error });
      return;
    }

    sensorService.storeReading(validation.reading);
    await dataRepository.updateDeviceHeartbeat(validation.reading.deviceId);

    // Instant quality preview computation
    const settings = await dataRepository.getSettings();
    const qualityEval = QualityService.calculateQuality(validation.reading, settings.thresholds);

    res.status(200).json({
      success: true,
      message: 'Sensor reading ingested successfully',
      reading: validation.reading,
      qualityPreview: qualityEval
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const getLatestReading = async (req: Request, res: Response): Promise<void> => {
  try {
    const deviceId = (req.query.deviceId as string) || 'ESP32-MILK-001';
    const reading = sensorService.getLatestReading(deviceId);
    const settings = await dataRepository.getSettings();
    const qualityEval = QualityService.calculateQuality(reading, settings.thresholds);

    res.json({
      success: true,
      data: reading,
      qualityPreview: qualityEval
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const simulateSensorTick = async (req: Request, res: Response): Promise<void> => {
  try {
    const deviceId = (req.query.deviceId as string) || 'ESP32-MILK-001';
    const reading = sensorService.generateSimulatedReading(deviceId);
    const settings = await dataRepository.getSettings();
    const qualityEval = QualityService.calculateQuality(reading, settings.thresholds);

    res.json({
      success: true,
      data: reading,
      qualityPreview: qualityEval
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};
