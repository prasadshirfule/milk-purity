import React, { createContext, useContext, useState, useEffect } from 'react';

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'ADMIN' | 'OPERATOR' | 'VIEWER';
  dairyName: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  login: (email: string, pass: string) => Promise<boolean>;
  logout: () => void;
  demoLogin: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const DEMO_USER: User = {
  id: 'usr_01',
  name: 'Rajendra Deshmukh',
  email: 'operator@amritdairy.com',
  role: 'OPERATOR',
  dairyName: 'Amrit Dairy Milk Collection Center'
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('milk_dairy_user');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return DEMO_USER;
      }
    }
    return DEMO_USER; // Default to logged-in demo user for immediate smooth experience
  });

  const login = async (email: string, pass: string): Promise<boolean> => {
    // Mock login verification
    if (email && pass) {
      const loggedUser: User = {
        id: 'usr_01',
        name: email.split('@')[0].replace('.', ' ').toUpperCase(),
        email,
        role: 'OPERATOR',
        dairyName: 'Amrit Dairy Milk Collection Center'
      };
      setUser(loggedUser);
      localStorage.setItem('milk_dairy_user', JSON.stringify(loggedUser));
      return true;
    }
    return false;
  };

  const demoLogin = () => {
    setUser(DEMO_USER);
    localStorage.setItem('milk_dairy_user', JSON.stringify(DEMO_USER));
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('milk_dairy_user');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        login,
        logout,
        demoLogin
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
