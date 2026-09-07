import { Router } from 'express';
import { login, getCurrentUser, logout, getUsers, createUser, updateUser } from '../controllers/authController';
import { authenticate, requireRole } from '../middleware/authMiddleware';

const router = Router();

router.post('/login', login);
router.get('/me', authenticate, getCurrentUser);
router.post('/logout', authenticate, logout);

// Admin-only user management
router.get('/users', authenticate, requireRole('ADMIN'), getUsers);
router.post('/users', authenticate, requireRole('ADMIN'), createUser);
router.put('/users/:id', authenticate, requireRole('ADMIN'), updateUser);

export default router;
