import { getDbConnectionStatus } from '../config/db';
import { Farmer } from '../models/Farmer';
import { MilkTest } from '../models/MilkTest';
import { MilkCollection } from '../models/MilkCollection';
import { Device } from '../models/Device';
import { Alert } from '../models/Alert';
import { Setting } from '../models/Setting';
import { User } from '../models/User';
import { AuditLog } from '../models/AuditLog';
import { CustomerCodeService } from './customerCodeService';
import { sensorService } from './sensorService';
import { hashDeviceSecret } from '../utils/deviceSecurity';
import {
  SEED_FARMERS,
  SEED_TESTS,
  SEED_COLLECTIONS,
  SEED_DEVICES,
  SEED_ALERTS,
  SEED_SETTINGS,
  SEED_USERS,
  SEED_AUDIT_LOGS
} from '../mock/seedData';
import { IFarmer, IMilkTest, IMilkCollection, IDevice, IAlert, IDairySettings, IUser, IAuditLog, DeviceStatus } from '../types';

class DataRepository {
  private farmers: IFarmer[] = [...SEED_FARMERS];
  private tests: IMilkTest[] = [...SEED_TESTS];
  private collections: IMilkCollection[] = [...SEED_COLLECTIONS];
  private devices: IDevice[] = [...SEED_DEVICES];
  private alerts: IAlert[] = [...SEED_ALERTS];
  private settings: IDairySettings = { ...SEED_SETTINGS };
  private users: IUser[] = [...SEED_USERS];
  private auditLogs: IAuditLog[] = [...SEED_AUDIT_LOGS];

  constructor() {
    CustomerCodeService.backfillCustomerCodes(this.farmers);
    const farmerCodeMap = new Map(this.farmers.map(f => [f.farmerId, f.customerCode]));
    for (const t of this.tests) {
      if (!t.customerCode && farmerCodeMap.has(t.farmerId)) {
        t.customerCode = farmerCodeMap.get(t.farmerId);
      }
    }
    for (const c of this.collections) {
      if (!c.customerCode && farmerCodeMap.has(c.farmerId)) {
        c.customerCode = farmerCodeMap.get(c.farmerId);
      }
    }
  }

  public async resetDefaults(): Promise<void> {
    this.farmers = JSON.parse(JSON.stringify(SEED_FARMERS));
    this.tests = JSON.parse(JSON.stringify(SEED_TESTS));
    this.collections = JSON.parse(JSON.stringify(SEED_COLLECTIONS));
    this.devices = JSON.parse(JSON.stringify(SEED_DEVICES));
    this.alerts = JSON.parse(JSON.stringify(SEED_ALERTS));
    this.settings = JSON.parse(JSON.stringify(SEED_SETTINGS));
    this.users = JSON.parse(JSON.stringify(SEED_USERS));
    this.auditLogs = JSON.parse(JSON.stringify(SEED_AUDIT_LOGS));
  }

  public async seedDatabaseIfEmpty(): Promise<void> {
    if (!getDbConnectionStatus()) return;

    try {
      const count = await Farmer.countDocuments();
      if (count === 0) {
        console.log('🌱 Seeding database with initial dairy data...');
        await Farmer.insertMany(SEED_FARMERS);
        await MilkTest.insertMany(SEED_TESTS);
        await MilkCollection.insertMany(SEED_COLLECTIONS);
        await Device.insertMany(SEED_DEVICES);
        await Alert.insertMany(SEED_ALERTS);
        await Setting.create(SEED_SETTINGS);
        await User.insertMany(SEED_USERS);
        await AuditLog.insertMany(SEED_AUDIT_LOGS);
        console.log('✅ Seed completed successfully.');
      } else {
        // Idempotent migration: backfill any existing MongoDB farmer docs lacking customerCode
        const existingFarmers = await Farmer.find().lean();
        const existingCodes = new Set<string>();
        for (const f of existingFarmers) {
          if (f.customerCode && CustomerCodeService.isValidFormat(f.customerCode)) {
            existingCodes.add(f.customerCode.trim().toUpperCase());
          }
        }
        for (const f of existingFarmers) {
          if (!f.customerCode || !CustomerCodeService.isValidFormat(f.customerCode)) {
            const newCode = CustomerCodeService.generateUniqueCode(existingCodes);
            await Farmer.updateOne({ _id: f._id }, { $set: { customerCode: newCode } });
          }
        }
      }
    } catch (err: any) {
      console.warn('⚠️ Seeding error:', err?.message || err);
    }
  }

