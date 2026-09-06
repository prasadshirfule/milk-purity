import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  Farmer,
  MilkTest,
  MilkCollection,
  Device,
  Alert,
  DashboardSummary,
  SensorReading,
  QualityResult
} from '../types';
import {
  INITIAL_FARMERS,
  INITIAL_TESTS,
  INITIAL_COLLECTIONS,
  INITIAL_DEVICES,
  INITIAL_ALERTS,
  INITIAL_SUMMARY
} from '../data/mockData';
import { QualityCalculator } from '../services/qualityCalculator';
import { useSettings } from './SettingsContext';
import { useToast } from './ToastContext';

interface DemoDataContextType {
  isDemoMode: boolean;
  setDemoMode: (val: boolean) => void;
  farmers: Farmer[];
  tests: MilkTest[];
  collections: MilkCollection[];
  devices: Device[];
  alerts: Alert[];
  summary: DashboardSummary;
  addFarmer: (farmer: Partial<Farmer>) => Farmer;
  updateFarmer: (id: string, farmer: Partial<Farmer>) => Farmer | null;
  deleteFarmer: (id: string) => boolean;
  addMilkTest: (testData: {
    farmerId: string;
    farmerName?: string;
    deviceId: string;
    quantity: number;
    sensorReading: SensorReading;
    notes?: string;
  }) => { test: MilkTest; quality: QualityResult; collection?: MilkCollection };
  updateAlertStatus: (id: string, status: 'ACTIVE' | 'RESOLVED' | 'DISMISSED') => void;
  triggerDeviceAction: (deviceId: string, action: 'RESTART' | 'CALIBRATE' | 'CONNECT' | 'DISCONNECT') => void;
  refreshData: () => void;
}

const DemoDataContext = createContext<DemoDataContextType | undefined>(undefined);

