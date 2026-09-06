import { Request, Response } from 'express';
import { dataRepository } from '../services/seedService';

export const getAlerts = async (req: Request, res: Response): Promise<void> => {
  try {
    const { status, severity } = req.query;
    let alerts = await dataRepository.getAlerts();

    if (status && typeof status === 'string' && status !== 'ALL') {
      alerts = alerts.filter(a => a.status === status);
    }

    if (severity && typeof severity === 'string' && severity !== 'ALL') {
      alerts = alerts.filter(a => a.severity === severity);
    }

    res.json({ success: true, count: alerts.length, data: alerts });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const updateAlertStatus = async (req: Request, res: Response): Promise<void> => {
  try {
    const { status } = req.body;
    if (!status || !['ACTIVE', 'RESOLVED', 'DISMISSED'].includes(status)) {
      res.status(400).json({ success: false, error: 'Invalid status. Must be ACTIVE, RESOLVED, or DISMISSED' });
      return;
    }

    const updated = await dataRepository.updateAlertStatus(req.params.id, status);
    if (!updated) {
      res.status(404).json({ success: false, error: 'Alert not found' });
      return;
    }

    res.json({ success: true, data: updated });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};
