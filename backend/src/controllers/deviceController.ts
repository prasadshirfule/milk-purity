import { Request, Response } from 'express';
import { dataRepository } from '../services/seedService';

export const getDevices = async (req: Request, res: Response): Promise<void> => {
  try {
    const devices = await dataRepository.getDevices();
    res.json({ success: true, count: devices.length, data: devices });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const getDeviceById = async (req: Request, res: Response): Promise<void> => {
  try {
    const device = await dataRepository.getDeviceById(req.params.id);
    if (!device) {
      res.status(404).json({ success: false, error: 'Device not found' });
      return;
    }
    res.json({ success: true, data: device });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const deviceHeartbeat = async (req: Request, res: Response): Promise<void> => {
  try {
    const updated = await dataRepository.updateDeviceHeartbeat(req.params.id);
    if (!updated) {
      res.status(404).json({ success: false, error: 'Device not found' });
      return;
    }
    res.json({ success: true, message: 'Heartbeat acknowledged', data: updated });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};
