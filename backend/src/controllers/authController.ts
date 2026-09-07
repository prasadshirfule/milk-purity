import { Request, Response } from 'express';
import { dataRepository } from '../services/seedService';
import { generateAuthToken, AuthenticatedRequest } from '../middleware/authMiddleware';

export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      res.status(400).json({
        success: false,
        error: 'Username and password are required'
      });
      return;
    }

    const user = await dataRepository.getUserByUsername(username);
    if (!user) {
      res.status(401).json({
        success: false,
        error: 'Invalid credentials. User does not exist.'
      });
      return;
    }

    if (user.status !== 'ACTIVE') {
      res.status(403).json({
        success: false,
        error: 'Account disabled or inactive. Please contact the dairy administrator.'
      });
      return;
    }

    // Simple password check (supports 'dairy2026' or user.password)
    const validPassword = user.password ? user.password === password : password === 'dairy2026';
    if (!validPassword) {
      res.status(401).json({
        success: false,
        error: 'Invalid credentials. Incorrect password.'
      });
      return;
    }

    const token = generateAuthToken(user);

    // Record login audit event
    await dataRepository.addAuditLog({
      userId: user.userId,
      userName: user.name,
      role: user.role,
      action: 'LOGIN',
      entityType: 'AUTH',
      entityId: user.userId,
      details: `Operator ${user.name} (${user.role}) logged in successfully`,
      ipAddress: req.ip || '127.0.0.1'
    });

    const sanitizedUser = {
      userId: user.userId,
      name: user.name,
      username: user.username,
      role: user.role,
      status: user.status,
      dairyName: user.dairyName
    };

    res.json({
      success: true,
      token,
      user: sanitizedUser
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err?.message || 'Login error' });
  }
};

export const getCurrentUser = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, error: 'Not authenticated' });
      return;
    }

    const sanitizedUser = {
      userId: req.user.userId,
      name: req.user.name,
      username: req.user.username,
      role: req.user.role,
      status: req.user.status,
      dairyName: req.user.dairyName
    };

    res.json({
      success: true,
      user: sanitizedUser
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err?.message || 'Failed to fetch user profile' });
  }
};

export const logout = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (req.user) {
      await dataRepository.addAuditLog({
        userId: req.user.userId,
        userName: req.user.name,
        role: req.user.role,
        action: 'LOGOUT',
        entityType: 'AUTH',
        entityId: req.user.userId,
        details: `Operator ${req.user.name} logged out`,
        ipAddress: req.ip || '127.0.0.1'
      });
    }

    res.json({ success: true, message: 'Logged out successfully' });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err?.message || 'Logout error' });
  }
};

export const getUsers = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const allUsers = await dataRepository.getUsers();
    const sanitized = allUsers.map(u => ({
      userId: u.userId,
      name: u.name,
      username: u.username,
      role: u.role,
      status: u.status,
      dairyName: u.dairyName,
      createdAt: u.createdAt,
      updatedAt: u.updatedAt
    }));

    res.json({ success: true, count: sanitized.length, data: sanitized });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err?.message || 'Failed to fetch users' });
  }
};

export const createUser = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { name, username, password, role, status, dairyName } = req.body;

    if (!name || !username) {
      res.status(400).json({ success: false, error: 'Name and username are required' });
      return;
    }

    const existing = await dataRepository.getUserByUsername(username);
    if (existing) {
      res.status(400).json({ success: false, error: `Username "${username}" is already taken` });
      return;
    }

    const newUser = await dataRepository.addUser({
      name,
      username,
      password: password || 'dairy2026',
      role: role || 'OPERATOR',
      status: status || 'ACTIVE',
      dairyName
    });

    if (req.user) {
      await dataRepository.addAuditLog({
        userId: req.user.userId,
        userName: req.user.name,
        role: req.user.role,
        action: 'USER_MANAGEMENT',
        entityType: 'USER',
        entityId: newUser.userId,
        details: `Created new operator user ${newUser.name} (@${newUser.username}) with role ${newUser.role}`,
        ipAddress: req.ip || '127.0.0.1'
      });
    }

    const sanitized = {
      userId: newUser.userId,
      name: newUser.name,
      username: newUser.username,
      role: newUser.role,
      status: newUser.status,
      dairyName: newUser.dairyName
    };

    res.status(201).json({ success: true, data: sanitized });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err?.message || 'Failed to create user' });
  }
};

export const updateUser = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { name, role, status, dairyName } = req.body;

    const updated = await dataRepository.updateUser(id, { name, role, status, dairyName });
    if (!updated) {
      res.status(404).json({ success: false, error: 'User not found' });
      return;
    }

    if (req.user) {
      await dataRepository.addAuditLog({
        userId: req.user.userId,
        userName: req.user.name,
        role: req.user.role,
        action: 'USER_MANAGEMENT',
        entityType: 'USER',
        entityId: updated.userId,
        details: `Updated operator ${updated.name}: role=${updated.role}, status=${updated.status}`,
        ipAddress: req.ip || '127.0.0.1'
      });
    }

    const sanitized = {
      userId: updated.userId,
      name: updated.name,
      username: updated.username,
      role: updated.role,
      status: updated.status,
      dairyName: updated.dairyName
    };

    res.json({ success: true, data: sanitized });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err?.message || 'Failed to update user' });
  }
};
