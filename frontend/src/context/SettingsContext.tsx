import React, { createContext, useContext, useState, useEffect } from 'react';
import { DairySettings } from '../types';
import { INITIAL_SETTINGS } from '../data/mockData';

interface SettingsContextType {
  settings: DairySettings;
  updateSettings: (newSettings: Partial<DairySettings>) => void;
  resetSettings: () => void;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export const SettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [settings, setSettings] = useState<DairySettings>(() => {
    const saved = localStorage.getItem('milk_dairy_settings');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return INITIAL_SETTINGS;
      }
    }
    return INITIAL_SETTINGS;
  });

  const updateSettings = (newSettings: Partial<DairySettings>) => {
    setSettings((prev) => {
      const merged = {
        ...prev,
        ...newSettings,
        thresholds: {
          ...prev.thresholds,
          ...(newSettings.thresholds || {})
        }
      };
      localStorage.setItem('milk_dairy_settings', JSON.stringify(merged));
      return merged;
    });
  };

  const resetSettings = () => {
    setSettings(INITIAL_SETTINGS);
    localStorage.setItem('milk_dairy_settings', JSON.stringify(INITIAL_SETTINGS));
  };

  return (
    <SettingsContext.Provider value={{ settings, updateSettings, resetSettings }}>
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
};
