export type AnimalType = 'COW' | 'BUFFALO' | 'MIXED' | 'GOAT';
export type TestResult = 'ACCEPTED' | 'REJECTED' | 'WARNING';
export type QualityClassification = 'EXCELLENT' | 'GOOD' | 'SUSPICIOUS' | 'REJECT';
export type ParameterStatus = 'NORMAL' | 'LOW' | 'HIGH' | 'CRITICAL';
export type AlertSeverity = 'INFO' | 'WARNING' | 'CRITICAL';
export type AlertStatus = 'ACTIVE' | 'RESOLVED' | 'DISMISSED';
export type DeviceStatus = 'ONLINE' | 'OFFLINE' | 'WARNING' | 'UNKNOWN' | 'CONNECTED' | 'DISCONNECTED' | 'ERROR';
export type DeviceType = 'ESP32_STATION' | 'ESP32_PORTABLE' | 'LAB_ANALYZER' | 'SIMULATOR' | 'ESP32_MILK_ANALYZER' | 'ESP32_INTAKE_DOCK' | 'LAB_BENCHMARK_PROBE';
export type ConnectionMode = 'DEMO' | 'CONNECTED' | 'REST_POLLING' | 'WEBSOCKET_READY' | 'MQTT_READY';
export type CalibrationStatus = 'CALIBRATED' | 'DUE' | 'OVERDUE' | 'UNKNOWN';

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
  customerCode?: string;
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
  firmwareVersion?: string;
  sequenceNumber?: number;
  batteryLevel?: number;
  isDemo?: boolean;
}

export interface IParameterAssessment {
  status: ParameterStatus;
  reading: number;
  normalMin: number;
  normalMax: number;
  unit: string;
  message?: string;
}

export type AIRecommendation = 'ACCEPT' | 'REVIEW' | 'REJECT';

export interface IQualityResult {
  score: number; // 0 - 100
  purityScore: number; // 0 - 100 (alias for score)
  classification: QualityClassification;
  result: TestResult;
  aiRecommendation: AIRecommendation;
  modelVersion: string;
  scoreExplanation: string[];
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
  customerCode?: string;
  farmerName?: string;
  deviceId: string;
  quantity: number; // Litres
  timestamp: Date;
  sensorTimestamp?: Date | string;
  testTimestamp?: Date | string;
  temperature: number;
  ph: number;
  fat: number;
  density: number;
  conductivity: number;
  milkLevel: number;
  qualityScore: number;
  purityScore?: number;
  classification: QualityClassification;
  recommendedResult?: TestResult;
  aiRecommendation?: AIRecommendation;
  operatorDecision?: 'ACCEPT' | 'REJECT';
  overrideReason?: string;
  modelVersion?: string;
  scoreExplanation?: string[];
  prediction?: string;
  confidence?: number | null;
  warnings: string[];
  result: TestResult;
  ratePerLiter?: number;
  totalAmount?: number;
  operatorId?: string;
  operatorName?: string;
  operatorRole?: UserRole;
  overrideTimestamp?: Date;
  notes?: string;
}

export interface IMilkCollection {
  collectionId: string;
  farmerId: string;
  customerCode?: string;
  farmerName: string;
  testId: string;
  quantity: number;
  fat: number;
  rate: number;
  totalAmount: number;
  qualityScore: number;
  result: TestResult;
  operatorId?: string;
  operatorName?: string;
  timestamp: Date;
  paymentStatus: 'PAID' | 'PENDING';
}

export type UserRole = 'ADMIN' | 'OPERATOR' | 'QUALITY_OPERATOR' | 'VIEWER';
export type UserStatus = 'ACTIVE' | 'INACTIVE';

export interface IUser {
  userId: string;
  name: string;
  username: string;
  password?: string;
  passwordHash?: string;
  role: UserRole;
  status: UserStatus;
  dairyName?: string;
  createdAt: Date;
  updatedAt: Date;
}

export type AuditAction =
  | 'LOGIN'
  | 'LOGOUT'
  | 'CREATE_CUSTOMER'
  | 'UPDATE_CUSTOMER'
  | 'SCAN_CUSTOMER_QR'
  | 'CREATE_MILK_TEST'
  | 'QUALITY_RECOMMENDATION'
  | 'ACCEPT_MILK'
  | 'REJECT_MILK'
  | 'OVERRIDE_RECOMMENDATION'
  | 'CREATE_COLLECTION'
  | 'PRINT_RECEIPT'
  | 'UPDATE_SETTINGS'
  | 'USER_MANAGEMENT'
  | 'DEVICE_REGISTERED'
  | 'DEVICE_UPDATED'
  | 'DEVICE_DELETED'
  | 'DEVICE_CONNECTED'
  | 'DEVICE_OFFLINE'
  | 'TELEMETRY_RECEIVED'
  | 'SENSOR_TEST_CAPTURED';

export interface IAuditLog {
  auditId: string;
  timestamp: Date;
  userId: string;
  userName: string;
  role: UserRole | string;
  action: AuditAction | string;
  entityType: string;
  entityId?: string;
  customerCode?: string;
  details: string;
  ipAddress?: string;
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
  deviceType?: DeviceType;
  status: DeviceStatus;
  connectionMode?: ConnectionMode;
  firmwareVersion: string;
  apiKey?: string;
  apiKeyHash?: string;
  isDeactivated?: boolean;
  ipAddress?: string;
  macAddress?: string;
  lastSeen?: Date;
  calibrationStatus?: CalibrationStatus;
  lastCalibrationDate?: Date;
  calibrationDueDate?: Date;
  sensors: IDeviceSensorHealth;
  location?: string;
  latestReading?: ISensorReading;
  createdAt: Date;
  updatedAt?: Date;
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