export const DemoDataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { settings } = useSettings();
  const { showToast } = useToast();

  const [isDemoMode, setIsDemoMode] = useState<boolean>(true);
  const [farmers, setFarmers] = useState<Farmer[]>(() => {
    const saved = localStorage.getItem('milk_farmers');
    return saved ? JSON.parse(saved) : INITIAL_FARMERS;
  });

  const [tests, setTests] = useState<MilkTest[]>(() => {
    const saved = localStorage.getItem('milk_tests');
    return saved ? JSON.parse(saved) : INITIAL_TESTS;
  });

  const [collections, setCollections] = useState<MilkCollection[]>(() => {
    const saved = localStorage.getItem('milk_collections');
    return saved ? JSON.parse(saved) : INITIAL_COLLECTIONS;
  });

  const [devices, setDevices] = useState<Device[]>(() => {
    const saved = localStorage.getItem('milk_devices');
    return saved ? JSON.parse(saved) : INITIAL_DEVICES;
  });

  const [alerts, setAlerts] = useState<Alert[]>(() => {
    const saved = localStorage.getItem('milk_alerts');
    return saved ? JSON.parse(saved) : INITIAL_ALERTS;
  });

  // Keep local storage synchronized
  useEffect(() => {
    localStorage.setItem('milk_farmers', JSON.stringify(farmers));
  }, [farmers]);

  useEffect(() => {
    localStorage.setItem('milk_tests', JSON.stringify(tests));
  }, [tests]);

  useEffect(() => {
    localStorage.setItem('milk_collections', JSON.stringify(collections));
  }, [collections]);

  useEffect(() => {
    localStorage.setItem('milk_devices', JSON.stringify(devices));
  }, [devices]);

  useEffect(() => {
    localStorage.setItem('milk_alerts', JSON.stringify(alerts));
  }, [alerts]);

  // Compute live dynamic dashboard summary
  const summary: DashboardSummary = React.useMemo(() => {
    const todayStr = new Date().toDateString();
    const todayTests = tests.filter((t) => new Date(t.timestamp).toDateString() === todayStr);

    const acceptedCount = todayTests.filter((t) => t.result === 'ACCEPTED').length;
    const warningCount = todayTests.filter((t) => t.result === 'WARNING').length;
    const rejectedCount = todayTests.filter((t) => t.result === 'REJECTED').length;

    const todayCollectionLiters = todayTests
      .filter((t) => t.result !== 'REJECTED')
      .reduce((sum, t) => sum + t.quantity, 0);

    const avgPurity =
      todayTests.length > 0
        ? Number((todayTests.reduce((sum, t) => sum + t.qualityScore, 0) / todayTests.length).toFixed(1))
        : 92.6;

    const activeFarmers = farmers.filter((f) => f.status === 'ACTIVE').length;
    const primaryDevice = devices.find((d) => d.deviceId === 'ESP32-MILK-001') || devices[0];
    const activeAlertsCount = alerts.filter((a) => a.status === 'ACTIVE').length;

    return {
      todayCollectionLiters: Number(todayCollectionLiters.toFixed(1)) || 220.5,
      collectionGrowthPercent: 8.4,
      totalTestsToday: todayTests.length || 5,
      acceptedCount: acceptedCount || 4,
      warningCount: warningCount || 1,
      rejectedCount: rejectedCount || 1,
      averagePurityScore: avgPurity,
      activeFarmers,
      deviceStatus: primaryDevice ? primaryDevice.status : 'CONNECTED',
      primaryDeviceName: primaryDevice ? primaryDevice.name : 'ESP32-MILK-001',
      activeAlertsCount
    };
  }, [tests, farmers, devices, alerts]);

  // Farmer CRUD
  const addFarmer = (data: Partial<Farmer>): Farmer => {
    const newFarmer: Farmer = {
      farmerId: data.farmerId || `FMR-${1000 + farmers.length + 1}`,
      name: data.name || 'New Farmer',
      mobile: data.mobile || '',
      village: data.village || '',
      address: data.address || '',
      animalType: data.animalType || 'COW',
      notes: data.notes || '',
      status: data.status || 'ACTIVE',
      totalMilkSupplied: 0,
      totalCollections: 0,
      averageQualityScore: 0,
      createdAt: new Date().toISOString()
    };
    setFarmers((prev) => [newFarmer, ...prev]);
    showToast(`Farmer ${newFarmer.name} (${newFarmer.farmerId}) registered successfully!`, 'success');
    return newFarmer;
  };

  const updateFarmer = (id: string, data: Partial<Farmer>): Farmer | null => {
    let updated: Farmer | null = null;
    setFarmers((prev) =>
      prev.map((f) => {
        if (f.farmerId === id) {
          updated = { ...f, ...data, updatedAt: new Date().toISOString() };
          return updated;
        }
        return f;
      })
    );
    if (updated) {
      showToast(`Farmer record updated successfully`, 'success');
    }
    return updated;
  };

  const deleteFarmer = (id: string): boolean => {
    setFarmers((prev) => prev.filter((f) => f.farmerId !== id));
    showToast(`Farmer removed successfully`, 'info');
    return true;
  };

  // Milk Testing Engine
  const addMilkTest = ({
    farmerId,
    farmerName,
    deviceId,
    quantity,
    sensorReading,
    notes
  }: {
    farmerId: string;
    farmerName?: string;
    deviceId: string;
    quantity: number;
    sensorReading: SensorReading;
    notes?: string;
  }) => {
    const quality = QualityCalculator.calculate(sensorReading, settings.thresholds);
    const ratePerLiter = QualityCalculator.calculateRate(sensorReading.fat, quality.score, settings.thresholds);
    const totalAmount = quality.result !== 'REJECTED' ? Number((quantity * ratePerLiter).toFixed(2)) : 0;

    const actualFarmerName = farmerName || farmers.find((f) => f.farmerId === farmerId)?.name || 'Farmer';
    const testId = `TEST-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${Math.floor(100 + Math.random() * 900)}`;

    const newTest: MilkTest = {
      testId,
      farmerId,
      farmerName: actualFarmerName,
      deviceId,
      quantity,
      timestamp: new Date().toISOString(),
      temperature: sensorReading.temperature,
      ph: sensorReading.ph,
      fat: sensorReading.fat,
      density: sensorReading.density,
      conductivity: sensorReading.conductivity,
      milkLevel: quantity,
      qualityScore: quality.score,
      classification: quality.classification,
      prediction: quality.result === 'REJECTED' ? 'ADULTERATED' : 'PURE',
      confidence: 0.96,
      warnings: quality.warnings,
      result: quality.result,
      ratePerLiter,
      totalAmount,
      notes
    };

    setTests((prev) => [newTest, ...prev]);

    let createdCollection: MilkCollection | undefined;

    // Record collection if accepted or warning
    if (newTest.result !== 'REJECTED') {
      createdCollection = {
        collectionId: `COL-${testId.replace('TEST-', '')}`,
        farmerId: newTest.farmerId,
        farmerName: actualFarmerName,
        testId: newTest.testId,
        quantity: newTest.quantity,
        fat: newTest.fat,
        rate: ratePerLiter,
        totalAmount,
        qualityScore: newTest.qualityScore,
        result: newTest.result,
        timestamp: newTest.timestamp,
        paymentStatus: 'PAID'
      };
      setCollections((prev) => [createdCollection!, ...prev]);

      // Update farmer metrics
      setFarmers((prev) =>
        prev.map((f) => {
          if (f.farmerId === farmerId) {
            const prevSupplied = f.totalMilkSupplied || 0;
            const prevCount = f.totalCollections || 0;
            const prevScore = f.averageQualityScore || 90;
            const newCount = prevCount + 1;
            const newScore = Number(((prevScore * prevCount + quality.score) / newCount).toFixed(1));
            return {
              ...f,
              totalMilkSupplied: Number((prevSupplied + quantity).toFixed(2)),
              totalCollections: newCount,
              averageQualityScore: newScore
            };
          }
          return f;
        })
      );
    }

    // Trigger alert if anomalous
    if (newTest.result === 'REJECTED' || newTest.result === 'WARNING') {
      const newAlert: Alert = {
        alertId: `ALT-${Date.now()}`,
        type: sensorReading.conductivity > 6.0 ? 'HIGH_CONDUCTIVITY' : sensorReading.ph < 6.5 ? 'ABNORMAL_PH' : 'SUSPICIOUS_MILK',
        severity: newTest.result === 'REJECTED' ? 'CRITICAL' : 'WARNING',
        farmerId: newTest.farmerId,
        farmerName: actualFarmerName,
        testId: newTest.testId,
        deviceId: newTest.deviceId,
        message: `Batch ${newTest.testId} flagged: Score ${newTest.qualityScore}% (${newTest.result}). ${newTest.warnings.join(', ')}`,
        status: 'ACTIVE',
        timestamp: new Date().toISOString()
      };
      setAlerts((prev) => [newAlert, ...prev]);
    }

    return { test: newTest, quality, collection: createdCollection };
  };

  const updateAlertStatus = (id: string, status: 'ACTIVE' | 'RESOLVED' | 'DISMISSED') => {
    setAlerts((prev) => prev.map((a) => (a.alertId === id ? { ...a, status } : a)));
    showToast(`Alert marked as ${status.toLowerCase()}`, 'info');
  };

  const triggerDeviceAction = (deviceId: string, action: 'RESTART' | 'CALIBRATE' | 'CONNECT' | 'DISCONNECT') => {
    setDevices((prev) =>
      prev.map((d) => {
        if (d.deviceId === deviceId) {
          if (action === 'DISCONNECT') {
            return { ...d, status: 'DISCONNECTED' };
          }
          if (action === 'CONNECT') {
            return { ...d, status: 'CONNECTED', lastSeen: new Date().toISOString() };
          }
          return { ...d, lastSeen: new Date().toISOString() };
        }
        return d;
      })
    );
    showToast(`Device command ${action} sent to ${deviceId}`, 'success');
  };

  const refreshData = useCallback(() => {
    showToast('Data refreshed successfully', 'info');
  }, [showToast]);

  return (
    <DemoDataContext.Provider
      value={{
        isDemoMode,
        setDemoMode: setIsDemoMode,
        farmers,
        tests,
        collections,
        devices,
        alerts,
        summary,
        addFarmer,
        updateFarmer,
        deleteFarmer,
        addMilkTest,
        updateAlertStatus,
        triggerDeviceAction,
        refreshData
      }}
    >
      {children}
    </DemoDataContext.Provider>
  );
};

export const useDemoData = () => {
  const context = useContext(DemoDataContext);
  if (!context) {
    throw new Error('useDemoData must be used within a DemoDataProvider');
  }
  return context;
};
