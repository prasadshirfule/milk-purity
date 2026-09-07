import { getDbConnectionStatus } from '../config/db';
import { Farmer } from '../models/Farmer';
import { MilkTest } from '../models/MilkTest';
import { MilkCollection } from '../models/MilkCollection';
import { Device } from '../models/Device';
import { Alert } from '../models/Alert';
import { Setting } from '../models/Setting';
import { CustomerCodeService } from './customerCodeService';
import {
  SEED_FARMERS,
  SEED_TESTS,
  SEED_COLLECTIONS,
  SEED_DEVICES,
  SEED_ALERTS,
  SEED_SETTINGS
} from '../mock/seedData';
import { IFarmer, IMilkTest, IMilkCollection, IDevice, IAlert, IDairySettings } from '../types';

class DataRepository {
  private farmers: IFarmer[] = [...SEED_FARMERS];
  private tests: IMilkTest[] = [...SEED_TESTS];
  private collections: IMilkCollection[] = [...SEED_COLLECTIONS];
  private devices: IDevice[] = [...SEED_DEVICES];
  private alerts: IAlert[] = [...SEED_ALERTS];
  private settings: IDairySettings = { ...SEED_SETTINGS };

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

  // --- DEVICES ---
  public async getDevices(): Promise<IDevice[]> {
    if (getDbConnectionStatus()) {
      return (await Device.find().lean()) as unknown as IDevice[];
    }
    return this.devices;
  }

  public async getDeviceById(id: string): Promise<IDevice | null> {
    if (getDbConnectionStatus()) {
      return (await Device.findOne({ deviceId: id }).lean()) as unknown as IDevice | null;
    }
    return this.devices.find(d => d.deviceId === id) || null;
  }

  public async updateDeviceHeartbeat(id: string): Promise<IDevice | null> {
    const now = new Date();
    if (getDbConnectionStatus()) {
      await Device.updateOne({ deviceId: id }, { $set: { lastSeen: now, status: 'CONNECTED' } });
      const doc = await Device.findOne({ deviceId: id }).lean();
      const dev = this.devices.find(d => d.deviceId === id);
      if (dev && doc) {
        dev.lastSeen = now;
        dev.status = 'CONNECTED';
      }
      return doc as unknown as IDevice | null;
    }
    const dev = this.devices.find(d => d.deviceId === id);
    if (dev) {
      dev.lastSeen = now;
      dev.status = 'CONNECTED';
      return dev;
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

  // Helper for test cleanup
  public clear(): void {
    this.farmers = [...SEED_FARMERS];
    this.tests = [...SEED_TESTS];
    this.collections = [...SEED_COLLECTIONS];
    this.devices = [...SEED_DEVICES];
    this.alerts = [...SEED_ALERTS];
    this.settings = { ...SEED_SETTINGS };

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
