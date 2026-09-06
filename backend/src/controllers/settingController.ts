import { Request, Response } from 'express';
import { dataRepository } from '../services/seedService';

export const getSettings = async (req: Request, res: Response): Promise<void> => {
  try {
    const settings = await dataRepository.getSettings();
    res.json({ success: true, data: settings });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const updateSettings = async (req: Request, res: Response): Promise<void> => {
  try {
    const updated = await dataRepository.updateSettings(req.body);
    res.json({ success: true, message: 'Settings updated successfully', data: updated });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};
