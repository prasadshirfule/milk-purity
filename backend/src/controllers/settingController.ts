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

    const user = (req as any).user;
    if (user) {
      await dataRepository.addAuditLog({
        userId: user.userId,
        userName: user.name,
        role: user.role,
        action: 'UPDATE_SETTINGS',
        entityType: 'SETTING',
        details: `Dairy quality thresholds / pricing configuration updated by ${user.name} (${user.role})`,
        ipAddress: req.ip || '127.0.0.1'
      });
    }

    res.json({ success: true, message: 'Settings updated successfully', data: updated });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};
