import { Response } from 'express';
import { dataRepository } from '../services/seedService';
import { AuthenticatedRequest } from '../middleware/authMiddleware';

export const getAuditLogs = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { user, role, action, customerCode, date, search } = req.query;

    const logs = await dataRepository.getAuditLogs({
      user: typeof user === 'string' ? user : undefined,
      role: typeof role === 'string' ? role : undefined,
      action: typeof action === 'string' ? action : undefined,
      customerCode: typeof customerCode === 'string' ? customerCode : undefined,
      date: typeof date === 'string' ? date : undefined,
      search: typeof search === 'string' ? search : undefined
    });

    res.json({
      success: true,
      count: logs.length,
      data: logs
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err?.message || 'Failed to fetch audit logs' });
  }
};

export const createAuditLog = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { action, entityType, entityId, customerCode, details } = req.body;

    if (!action || !details) {
      res.status(400).json({ success: false, error: 'action and details are required' });
      return;
    }

    const log = await dataRepository.addAuditLog({
      userId: req.user?.userId || 'USR-SYSTEM',
      userName: req.user?.name || 'System Engine',
      role: req.user?.role || 'OPERATOR',
      action,
      entityType: entityType || 'GENERAL',
      entityId,
      customerCode,
      details,
      ipAddress: req.ip || '127.0.0.1'
    });

    res.status(201).json({ success: true, data: log });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err?.message || 'Failed to record audit log' });
  }
};
