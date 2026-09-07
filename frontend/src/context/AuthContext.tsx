import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, UserRole, UserStatus } from '../types';
import { api } from '../services/api';

export const DEMO_ACCOUNTS: Record<UserRole, User> = {
  ADMIN: {
    userId: 'usr_admin_01',
    name: 'Vikram Malhotra',
    username: 'admin',
    role: 'ADMIN',
    status: 'ACTIVE',
    email: 'admin@milkguard.dairy',
    createdAt: new Date().toISOString()
  },
  OPERATOR: {
    userId: 'usr_op_01',
    name: 'Rajendra Deshmukh',
    username: 'operator',
    role: 'OPERATOR',
    status: 'ACTIVE',
    email: 'operator@milkguard.dairy',
    createdAt: new Date().toISOString()
  },
  QUALITY_OPERATOR: {
    userId: 'usr_quality_01',
    name: 'Dr. Sunita Rao',
    username: 'quality',
    role: 'QUALITY_OPERATOR',
    status: 'ACTIVE',
    email: 'quality@milkguard.dairy',
    createdAt: new Date().toISOString()
  },
  VIEWER: {
    userId: 'usr_viewer_01',
    name: 'Auditor Ramesh',
    username: 'viewer',
    role: 'VIEWER',
    status: 'ACTIVE',
    email: 'viewer@milkguard.dairy',
    createdAt: new Date().toISOString()
  }
};

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  login: (username: string, password?: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  demoLogin: (role?: UserRole) => Promise<boolean>;
  hasRole: (roles: UserRole | UserRole[]) => boolean;
  hasPermission: (action: string) => boolean;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('milkguard_user');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return DEMO_ACCOUNTS.OPERATOR;
      }
    }
    // Default to OPERATOR demo account
    return DEMO_ACCOUNTS.OPERATOR;
  });

  const [token, setToken] = useState<string | null>(() => {
    return localStorage.getItem('milkguard_token') || 'demo_token_operator';
  });

  const [isLoading, setIsLoading] = useState<boolean>(false);

  useEffect(() => {
    // If we have a token, verify with backend me
    const verifyMe = async () => {
      if (token && !token.startsWith('demo_token_')) {
        try {
          const res = await api.getMe();
          if (res.success && res.data) {
            setUser(res.data);
            localStorage.setItem('milkguard_user', JSON.stringify(res.data));
          }
        } catch (err) {
          console.warn('Could not verify session with backend:', err);
        }
      }
    };
    verifyMe();
  }, []);

  const login = async (username: string, password?: string): Promise<{ success: boolean; error?: string }> => {
    setIsLoading(true);
    try {
      const res = await api.login({ username, password });
      if (res.success && res.data) {
        const loggedUser = (res.data as any).user || res.data;
        const jwtToken = (res.data as any).token || 'token_' + Date.now();
        setUser(loggedUser);
        setToken(jwtToken);
        localStorage.setItem('milkguard_user', JSON.stringify(loggedUser));
        localStorage.setItem('milkguard_token', jwtToken);
        setIsLoading(false);
        return { success: true };
      } else {
        setIsLoading(false);
        return { success: false, error: res.error || 'Invalid credentials' };
      }
    } catch (err: any) {
      setIsLoading(false);
      return { success: false, error: err.message || 'Login failed' };
    }
  };

  const demoLogin = async (role: UserRole = 'OPERATOR'): Promise<boolean> => {
    const demoUser = DEMO_ACCOUNTS[role] || DEMO_ACCOUNTS.OPERATOR;
    const demoToken = `demo_token_${demoUser.username}`;
    
    // Try calling backend login for demo user if connected
    try {
      const res = await api.login({ username: demoUser.username, password: 'dairy2026' });
      if (res.success && res.data) {
        const loggedUser = (res.data as any).user || demoUser;
        const jwtToken = (res.data as any).token || demoToken;
        setUser(loggedUser);
        setToken(jwtToken);
        localStorage.setItem('milkguard_user', JSON.stringify(loggedUser));
        localStorage.setItem('milkguard_token', jwtToken);
        return true;
      }
    } catch (e) {
      // Backend not reached, fall back to local demo user
    }

    setUser(demoUser);
    setToken(demoToken);
    localStorage.setItem('milkguard_user', JSON.stringify(demoUser));
    localStorage.setItem('milkguard_token', demoToken);
    return true;
  };

  const logout = () => {
    api.logout().catch(() => {});
    setUser(null);
    setToken(null);
    localStorage.removeItem('milkguard_user');
    localStorage.removeItem('milkguard_token');
    localStorage.removeItem('milk_dairy_user');
  };

  const hasRole = (roles: UserRole | UserRole[]): boolean => {
    if (!user) return false;
    if (Array.isArray(roles)) {
      return roles.includes(user.role);
    }
    return user.role === roles;
  };

  const hasPermission = (action: string): boolean => {
    if (!user) return false;
    const role = user.role;

    switch (action) {
      case 'MANAGE_USERS':
      case 'VIEW_AUDIT_LOGS':
      case 'MANAGE_SETTINGS':
        return role === 'ADMIN';

      case 'CREATE_TEST':
        return role === 'ADMIN' || role === 'OPERATOR' || role === 'QUALITY_OPERATOR';

      case 'ACCEPT_REJECT_MILK':
      case 'OVERRIDE_RECOMMENDATION':
        return role === 'ADMIN' || role === 'OPERATOR' || role === 'QUALITY_OPERATOR';

      case 'CREATE_COLLECTION':
        return role === 'ADMIN' || role === 'OPERATOR';

      case 'MANAGE_CUSTOMERS':
        return role === 'ADMIN' || role === 'OPERATOR';

      case 'VIEW_REPORTS':
      case 'VIEW_HISTORY':
      case 'VIEW_DASHBOARD':
        return true;

      default:
        return false;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!user,
        login,
        logout,
        demoLogin,
        hasRole,
        hasPermission,
        isLoading
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
