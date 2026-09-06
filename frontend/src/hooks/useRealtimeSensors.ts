import { useState, useEffect, useCallback, useRef } from 'react';
import { SensorReading, QualityResult } from '../types';
import { QualityCalculator } from '../services/qualityCalculator';
import { useSettings } from '../context/SettingsContext';

export type SimulationProfile = 'NORMAL_COW' | 'BUFFALO_HIGH_FAT' | 'WATER_DILUTED' | 'SOUR_ACIDIC' | 'HIGH_CONDUCTIVITY';

const BASELINE_READINGS: Record<SimulationProfile, Omit<SensorReading, 'timestamp' | 'deviceId' | 'milkLevel'>> = {
  NORMAL_COW: {
    temperature: 24.2,
    ph: 6.64,
    fat: 4.2,
    density: 1.0295,
    conductivity: 4.9
  },
  BUFFALO_HIGH_FAT: {
    temperature: 24.0,
    ph: 6.65,
    fat: 6.4,
    density: 1.0315,
    conductivity: 4.8
  },
  WATER_DILUTED: {
    temperature: 25.4,
    ph: 6.58,
    fat: 2.7,
    density: 1.0210,
    conductivity: 3.4
  },
  SOUR_ACIDIC: {
    temperature: 27.8,
    ph: 6.18,
    fat: 4.1,
    density: 1.0285,
    conductivity: 5.8
  },
  HIGH_CONDUCTIVITY: {
    temperature: 25.1,
    ph: 6.62,
    fat: 3.8,
    density: 1.0270,
    conductivity: 7.4
  }
};

export function useRealtimeSensors(initialDeviceId: string = 'ESP32-MILK-001') {
  const { settings } = useSettings();

  const [deviceId, setDeviceId] = useState<string>(initialDeviceId);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [activeProfile, setActiveProfile] = useState<SimulationProfile>('NORMAL_COW');
  const [quantity, setQuantity] = useState<number>(30.0);

  const [reading, setReading] = useState<SensorReading>({
    deviceId: initialDeviceId,
    timestamp: new Date().toISOString(),
    temperature: 24.2,
    ph: 6.64,
    fat: 4.5,
    density: 1.0295,
    conductivity: 4.9,
    milkLevel: 30.0
  });

  const [qualityPreview, setQualityPreview] = useState<QualityResult>(() =>
    QualityCalculator.calculate(
      {
        deviceId: initialDeviceId,
        timestamp: new Date().toISOString(),
        temperature: 24.2,
        ph: 6.64,
        fat: 4.5,
        density: 1.0295,
        conductivity: 4.9,
        milkLevel: 30.0
      },
      settings.thresholds
    )
  );

  const timerRef = useRef<number | null>(null);

  // Recalculate quality preview whenever reading or thresholds change
  useEffect(() => {
    const q = QualityCalculator.calculate(reading, settings.thresholds);
    setQualityPreview(q);
  }, [reading, settings.thresholds]);

  // Smooth Brownian step
  const tickReading = useCallback(() => {
    setReading((prev) => {
      const base = BASELINE_READINGS[activeProfile];

      const tempJitter = (Math.random() - 0.5) * 0.12;
      const phJitter = (Math.random() - 0.5) * 0.015;
      const fatJitter = (Math.random() - 0.5) * 0.03;
      const densityJitter = (Math.random() - 0.5) * 0.0002;
      const condJitter = (Math.random() - 0.5) * 0.04;

      const clamp = (val: number, min: number, max: number) => Math.max(min, Math.min(max, val));

      return {
        deviceId,
        timestamp: new Date().toISOString(),
        temperature: Number(clamp(prev.temperature + tempJitter, base.temperature - 0.6, base.temperature + 0.6).toFixed(2)),
        ph: Number(clamp(prev.ph + phJitter, base.ph - 0.06, base.ph + 0.06).toFixed(2)),
        fat: Number(clamp(prev.fat + fatJitter, base.fat - 0.2, base.fat + 0.2).toFixed(2)),
        density: Number(clamp(prev.density + densityJitter, base.density - 0.0015, base.density + 0.0015).toFixed(4)),
        conductivity: Number(clamp(prev.conductivity + condJitter, base.conductivity - 0.3, base.conductivity + 0.3).toFixed(2)),
        milkLevel: quantity
      };
    });
  }, [deviceId, activeProfile, quantity]);

  useEffect(() => {
    if (isRunning) {
      timerRef.current = window.setInterval(tickReading, 1200);
    } else if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isRunning, tickReading]);

  const startTest = () => {
    setIsRunning(true);
  };

  const stopTest = () => {
    setIsRunning(false);
  };

  const setProfile = (profile: SimulationProfile) => {
    setActiveProfile(profile);
    const base = BASELINE_READINGS[profile];
    setReading({
      deviceId,
      timestamp: new Date().toISOString(),
      temperature: base.temperature,
      ph: base.ph,
      fat: base.fat,
      density: base.density,
      conductivity: base.conductivity,
      milkLevel: quantity
    });
  };

  const resetReadings = () => {
    setIsRunning(false);
    setProfile('NORMAL_COW');
  };

  return {
    reading,
    qualityPreview,
    isRunning,
    activeProfile,
    quantity,
    setQuantity,
    deviceId,
    setDeviceId,
    startTest,
    stopTest,
    setProfile,
    resetReadings,
    tickReading
  };
}
