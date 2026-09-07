import { Router } from 'express';
import { getAuditLogs, createAuditLog } from '../controllers/auditController';
import { authenticate, requireRole } from '../middleware/authMiddleware';

const router = Router();

// Admin-only access to query audit trail
router.get('/', authenticate, requireRole('ADMIN'), getAuditLogs);
router.post('/', authenticate, createAuditLog);

export default router;
