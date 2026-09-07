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
  INITIAL_ALERTS
} from '../data/mockData';
import { QualityCalculator } from '../services/qualityCalculator';
import { api } from '../services/api';
import { useSettings } from './SettingsContext';
import { useToast } from './ToastContext';

interface DemoDataContextType {
  isDemoMode: boolean;
  setDemoMode: (val: boolean) => void;
  isLoading: boolean;
  connectionError: string | null;
  farmers: Farmer[];
  tests: MilkTest[];
  collections: MilkCollection[];
  devices: Device[];
  alerts: Alert[];
  summary: DashboardSummary;
  addFarmer: (farmer: Partial<Farmer>) => Promise<Farmer>;
  updateFarmer: (id: string, farmer: Partial<Farmer>) => Promise<Farmer | null>;
  deleteFarmer: (id: string) => Promise<boolean>;
  getFarmerByCustomerCode: (code: string) => Promise<Farmer | null>;
  addMilkTest: (testData: {
    farmerId: string;
    customerCode?: string;
    farmerName?: string;
    deviceId: string;
    quantity: number;
    sensorReading: SensorReading;
    operatorDecision?: 'ACCEPT' | 'REJECT';
    overrideReason?: string;
    notes?: string;
  }) => Promise<{ test: MilkTest; quality: QualityResult; collection?: MilkCollection }>;
  updateAlertStatus: (id: string, status: 'ACTIVE' | 'RESOLVED' | 'DISMISSED') => Promise<void>;
  triggerDeviceAction: (deviceId: string, action: 'RESTART' | 'CALIBRATE' | 'CONNECT' | 'DISCONNECT') => Promise<void>;
  refreshData: () => Promise<void>;
}

const generateDemoCustomerCode = (existingCodes: Set<string>): string => {
  const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  for (let i = 0; i < 1000; i++) {
    const letter = letters[Math.floor(Math.random() * letters.length)];
    const num = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    const code = `${letter}${num}`;
    if (!existingCodes.has(code)) {
      return code;
    }
  }
  return 'X9999';
};

const safeJsonParse = <T,>(key: string, fallback: T): T => {
  try {
    const saved = localStorage.getItem(key);
    return saved ? JSON.parse(saved) : fallback;
  } catch (e) {
    console.warn(`Error parsing localStorage for ${key}, falling back to defaults`, e);
    return fallback;
  }
};

const emptyFallbackSummary: DashboardSummary = {
  todayCollectionLiters: 0,
  collectionGrowthPercent: 0,
  totalTestsToday: 0,
  acceptedCount: 0,
  warningCount: 0,
  rejectedCount: 0,
  averagePurityScore: 0,
  activeFarmers: 0,
  deviceStatus: 'DISCONNECTED',
  primaryDeviceName: 'ESP32-MILK-001',
  activeAlertsCount: 0
};

const DemoDataContext = createContext<DemoDataContextType | undefined>(undefined);

