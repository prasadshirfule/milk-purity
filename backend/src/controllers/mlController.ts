import { Request, Response } from 'express';
import { MLService } from '../services/mlService';
import { sensorService } from '../services/sensorService';

export const predictPurity = async (req: Request, res: Response): Promise<void> => {
  try {
    const reading = req.body;
    const validation = sensorService.validateReading(reading);
    if (!validation.valid || !validation.reading) {
      res.status(400).json({ success: false, error: validation.error });
      return;
    }

    const predictionResult = await MLService.predictPurity(validation.reading);
    res.json({
      success: true,
      data: predictionResult
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};
