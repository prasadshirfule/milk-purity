import { Request, Response, NextFunction } from 'express';
import { IUser, UserRole, UserStatus } from '../types';
import { dataRepository } from '../services/seedService';

export interface AuthenticatedRequest extends Request {
  user?: IUser;
}

// Token generation & parsing utility
export const generateAuthToken = (user: { userId: string; username: string; role: UserRole; status?: UserStatus; name?: string }): string => {
  const payload = {
    userId: user.userId,
    username: user.username,
    role: user.role,
    ts: Date.now()
  };
  return Buffer.from(JSON.stringify(payload)).toString('base64');
};

export const parseAuthToken = (token: string): { userId: string; username: string; role: UserRole } | null => {
  try {
    const raw = Buffer.from(token, 'base64').toString('utf8');
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed.userId === 'string' && typeof parsed.username === 'string') {
      return parsed;
    }
    return null;
  } catch (e) {
    return null;
  }
};

export const authenticate = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const authHeader = req.headers.authorization || (req.headers['x-auth-token'] as string);
    let token = '';

    if (authHeader && typeof authHeader === 'string') {
      if (authHeader.startsWith('Bearer ')) {
        token = authHeader.slice(7).trim();
      } else {
        token = authHeader.trim();
      }
    }

    if (!token) {
      res.status(401).json({
        success: false,
        error: 'Authentication required: missing or empty authorization token'
      });
      return;
    }

    const payload = parseAuthToken(token);
    if (!payload) {
      res.status(401).json({
        success: false,
        error: 'Invalid authentication token: signature/format malformed'
      });
      return;
    }

    const user = (await dataRepository.getUserById(payload.userId)) || (await dataRepository.getUserByUsername(payload.username));
    if (!user) {
      res.status(401).json({
        success: false,
        error: 'Authentication failed: operator account not found'
      });
      return;
    }

    if (user.status !== 'ACTIVE') {
      res.status(403).json({
        success: false,
        error: 'Authentication failed: operator account is inactive or disabled'
      });
      return;
    }

    req.user = user;
    next();
  } catch (err: any) {
    res.status(500).json({ success: false, error: err?.message || 'Authentication error' });
  }
};

export const optionalAuthenticate = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const authHeader = req.headers.authorization || (req.headers['x-auth-token'] as string);
    let token = '';

    if (authHeader && typeof authHeader === 'string') {
      if (authHeader.startsWith('Bearer ')) {
        token = authHeader.slice(7).trim();
      } else {
        token = authHeader.trim();
      }
    }

    if (token) {
      const payload = parseAuthToken(token);
      if (!payload) {
        res.status(401).json({ success: false, error: 'Invalid authentication token format' });
        return;
      }
      const user = (await dataRepository.getUserById(payload.userId)) || (await dataRepository.getUserByUsername(payload.username));
      if (!user) {
        res.status(401).json({ success: false, error: 'Operator account not found' });
        return;
      }
      if (user.status !== 'ACTIVE') {
        res.status(403).json({ success: false, error: 'Operator account is inactive or disabled' });
        return;
      }
      req.user = user;
    } else {
      // Default fallback operator for open demo mode requests without auth header
      req.user = {
        userId: 'USR-002',
        name: 'Rajendra Deshmukh',
        username: 'operator',
        role: 'OPERATOR',
        status: 'ACTIVE',
        createdAt: new Date('2026-01-01'),
        updatedAt: new Date()
      };
    }

    next();
  } catch (err: any) {
    next();
  }
};

export const requireRole = (...allowedRoles: UserRole[]) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: 'Authentication required: user session not found'
      });
      return;
    }

    if (!allowedRoles.includes(req.user.role)) {
      res.status(403).json({
        success: false,
        error: `Access forbidden: role "${req.user.role}" does not have required permissions for this operation. Requires one of: [${allowedRoles.join(', ')}]`
      });
      return;
    }

    next();
  };
};