export const DemoDataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { settings } = useSettings();
  const { showToast } = useToast();

  const [isDemoMode, setIsDemoModeState] = useState<boolean>(() => {
    const saved = localStorage.getItem('milkguard_demo_mode');
    return saved !== null ? saved === 'true' : true;
  });

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);

  // -------------------------------------------------------------
  // DEMO MODE STATE (LocalStorage Persisted)
  // -------------------------------------------------------------
  const [demoFarmers, setDemoFarmers] = useState<Farmer[]>(() => {
    const raw = safeJsonParse('milk_farmers', INITIAL_FARMERS);
    const existingCodes = new Set<string>();
    return raw.map((f: Farmer) => {
      if (f.customerCode && /^[A-Z][0-9]{4}$/.test(f.customerCode) && !existingCodes.has(f.customerCode)) {
        existingCodes.add(f.customerCode);
        return f;
      }
      const initialMatch = INITIAL_FARMERS.find((i) => i.farmerId === f.farmerId);
      let code = initialMatch?.customerCode;
      if (!code || existingCodes.has(code)) {
        code = generateDemoCustomerCode(existingCodes);
      }
      existingCodes.add(code);
      return { ...f, customerCode: code };
    });
  });
  const [demoTests, setDemoTests] = useState<MilkTest[]>(() => safeJsonParse('milk_tests', INITIAL_TESTS));
  const [demoCollections, setDemoCollections] = useState<MilkCollection[]>(() => safeJsonParse('milk_collections', INITIAL_COLLECTIONS));
  const [demoDevices, setDemoDevices] = useState<Device[]>(() => safeJsonParse('milk_devices', INITIAL_DEVICES));
  const [demoAlerts, setDemoAlerts] = useState<Alert[]>(() => safeJsonParse('milk_alerts', INITIAL_ALERTS));

  useEffect(() => {
    try {
      localStorage.setItem('milk_farmers', JSON.stringify(demoFarmers));
    } catch (e) {
      console.warn('Failed to save demo farmers to localStorage', e);
    }
  }, [demoFarmers]);

  useEffect(() => {
    try {
      localStorage.setItem('milk_tests', JSON.stringify(demoTests));
    } catch (e) {
      console.warn('Failed to save demo tests to localStorage', e);
    }
  }, [demoTests]);

  useEffect(() => {
    try {
      localStorage.setItem('milk_collections', JSON.stringify(demoCollections));
    } catch (e) {
      console.warn('Failed to save demo collections to localStorage', e);
    }
  }, [demoCollections]);

  useEffect(() => {
    try {
      localStorage.setItem('milk_devices', JSON.stringify(demoDevices));
    } catch (e) {
      console.warn('Failed to save demo devices to localStorage', e);
    }
  }, [demoDevices]);

  useEffect(() => {
    try {
      localStorage.setItem('milk_alerts', JSON.stringify(demoAlerts));
    } catch (e) {
      console.warn('Failed to save demo alerts to localStorage', e);
    }
  }, [demoAlerts]);

  // Demo Dynamic Dashboard Calculations
  const demoSummary: DashboardSummary = React.useMemo(() => {
    const today = new Date();
    const todayStr = today.toDateString();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toDateString();

    const todayTests = demoTests.filter((t) => new Date(t.timestamp).toDateString() === todayStr);
    const yesterdayTests = demoTests.filter((t) => new Date(t.timestamp).toDateString() === yesterdayStr);

    const acceptedCount = todayTests.filter((t) => t.result === 'ACCEPTED').length;
    const warningCount = todayTests.filter((t) => t.result === 'WARNING').length;
    const rejectedCount = todayTests.filter((t) => t.result === 'REJECTED').length;

    const todayCollectionLiters = todayTests
      .filter((t) => t.result !== 'REJECTED')
      .reduce((sum, t) => sum + (t.quantity || 0), 0);

    const yesterdayCollectionLiters = yesterdayTests
      .filter((t) => t.result !== 'REJECTED')
      .reduce((sum, t) => sum + (t.quantity || 0), 0);

    let collectionGrowthPercent = 0;
    if (yesterdayCollectionLiters > 0) {
      collectionGrowthPercent = Number(
        (((todayCollectionLiters - yesterdayCollectionLiters) / yesterdayCollectionLiters) * 100).toFixed(1)
      );
    } else if (todayCollectionLiters > 0) {
      collectionGrowthPercent = 100;
    } else {
      collectionGrowthPercent = 0;
    }

    const avgPurity =
      todayTests.length > 0
        ? Number((todayTests.reduce((sum, t) => sum + (t.qualityScore || 0), 0) / todayTests.length).toFixed(1))
        : 0;

    const activeFarmers = demoFarmers.filter((f) => f.status === 'ACTIVE').length;
    const primaryDevice = demoDevices.find((d) => d.deviceId === 'ESP32-MILK-001') || demoDevices[0];
    const activeAlertsCount = demoAlerts.filter((a) => a.status === 'ACTIVE').length;

    return {
      todayCollectionLiters: Number(todayCollectionLiters.toFixed(1)),
      collectionGrowthPercent,
      totalTestsToday: todayTests.length,
      acceptedCount,
      warningCount,
      rejectedCount,
      averagePurityScore: avgPurity,
      activeFarmers,
      deviceStatus: primaryDevice ? primaryDevice.status : 'CONNECTED',
      primaryDeviceName: primaryDevice ? primaryDevice.name : 'ESP32-MILK-001',
      activeAlertsCount
    };
  }, [demoTests, demoFarmers, demoDevices, demoAlerts]);

  // -------------------------------------------------------------
  // CONNECTED MODE STATE (Loaded from Backend Express REST API)
  // -------------------------------------------------------------
  const [connectedFarmers, setConnectedFarmers] = useState<Farmer[]>([]);
  const [connectedTests, setConnectedTests] = useState<MilkTest[]>([]);
  const [connectedCollections, setConnectedCollections] = useState<MilkCollection[]>([]);
  const [connectedDevices, setConnectedDevices] = useState<Device[]>([]);
  const [connectedAlerts, setConnectedAlerts] = useState<Alert[]>([]);
  const [connectedSummary, setConnectedSummary] = useState<DashboardSummary | null>(null);

  const fetchConnectedData = useCallback(async () => {
    setIsLoading(true);
    setConnectionError(null);
    try {
      const [sumRes, farmersRes, testsRes, collRes, devRes, alertsRes] = await Promise.all([
        api.getSummary(),
        api.getFarmers(),
        api.getTests(),
        api.getCollections(),
        api.getDevices(),
        api.getAlerts()
      ]);

      if (!sumRes.success && !farmersRes.success && !testsRes.success) {
        const errMsg = sumRes.error || farmersRes.error || 'Backend unavailable. Connected Mode could not load live data.';
        setConnectionError(errMsg);
        setConnectedSummary(null);
        setConnectedFarmers([]);
        setConnectedTests([]);
        setConnectedCollections([]);
        setConnectedDevices([]);
        setConnectedAlerts([]);
        showToast(errMsg, 'error');
        return;
      }

      if (sumRes.success && sumRes.data) {
        setConnectedSummary(sumRes.data);
      }
      if (farmersRes.success && Array.isArray(farmersRes.data)) {
        setConnectedFarmers(farmersRes.data);
      }
      if (testsRes.success && Array.isArray(testsRes.data)) {
        setConnectedTests(testsRes.data);
      }
      if (collRes.success && Array.isArray(collRes.data)) {
        setConnectedCollections(collRes.data);
      }
      if (devRes.success && Array.isArray(devRes.data)) {
        setConnectedDevices(devRes.data);
      }
      if (alertsRes.success && Array.isArray(alertsRes.data)) {
        setConnectedAlerts(alertsRes.data);
      }
      setConnectionError(null);
    } catch (err: any) {
      const msg = err?.message || 'Backend unavailable. Connected Mode could not load live data.';
      setConnectionError(msg);
      setConnectedSummary(null);
      setConnectedFarmers([]);
      setConnectedTests([]);
      setConnectedCollections([]);
      setConnectedDevices([]);
      setConnectedAlerts([]);
      showToast(msg, 'error');
    } finally {
      setIsLoading(false);
    }
  }, [showToast]);

  // Load connected data when switching to connected mode
  useEffect(() => {
    if (!isDemoMode) {
      fetchConnectedData();
    }
  }, [isDemoMode, fetchConnectedData]);

  const setDemoMode = useCallback(
    (val: boolean) => {
      setIsDemoModeState(val);
      try {
        localStorage.setItem('milkguard_demo_mode', val ? 'true' : 'false');
      } catch (e) {
        console.warn('Failed to save mode preference', e);
      }
      if (!val) {
        showToast('Switched to Connected Mode (Backend API)', 'info');
        fetchConnectedData();
      } else {
        setConnectionError(null);
        showToast('Switched to Demo Mode (Local Simulation)', 'info');
      }
    },
    [fetchConnectedData, showToast]
  );

  // -------------------------------------------------------------
  // MODE-AWARE CRUD OPERATIONS
  // -------------------------------------------------------------

  const getFarmerByCustomerCode = async (code: string): Promise<Farmer | null> => {
    const formatted = code.trim().toUpperCase();
    if (isDemoMode) {
      const found = demoFarmers.find((f) => f.customerCode?.toUpperCase() === formatted);
      return found || null;
    } else {
      try {
        const res = await api.getFarmerByCustomerCode(formatted);
        if (res.success && res.data) {
          return res.data;
        }
        // Fallback check cached connectedFarmers
        const fallback = connectedFarmers.find((f) => f.customerCode?.toUpperCase() === formatted);
        return fallback || null;
      } catch (err) {
        const fallback = connectedFarmers.find((f) => f.customerCode?.toUpperCase() === formatted);
        return fallback || null;
      }
    }
  };

  const addFarmer = async (data: Partial<Farmer>): Promise<Farmer> => {
    if (isDemoMode) {
      const existingCodes = new Set(demoFarmers.map((f) => f.customerCode).filter(Boolean) as string[]);
      const assignedCode = data.customerCode && /^[A-Z][0-9]{4}$/.test(data.customerCode.trim().toUpperCase())
        ? data.customerCode.trim().toUpperCase()
        : generateDemoCustomerCode(existingCodes);

      const newFarmer: Farmer = {
        farmerId: data.farmerId || `FMR-${1000 + demoFarmers.length + 1}`,
        customerCode: assignedCode,
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
      setDemoFarmers((prev) => [newFarmer, ...prev]);
      showToast(`Customer ${newFarmer.name} (Code: ${newFarmer.customerCode}) registered successfully!`, 'success');
      return newFarmer;
    } else {
      const res = await api.createFarmer(data);
      if (!res.success || !res.data) {
        const err = res.error || 'Failed to create farmer on backend';
        showToast(err, 'error');
        throw new Error(err);
      }
      setConnectedFarmers((prev) => [res.data!, ...prev]);
      showToast(`Customer ${res.data.name} (Code: ${res.data.customerCode || res.data.farmerId}) saved to backend!`, 'success');
      return res.data;
    }
  };

  const updateFarmer = async (id: string, data: Partial<Farmer>): Promise<Farmer | null> => {
    if (isDemoMode) {
      let updated: Farmer | null = null;
      setDemoFarmers((prev) =>
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
    } else {
      const res = await api.updateFarmer(id, data);
      if (!res.success || !res.data) {
        const err = res.error || 'Failed to update farmer on backend';
        showToast(err, 'error');
        throw new Error(err);
      }
      setConnectedFarmers((prev) => prev.map((f) => (f.farmerId === id ? res.data! : f)));
      showToast(`Farmer record updated on backend`, 'success');
      return res.data;
    }
  };

  const deleteFarmer = async (id: string): Promise<boolean> => {
    if (isDemoMode) {
      setDemoFarmers((prev) => prev.filter((f) => f.farmerId !== id));
      showToast(`Farmer removed successfully`, 'info');
      return true;
    } else {
      const res = await api.deleteFarmer(id);
      if (!res.success) {
        const err = res.error || 'Failed to delete farmer on backend';
        showToast(err, 'error');
        throw new Error(err);
      }
      setConnectedFarmers((prev) => prev.filter((f) => f.farmerId !== id));
      showToast(`Farmer record deactivated on backend`, 'info');
      return true;
    }
  };

  const addMilkTest = async ({
    farmerId,
    customerCode,
    farmerName,
    deviceId,
    quantity,
    sensorReading,
    operatorDecision,
    overrideReason,
    notes
  }: {
    farmerId: string;
    customerCode?: string;
    farmerName?: string;
    deviceId: string;
    quantity: number;
    sensorReading: SensorReading;
    operatorDecision?: 'ACCEPT' | 'REJECT';
    overrideReason?: string;
    notes?: string;
  }): Promise<{ test: MilkTest; quality: QualityResult; collection?: MilkCollection }> => {
    if (isDemoMode) {
      const targetFarmer = demoFarmers.find((f) => f.farmerId === farmerId || (customerCode && f.customerCode === customerCode));
      const actualFarmerId = targetFarmer?.farmerId || farmerId;
      const actualFarmerCode = targetFarmer?.customerCode || customerCode;
      const actualFarmerName = farmerName || targetFarmer?.name || 'Farmer';

      const quality = QualityCalculator.calculate(sensorReading, settings.thresholds);
      const recommendedResult = quality.result;

      let decision: 'ACCEPT' | 'REJECT';
      if (operatorDecision === 'ACCEPT' || operatorDecision === 'REJECT') {
        decision = operatorDecision;
      } else {
        decision = recommendedResult === 'REJECTED' ? 'REJECT' : 'ACCEPT';
      }

      const trimmedOverrideReason = typeof overrideReason === 'string' ? overrideReason.trim() : '';

      if (recommendedResult === 'REJECTED' && decision === 'ACCEPT') {
        if (!trimmedOverrideReason) {
          showToast('Manual override of a rejected batch requires a non-empty justification', 'error');
          throw new Error('Manual override of a rejected batch requires a non-empty overrideReason');
        }
      }

      let finalResult: 'ACCEPTED' | 'WARNING' | 'REJECTED' = 'REJECTED';
      let ratePerLiter = 0;
      let totalAmount = 0;

      if (decision === 'REJECT') {
        finalResult = 'REJECTED';
        ratePerLiter = 0;
        totalAmount = 0;
      } else {
        if (recommendedResult === 'REJECTED') {
          finalResult = 'ACCEPTED';
          ratePerLiter = QualityCalculator.calculateRate(sensorReading.fat, quality.score, settings.thresholds);
          totalAmount = Number((quantity * ratePerLiter).toFixed(2));
        } else if (recommendedResult === 'WARNING') {
          finalResult = 'WARNING';
          ratePerLiter = QualityCalculator.calculateRate(sensorReading.fat, quality.score, settings.thresholds);
          totalAmount = Number((quantity * ratePerLiter).toFixed(2));
        } else {
          finalResult = 'ACCEPTED';
          ratePerLiter = QualityCalculator.calculateRate(sensorReading.fat, quality.score, settings.thresholds);
          totalAmount = Number((quantity * ratePerLiter).toFixed(2));
        }
      }

      const testId = `TEST-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;

      let currentOp = { userId: 'usr_op_01', name: 'Rajendra Deshmukh', role: 'OPERATOR' as const };
      try {
        const storedUser = localStorage.getItem('milkguard_user');
        if (storedUser) {
          const parsed = JSON.parse(storedUser);
          if (parsed.userId) currentOp = parsed;
        }
      } catch (e) {}

      const isOverride = recommendedResult === 'REJECTED' && decision === 'ACCEPT';

      const newTest: MilkTest = {
        testId,
        farmerId: actualFarmerId,
        customerCode: actualFarmerCode,
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
        purityScore: quality.score,
        classification: quality.classification,
        recommendedResult,
        aiRecommendation: quality.aiRecommendation,
        operatorDecision: decision,
        overrideReason: trimmedOverrideReason || undefined,
        overrideTimestamp: isOverride ? new Date().toISOString() : undefined,
        operatorId: currentOp.userId,
        operatorName: currentOp.name,
        operatorRole: currentOp.role,
        modelVersion: quality.modelVersion || 'screening-baseline-v1',
        scoreExplanation: quality.scoreExplanation || [],
        prediction: finalResult === 'REJECTED' ? 'DEMO_ANOMALY' : 'DEMO_NORMAL',
        confidence: null,
        warnings: quality.warnings,
        result: finalResult,
        ratePerLiter,
        totalAmount,
        notes
      };

      setDemoTests((prev) => [newTest, ...prev]);

      let createdCollection: MilkCollection | undefined;

      if (newTest.result !== 'REJECTED') {
        createdCollection = {
          collectionId: `COL-${testId.replace('TEST-', '')}`,
          farmerId: newTest.farmerId,
          customerCode: newTest.customerCode,
          farmerName: actualFarmerName,
          testId: newTest.testId,
          quantity: newTest.quantity,
          fat: newTest.fat,
          rate: ratePerLiter,
          totalAmount,
          qualityScore: newTest.qualityScore,
          result: newTest.result,
          operatorId: currentOp.userId,
          operatorName: currentOp.name,
          operatorRole: currentOp.role,
          timestamp: newTest.timestamp,
          paymentStatus: 'PAID'
        };
        setDemoCollections((prev) => [createdCollection!, ...prev]);

        setDemoFarmers((prev) =>
          prev.map((f) => {
            if (f.farmerId === actualFarmerId) {
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

      if (newTest.result === 'REJECTED' || newTest.result === 'WARNING' || decision === 'REJECT') {
        const newAlert: Alert = {
          alertId: `ALT-${Date.now()}`,
          type: sensorReading.conductivity > 6.0 ? 'HIGH_CONDUCTIVITY' : sensorReading.ph < 6.5 ? 'ABNORMAL_PH' : 'SUSPICIOUS_MILK',
          severity: newTest.result === 'REJECTED' ? 'CRITICAL' : 'WARNING',
          farmerId: newTest.farmerId,
          farmerName: actualFarmerName,
          testId: newTest.testId,
          deviceId: newTest.deviceId,
          message: newTest.result === 'REJECTED'
            ? `Milk quality screening score (${newTest.purityScore}%) below configured rejection threshold for batch ${newTest.testId} (Customer: ${newTest.customerCode || newTest.farmerId} — ${actualFarmerName}). AI Recommendation: REJECT.${newTest.warnings.length > 0 ? ` (${newTest.warnings.join('; ')})` : ''} Secondary laboratory verification advised.`
            : `Milk quality screening score (${newTest.purityScore}%) in review range for batch ${newTest.testId} (Customer: ${newTest.customerCode || newTest.farmerId} — ${actualFarmerName}). AI Recommendation: REVIEW.${newTest.warnings.length > 0 ? ` (${newTest.warnings.join('; ')})` : ''} Monitored intake recorded.`,
          status: 'ACTIVE',
          timestamp: new Date().toISOString()
        };
        setDemoAlerts((prev) => [newAlert, ...prev]);
      }

      return { test: newTest, quality, collection: createdCollection };
    } else {
      // Connected Mode: Direct authoritative backend call
      const payload = {
        farmerId,
        customerCode,
        farmerName,
        deviceId,
        quantity,
        sensorTimestamp: sensorReading.timestamp || new Date().toISOString(),
        testTimestamp: new Date().toISOString(),
        temperature: sensorReading.temperature,
        ph: sensorReading.ph,
        fat: sensorReading.fat,
        density: sensorReading.density,
        conductivity: sensorReading.conductivity,
        milkLevel: sensorReading.milkLevel || quantity,
        operatorDecision,
        overrideReason,
        notes
      };

      const res = await api.createTest(payload);
      if (!res.success || !res.data) {
        const err = res.error || 'Failed to record test on backend';
        showToast(err, 'error');
        throw new Error(err);
      }

      const savedTest = res.data;
      const createdCollection = res.collection;
      const qualityAssessment = res.qualityAssessment || {
        score: savedTest.qualityScore,
        classification: savedTest.classification,
        result: savedTest.result,
        warnings: savedTest.warnings || [],
        recommendations: [],
        parameters: {
          temperature: { status: 'NORMAL', reading: savedTest.temperature, normalMin: 15, normalMax: 30, unit: '°C' },
          ph: { status: 'NORMAL', reading: savedTest.ph, normalMin: 6.5, normalMax: 6.8, unit: 'pH' },
          fat: { status: 'NORMAL', reading: savedTest.fat, normalMin: 3.5, normalMax: 6.5, unit: '%' },
          density: { status: 'NORMAL', reading: savedTest.density, normalMin: 1.026, normalMax: 1.034, unit: 'g/mL' },
          conductivity: { status: 'NORMAL', reading: savedTest.conductivity, normalMin: 4.0, normalMax: 6.0, unit: 'mS/cm' }
        }
      };

      setConnectedTests((prev) => [savedTest, ...prev]);
      if (createdCollection) {
        setConnectedCollections((prev) => [createdCollection, ...prev]);
      }

      // Background refresh backend summary, farmers, and alerts so counts and farmer aggregates update
      api.getSummary().then((s) => s.success && s.data && setConnectedSummary(s.data));
      api.getFarmers().then((f) => f.success && Array.isArray(f.data) && setConnectedFarmers(f.data));
      api.getAlerts().then((a) => a.success && Array.isArray(a.data) && setConnectedAlerts(a.data));

      showToast(`Test ${savedTest.testId} processed and recorded by backend!`, 'success');
      return { test: savedTest, quality: qualityAssessment, collection: createdCollection };
    }
  };

  const updateAlertStatus = async (id: string, status: 'ACTIVE' | 'RESOLVED' | 'DISMISSED') => {
    if (isDemoMode) {
      setDemoAlerts((prev) => prev.map((a) => (a.alertId === id ? { ...a, status } : a)));
      showToast(`Alert marked as ${status.toLowerCase()}`, 'info');
    } else {
      const res = await api.updateAlertStatus(id, status);
      if (!res.success) {
        showToast(res.error || 'Failed to update alert status on backend', 'error');
        return;
      }
      setConnectedAlerts((prev) => prev.map((a) => (a.alertId === id ? { ...a, status } : a)));
      showToast(`Alert marked as ${status.toLowerCase()} on backend`, 'info');
    }
  };

  const triggerDeviceAction = async (deviceId: string, action: 'RESTART' | 'CALIBRATE' | 'CONNECT' | 'DISCONNECT') => {
    if (isDemoMode) {
      setDemoDevices((prev) =>
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
    } else {
      const res = await api.triggerDeviceHeartbeat(deviceId);
      if (res.success && res.data) {
        setConnectedDevices((prev) => prev.map((d) => (d.deviceId === deviceId ? res.data! : d)));
        showToast(`Device heartbeat synced with backend for ${deviceId}`, 'success');
      } else {
        showToast(res.error || `Device command failed on backend`, 'error');
      }
    }
  };

  const refreshData = useCallback(async () => {
    if (isDemoMode) {
      showToast('Demo data refreshed', 'info');
    } else {
      await fetchConnectedData();
      showToast('Connected data refreshed from backend', 'info');
    }
  }, [isDemoMode, fetchConnectedData, showToast]);

  return (
    <DemoDataContext.Provider
      value={{
        isDemoMode,
        setDemoMode,
        isLoading,
        connectionError,
        farmers: isDemoMode ? demoFarmers : connectedFarmers,
        tests: isDemoMode ? demoTests : connectedTests,
        collections: isDemoMode ? demoCollections : connectedCollections,
        devices: isDemoMode ? demoDevices : connectedDevices,
        alerts: isDemoMode ? demoAlerts : connectedAlerts,
        summary: isDemoMode ? demoSummary : (connectedSummary || emptyFallbackSummary),
        addFarmer,
        updateFarmer,
        deleteFarmer,
        getFarmerByCustomerCode,
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
