export type AnimalType = 'COW' | 'BUFFALO' | 'MIXED' | 'GOAT';
export type TestResult = 'ACCEPTED' | 'REJECTED' | 'WARNING';
export type QualityClassification = 'EXCELLENT' | 'GOOD' | 'SUSPICIOUS' | 'REJECT';
export type ParameterStatus = 'NORMAL' | 'LOW' | 'HIGH' | 'CRITICAL';
export type AlertSeverity = 'INFO' | 'WARNING' | 'CRITICAL';
export type AlertStatus = 'ACTIVE' | 'RESOLVED' | 'DISMISSED';
export type DeviceStatus = 'CONNECTED' | 'DISCONNECTED' | 'ERROR' | 'OFFLINE';

export interface Farmer {
  farmerId: string;
  name: string;
  mobile: string;
  village: string;
  address?: string;
  animalType: AnimalType;
  notes?: string;
  status: 'ACTIVE' | 'INACTIVE';
  totalMilkSupplied?: number;
  totalCollections?: number;
  averageQualityScore?: number;
  createdAt: string | Date;
  updatedAt?: string | Date;
}

export interface SensorReading {
  deviceId: string;
  timestamp: string;
  temperature: number; // °C
  ph: number;
  fat: number; // %
  density: number; // g/mL
  conductivity: number; // mS/cm
  milkLevel: number; // Litres
}

export interface ParameterAssessment {
  status: ParameterStatus;
  reading: number;
  normalMin: number;
  normalMax: number;
  unit: string;
  message?: string;
}

export interface QualityResult {
  score: number;
  classification: QualityClassification;
  result: TestResult;
  warnings: string[];
  recommendations: string[];
  parameters: {
    temperature: ParameterAssessment;
    ph: ParameterAssessment;
    fat: ParameterAssessment;
    density: ParameterAssessment;
    conductivity: ParameterAssessment;
  };
  isMlPredicted?: boolean;
  mlConfidence?: number;
  mlPrediction?: string;
}

export interface MilkTest {
  testId: string;
  farmerId: string;
  farmerName?: string;
  deviceId: string;
  quantity: number;
  timestamp: string | Date;
  temperature: number;
  ph: number;
  fat: number;
  density: number;
  conductivity: number;
  milkLevel: number;
  qualityScore: number;
  classification: QualityClassification;
  prediction?: string;
  confidence?: number;
  warnings: string[];
  result: TestResult;
  ratePerLiter?: number;
  totalAmount?: number;
  notes?: string;
}

export interface MilkCollection {
  collectionId: string;
  farmerId: string;
  farmerName: string;
  testId: string;
  quantity: number;
  fat: number;
  rate: number;
  totalAmount: number;
  qualityScore: number;
  result: TestResult;
  timestamp: string | Date;
  paymentStatus: 'PAID' | 'PENDING';
}

export interface DeviceSensorHealth {
  temperature: boolean;
  ph: boolean;
  fat: boolean;
  conductivity: boolean;
  density: boolean;
  level: boolean;
}

export interface Device {
  deviceId: string;
  name: string;
  status: DeviceStatus;
  firmwareVersion: string;
  ipAddress?: string;
  macAddress?: string;
  lastSeen: string | Date;
  sensors: DeviceSensorHealth;
  location?: string;
  createdAt: string | Date;
}

export interface Alert {
  alertId: string;
  type: 'HIGH_CONDUCTIVITY' | 'ABNORMAL_PH' | 'LOW_FAT' | 'DEVICE_OFFLINE' | 'SUSPICIOUS_MILK' | 'TEMPERATURE_DEVIATION' | 'SYSTEM_NOTICE';
  severity: AlertSeverity;
  farmerId?: string;
  farmerName?: string;
  testId?: string;
  deviceId?: string;
  message: string;
  status: AlertStatus;
  timestamp: string | Date;
}

export interface ThresholdSettings {
  phMin: number;
  phMax: number;
  fatMin: number;
  fatMax: number;
  densityMin: number;
  densityMax: number;
  conductivityMin: number;
  conductivityMax: number;
  tempMin: number;
  tempMax: number;
  scoreExcellentMin: number;
  scoreGoodMin: number;
  scoreSuspiciousMin: number;
  baseRatePerLiter: number;
  fatPremiumFactor: number;
}

export interface DairySettings {
  dairyName: string;
  dairyAddress: string;
  contactPhone: string;
  contactEmail: string;
  thresholds: ThresholdSettings;
}

export interface DashboardSummary {
  todayCollectionLiters: number;
  collectionGrowthPercent: number;
  totalTestsToday: number;
  acceptedCount: number;
  warningCount: number;
  rejectedCount: number;
  averagePurityScore: number;
  activeFarmers: number;
  deviceStatus: DeviceStatus;
  primaryDeviceName: string;
  activeAlertsCount: number;
}

export interface MLPredictionResponse {
  prediction: string;
  confidence: number;
  score: number;
  warnings: string[];
  isMock: boolean;
}
