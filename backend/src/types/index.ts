export type AnimalType = 'COW' | 'BUFFALO' | 'MIXED' | 'GOAT';
export type TestResult = 'ACCEPTED' | 'REJECTED' | 'WARNING';
export type QualityClassification = 'EXCELLENT' | 'GOOD' | 'SUSPICIOUS' | 'REJECT';
export type ParameterStatus = 'NORMAL' | 'LOW' | 'HIGH' | 'CRITICAL';
export type AlertSeverity = 'INFO' | 'WARNING' | 'CRITICAL';
export type AlertStatus = 'ACTIVE' | 'RESOLVED' | 'DISMISSED';
export type DeviceStatus = 'CONNECTED' | 'DISCONNECTED' | 'ERROR' | 'OFFLINE';

export type AlertType =
  | 'HIGH_CONDUCTIVITY'
  | 'ABNORMAL_PH'
  | 'LOW_FAT'
  | 'ABNORMAL_DENSITY'
  | 'SENSOR_ERROR'
  | 'DEVICE_OFFLINE'
  | 'SUSPICIOUS_MILK'
  | 'TEMPERATURE_DEVIATION'
  | 'SYSTEM_NOTICE';

export interface IFarmer {
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
  createdAt: Date;
  updatedAt: Date;
}

export interface ISensorReading {
  deviceId: string;
  timestamp: string | Date;
  temperature: number; // °C
  ph: number;
  fat: number; // %
  density: number; // g/cm³ or g/mL
  conductivity: number; // mS/cm
  milkLevel: number; // Litres
}

export interface IParameterAssessment {
  status: ParameterStatus;
  reading: number;
  normalMin: number;
  normalMax: number;
  unit: string;
  message?: string;
}

export interface IQualityResult {
  score: number; // 0 - 100
  classification: QualityClassification;
  result: TestResult;
  warnings: string[];
  recommendations: string[];
  parameters: {
    temperature: IParameterAssessment;
    ph: IParameterAssessment;
    fat: IParameterAssessment;
    density: IParameterAssessment;
    conductivity: IParameterAssessment;
  };
  isMlPredicted?: boolean;
  mlConfidence?: number | null;
  mlPrediction?: string;
}

export interface IMilkTest {
  testId: string;
  farmerId: string;
  farmerName?: string;
  deviceId: string;
  quantity: number; // Litres
  timestamp: Date;
  temperature: number;
  ph: number;
  fat: number;
  density: number;
  conductivity: number;
  milkLevel: number;
  qualityScore: number;
  classification: QualityClassification;
  prediction?: string;
  confidence?: number | null;
  warnings: string[];
  result: TestResult;
  ratePerLiter?: number;
  totalAmount?: number;
  notes?: string;
}

export interface IMilkCollection {
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
  timestamp: Date;
  paymentStatus: 'PAID' | 'PENDING';
}

export interface IDeviceSensorHealth {
  temperature: boolean;
  ph: boolean;
  fat: boolean;
  conductivity: boolean;
  density: boolean;
  level: boolean;
}

export interface IDevice {
  deviceId: string;
  name: string;
  status: DeviceStatus;
  firmwareVersion: string;
  ipAddress?: string;
  macAddress?: string;
  lastSeen: Date;
  sensors: IDeviceSensorHealth;
  location?: string;
  createdAt: Date;
}

export interface IAlert {
  alertId: string;
  type: AlertType;
  severity: AlertSeverity;
  farmerId?: string;
  farmerName?: string;
  testId?: string;
  deviceId?: string;
  message: string;
  status: AlertStatus;
  timestamp: Date;
}

export interface IThresholdSettings {
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

export interface IDairySettings {
  dairyName: string;
  dairyAddress: string;
  contactPhone: string;
  contactEmail: string;
  thresholds: IThresholdSettings;
}