  // --- FARMERS ---
  public async getFarmers(): Promise<IFarmer[]> {
    if (getDbConnectionStatus()) {
      return (await Farmer.find().sort({ createdAt: -1 }).lean()) as unknown as IFarmer[];
    }
    return this.farmers;
  }

  public async getFarmerById(id: string): Promise<IFarmer | null> {
    if (getDbConnectionStatus()) {
      return (await Farmer.findOne({ farmerId: id }).lean()) as unknown as IFarmer | null;
    }
    return this.farmers.find(f => f.farmerId === id) || null;
  }

  public async getFarmerByCustomerCode(code: string): Promise<IFarmer | null> {
    const formatted = typeof code === 'string' ? code.trim().toUpperCase() : '';
    if (!CustomerCodeService.isValidFormat(formatted)) return null;

    if (getDbConnectionStatus()) {
      return (await Farmer.findOne({ customerCode: formatted }).lean()) as unknown as IFarmer | null;
    }
    return this.farmers.find(f => f.customerCode?.toUpperCase() === formatted) || null;
  }

  public async addFarmer(data: Partial<IFarmer>): Promise<IFarmer> {
    let assignedCode = data.customerCode?.trim().toUpperCase();
    const existingFarmers = await this.getFarmers();
    const existingCodes = new Set(existingFarmers.map(f => f.customerCode?.toUpperCase()).filter(Boolean) as string[]);

    if (!assignedCode || !CustomerCodeService.isValidFormat(assignedCode) || existingCodes.has(assignedCode)) {
      assignedCode = CustomerCodeService.generateUniqueCode(existingCodes);
    }

    const newFarmer: IFarmer = {
      farmerId: data.farmerId || `FMR-${1000 + this.farmers.length + 1}`,
      customerCode: assignedCode,
      name: data.name || 'New Farmer',
      mobile: data.mobile || '',
      village: data.village || '',
      address: data.address || '',
      animalType: data.animalType || 'COW',
      notes: data.notes || '',
      status: data.status || 'ACTIVE',
      totalMilkSupplied: Number(data.totalMilkSupplied) || 0,
      totalCollections: Number(data.totalCollections) || 0,
      averageQualityScore: Number(data.averageQualityScore) || 0,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    if (getDbConnectionStatus()) {
      await Farmer.create(newFarmer);
    }
    this.farmers.unshift(newFarmer);
    return newFarmer;
  }

  public async updateFarmer(id: string, data: Partial<IFarmer>): Promise<IFarmer | null> {
    if (getDbConnectionStatus()) {
      await Farmer.updateOne({ farmerId: id }, { $set: { ...data, updatedAt: new Date() } });
      const updatedDoc = await Farmer.findOne({ farmerId: id }).lean();
      const idx = this.farmers.findIndex(f => f.farmerId === id);
      if (idx !== -1 && updatedDoc) {
        this.farmers[idx] = updatedDoc as unknown as IFarmer;
      }
      return updatedDoc as unknown as IFarmer | null;
    }
    const idx = this.farmers.findIndex(f => f.farmerId === id);
    if (idx !== -1) {
      this.farmers[idx] = { ...this.farmers[idx], ...data, updatedAt: new Date() };
      return this.farmers[idx];
    }
    return null;
  }

  public async deleteFarmer(id: string): Promise<boolean> {
    if (getDbConnectionStatus()) {
      const res = await Farmer.deleteOne({ farmerId: id });
      const initialLen = this.farmers.length;
      this.farmers = this.farmers.filter(f => f.farmerId !== id);
      return (res.deletedCount || 0) > 0 || this.farmers.length < initialLen;
    }
    const initialLen = this.farmers.length;
    this.farmers = this.farmers.filter(f => f.farmerId !== id);
    return this.farmers.length < initialLen;
  }

  // --- MILK TESTS ---
  public async getTests(): Promise<IMilkTest[]> {
    if (getDbConnectionStatus()) {
      return (await MilkTest.find().sort({ timestamp: -1 }).lean()) as unknown as IMilkTest[];
    }
    return this.tests;
  }

  public async getTestById(id: string): Promise<IMilkTest | null> {
    if (getDbConnectionStatus()) {
      return (await MilkTest.findOne({ testId: id }).lean()) as unknown as IMilkTest | null;
    }
    return this.tests.find(t => t.testId === id) || null;
  }

  public async addTest(test: IMilkTest): Promise<IMilkTest> {
    if (getDbConnectionStatus()) {
      await MilkTest.create(test);
    }
    this.tests.unshift(test);

    // Update farmer aggregate stats only if test was accepted/warning (NOT rejected)
    if (test.result !== 'REJECTED') {
      const farmer = await this.getFarmerById(test.farmerId);
      if (farmer) {
        const prevSupplied = Number(farmer.totalMilkSupplied) || 0;
        const prevCollections = Number(farmer.totalCollections) || 0;
        const prevAvg = Number(farmer.averageQualityScore) || 0;
        const newSupplied = Number((prevSupplied + test.quantity).toFixed(2));
        const newCollections = prevCollections + 1;
        const newAvg = prevCollections > 0
          ? Number(((prevAvg * prevCollections + test.qualityScore) / newCollections).toFixed(1))
          : Number(test.qualityScore.toFixed(1));

        await this.updateFarmer(test.farmerId, {
          totalMilkSupplied: newSupplied,
          totalCollections: newCollections,
          averageQualityScore: newAvg
        });
      }
    }

    return test;
  }

  // --- COLLECTIONS ---
  public async getCollections(): Promise<IMilkCollection[]> {
    if (getDbConnectionStatus()) {
      return (await MilkCollection.find().sort({ timestamp: -1 }).lean()) as unknown as IMilkCollection[];
    }
    return this.collections;
  }

  public async addCollection(col: IMilkCollection): Promise<IMilkCollection> {
    if (getDbConnectionStatus()) {
      await MilkCollection.create(col);
    }
    this.collections.unshift(col);
    return col;
  }

  // --- DEVICES & SENSORS ---
  public resolveDeviceStatus(device: IDevice, timeoutMs = 60000): DeviceStatus {
    if (device.isDeactivated) {
      return 'OFFLINE';
    }
    if (!device.lastSeen) {
      return 'UNKNOWN';
    }
    const elapsed = Date.now() - new Date(device.lastSeen).getTime();
    if (elapsed <= timeoutMs) {
      if (device.sensors && (device.sensors.ph === false || device.sensors.fat === false)) {
        return 'WARNING';
      }
      return 'ONLINE';
    }
    return 'OFFLINE';
  }

  public async getDevices(): Promise<IDevice[]> {
    let rawDevices: IDevice[] = [];
    if (getDbConnectionStatus()) {
      rawDevices = (await Device.find().lean()) as unknown as IDevice[];
    } else {
      rawDevices = [...this.devices];
    }

    return rawDevices.map((d) => ({
      ...d,
      status: this.resolveDeviceStatus(d),
      latestReading: sensorService.getLatestReading(d.deviceId) || undefined
    }));
  }

  public async getDeviceById(id: string): Promise<IDevice | null> {
    let dev: IDevice | null = null;
    if (getDbConnectionStatus()) {
      dev = (await Device.findOne({ deviceId: id }).lean()) as unknown as IDevice | null;
    } else {
      dev = this.devices.find(d => d.deviceId === id) || null;
    }

    if (!dev) return null;
    return {
      ...dev,
      status: this.resolveDeviceStatus(dev),
      latestReading: sensorService.getLatestReading(dev.deviceId) || undefined
    };
  }

  public async addDevice(data: Partial<IDevice>): Promise<IDevice> {
    const rawApiKey = data.apiKey || `dev_key_${Math.random().toString(36).substring(2, 10)}`;
    const newDevice: IDevice = {
      deviceId: data.deviceId || `ESP32-STATION-${String(this.devices.length + 1).padStart(3, '0')}`,
      name: data.name || 'New Sensor Dock',
      deviceType: data.deviceType || 'ESP32_STATION',
      status: 'UNKNOWN',
      connectionMode: data.connectionMode || 'CONNECTED',
      firmwareVersion: data.firmwareVersion || 'v1.0.0',
      apiKey: rawApiKey,
      apiKeyHash: data.apiKeyHash || hashDeviceSecret(rawApiKey),
      isDeactivated: data.isDeactivated || false,
      ipAddress: data.ipAddress || '192.168.1.150',
      macAddress: data.macAddress || '24:6F:28:8A:99:99',
      lastSeen: undefined,
      calibrationStatus: data.calibrationStatus || 'UNKNOWN',
      lastCalibrationDate: data.lastCalibrationDate,
      calibrationDueDate: data.calibrationDueDate,
      sensors: data.sensors || {
        temperature: true,
        ph: true,
        fat: true,
        conductivity: true,
        density: true,
        level: true
      },
      location: data.location || 'Testing Bay',
      createdAt: new Date(),
      updatedAt: new Date()
    };

    if (getDbConnectionStatus()) {
      await Device.create(newDevice);
    }
    this.devices.unshift(newDevice);
    return newDevice;
  }

  public async updateDevice(id: string, data: Partial<IDevice>): Promise<IDevice | null> {
    if (getDbConnectionStatus()) {
      await Device.updateOne({ deviceId: id }, { $set: { ...data, updatedAt: new Date() } });
      const doc = await Device.findOne({ deviceId: id }).lean();
      const idx = this.devices.findIndex(d => d.deviceId === id);
      if (idx !== -1 && doc) {
        this.devices[idx] = doc as unknown as IDevice;
      }
      if (!doc) return null;
      return {
        ...(doc as unknown as IDevice),
        status: this.resolveDeviceStatus(doc as unknown as IDevice),
        latestReading: sensorService.getLatestReading(id) || undefined
      };
    }

    const idx = this.devices.findIndex(d => d.deviceId === id);
    if (idx !== -1) {
      this.devices[idx] = { ...this.devices[idx], ...data, updatedAt: new Date() };
      return {
        ...this.devices[idx],
        status: this.resolveDeviceStatus(this.devices[idx]),
        latestReading: sensorService.getLatestReading(id) || undefined
      };
    }
    return null;
  }

  public async deleteDevice(id: string): Promise<boolean> {
    if (getDbConnectionStatus()) {
      const res = await Device.deleteOne({ deviceId: id });
      this.devices = this.devices.filter(d => d.deviceId !== id);
      return res.deletedCount > 0;
    }
    const lenBefore = this.devices.length;
    this.devices = this.devices.filter(d => d.deviceId !== id);
    return this.devices.length < lenBefore;
  }

  public async updateDeviceHeartbeat(id: string): Promise<IDevice | null> {
    const now = new Date();
    if (getDbConnectionStatus()) {
      await Device.updateOne({ deviceId: id }, { $set: { lastSeen: now } });
      const doc = await Device.findOne({ deviceId: id }).lean();
      const dev = this.devices.find(d => d.deviceId === id);
      if (dev && doc) {
        dev.lastSeen = now;
      }
      return doc ? { ...(doc as unknown as IDevice), status: 'ONLINE' } : null;
    }
    const dev = this.devices.find(d => d.deviceId === id);
    if (dev) {
      dev.lastSeen = now;
      return { ...dev, status: 'ONLINE' };
    }
    return null;
  }

  // --- ALERTS ---
  public async getAlerts(): Promise<IAlert[]> {
    if (getDbConnectionStatus()) {
      return (await Alert.find().sort({ timestamp: -1 }).lean()) as unknown as IAlert[];
    }
    return this.alerts;
  }

  public async addAlert(alert: IAlert): Promise<IAlert> {
    if (getDbConnectionStatus()) {
      await Alert.create(alert);
    }
    this.alerts.unshift(alert);
    return alert;
  }

  public async updateAlertStatus(id: string, status: 'ACTIVE' | 'RESOLVED' | 'DISMISSED'): Promise<IAlert | null> {
    if (getDbConnectionStatus()) {
      await Alert.updateOne({ alertId: id }, { $set: { status } });
      const doc = await Alert.findOne({ alertId: id }).lean();
      const alert = this.alerts.find(a => a.alertId === id);
      if (alert && doc) {
        alert.status = status;
      }
      return doc as unknown as IAlert | null;
    }
    const alert = this.alerts.find(a => a.alertId === id);
    if (alert) {
      alert.status = status;
      return alert;
    }
    return null;
  }

  // --- SETTINGS ---
  public async getSettings(): Promise<IDairySettings> {
    if (getDbConnectionStatus()) {
      const doc = await Setting.findOne().lean();
      if (doc) return doc as unknown as IDairySettings;
    }
    return this.settings;
  }

  public async updateSettings(data: Partial<IDairySettings>): Promise<IDairySettings> {
    this.settings = { ...this.settings, ...data };
    if (getDbConnectionStatus()) {
      await Setting.findOneAndUpdate({}, { $set: this.settings }, { upsert: true });
    }
    return this.settings;
  }

  // --- USERS ---
  public async getUsers(): Promise<IUser[]> {
    if (getDbConnectionStatus()) {
      return (await User.find().sort({ createdAt: -1 }).lean()) as unknown as IUser[];
    }
    return this.users;
  }

  public async getUserById(id: string): Promise<IUser | null> {
    if (!id) return null;
    const formatted = id.trim().toLowerCase();
    if (getDbConnectionStatus()) {
      return (await User.findOne({ $or: [{ userId: id }, { username: formatted }] }).lean()) as unknown as IUser | null;
    }
    return this.users.find(u => u.userId === id || u.username.toLowerCase() === formatted) || null;
  }

  public async getUserByUsername(username: string): Promise<IUser | null> {
    const formatted = (username || '').trim().toLowerCase();
    if (getDbConnectionStatus()) {
      return (await User.findOne({ username: formatted }).lean()) as unknown as IUser | null;
    }
    return this.users.find(u => u.username.toLowerCase() === formatted) || null;
  }

  public async addUser(userData: Partial<IUser>): Promise<IUser> {
    const newUser: IUser = {
      userId: userData.userId || `USR-${String(this.users.length + 1).padStart(3, '0')}`,
      name: userData.name || 'New Operator',
      username: (userData.username || `user${this.users.length + 1}`).toLowerCase().trim(),
      password: userData.password || 'dairy2026',
      role: userData.role || 'OPERATOR',
      status: userData.status || 'ACTIVE',
      dairyName: userData.dairyName || 'Amrit Dairy Milk Collection Center',
      createdAt: new Date(),
      updatedAt: new Date()
    };

    if (getDbConnectionStatus()) {
      await User.create(newUser);
    }
    this.users.unshift(newUser);
    return newUser;
  }

  public async updateUser(id: string, data: Partial<IUser>): Promise<IUser | null> {
    if (getDbConnectionStatus()) {
      await User.updateOne({ userId: id }, { $set: { ...data, updatedAt: new Date() } });
      const doc = await User.findOne({ userId: id }).lean();
      const idx = this.users.findIndex(u => u.userId === id);
      if (idx !== -1 && doc) {
        this.users[idx] = doc as unknown as IUser;
      }
      return doc as unknown as IUser | null;
    }
    const idx = this.users.findIndex(u => u.userId === id);
    if (idx !== -1) {
      this.users[idx] = { ...this.users[idx], ...data, updatedAt: new Date() };
      return this.users[idx];
    }
    return null;
  }

  // --- AUDIT LOGS ---
  public async getAuditLogs(filters?: {
    user?: string;
    role?: string;
    action?: string;
    customerCode?: string;
    date?: string;
    search?: string;
  }): Promise<IAuditLog[]> {
    let logs: IAuditLog[] = [];
    if (getDbConnectionStatus()) {
      logs = (await AuditLog.find().sort({ timestamp: -1 }).lean()) as unknown as IAuditLog[];
    } else {
      logs = [...this.auditLogs];
    }

    if (filters) {
      if (filters.user) {
        const u = filters.user.toLowerCase().trim();
        logs = logs.filter(l => l.userId.toLowerCase().includes(u) || l.userName.toLowerCase().includes(u));
      }
      if (filters.role && filters.role !== 'ALL') {
        logs = logs.filter(l => l.role === filters.role);
      }
      if (filters.action && filters.action !== 'ALL') {
        logs = logs.filter(l => l.action === filters.action);
      }
      if (filters.customerCode) {
        const cc = filters.customerCode.trim().toUpperCase();
        logs = logs.filter(l => l.customerCode === cc);
      }
      if (filters.date) {
        const d = new Date(filters.date).toDateString();
        logs = logs.filter(l => new Date(l.timestamp).toDateString() === d);
      }
      if (filters.search) {
        const q = filters.search.toLowerCase().trim();
        logs = logs.filter(
          l =>
            l.auditId.toLowerCase().includes(q) ||
            l.details.toLowerCase().includes(q) ||
            (l.entityId && l.entityId.toLowerCase().includes(q)) ||
            (l.customerCode && l.customerCode.toLowerCase().includes(q)) ||
            l.userName.toLowerCase().includes(q)
        );
      }
    }

    return logs;
  }

  public async addAuditLog(logData: Partial<IAuditLog>): Promise<IAuditLog> {
    const newLog: IAuditLog = {
      auditId: logData.auditId || `AUD-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`,
      timestamp: logData.timestamp || new Date(),
      userId: logData.userId || 'USR-SYSTEM',
      userName: logData.userName || 'System Engine',
      role: logData.role || 'OPERATOR',
      action: logData.action || 'SYSTEM_NOTICE',
      entityType: logData.entityType || 'SYSTEM',
      entityId: logData.entityId || '',
      customerCode: logData.customerCode || '',
      details: logData.details || '',
      ipAddress: logData.ipAddress || '127.0.0.1'
    };

    if (getDbConnectionStatus()) {
      await AuditLog.create(newLog);
    }
    this.auditLogs.unshift(newLog);
    return newLog;
  }

  // Helper for test cleanup
  public clear(): void {
    this.farmers = [...SEED_FARMERS];
    this.tests = [...SEED_TESTS];
    this.collections = [...SEED_COLLECTIONS];
    this.devices = [...SEED_DEVICES];
    this.alerts = [...SEED_ALERTS];
    this.settings = { ...SEED_SETTINGS };
    this.users = [...SEED_USERS];
    this.auditLogs = [...SEED_AUDIT_LOGS];

    CustomerCodeService.backfillCustomerCodes(this.farmers);
    const farmerCodeMap = new Map(this.farmers.map(f => [f.farmerId, f.customerCode]));
    for (const t of this.tests) {
      if (!t.customerCode && farmerCodeMap.has(t.farmerId)) {
        t.customerCode = farmerCodeMap.get(t.farmerId);
      }
    }
    for (const c of this.collections) {
      if (!c.customerCode && farmerCodeMap.has(c.farmerId)) {
        c.customerCode = farmerCodeMap.get(c.farmerId);
      }
    }
  }
}

export const dataRepository = new DataRepository();
