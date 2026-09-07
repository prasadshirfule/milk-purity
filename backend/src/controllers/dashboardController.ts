import { Request, Response } from 'express';
import { dataRepository } from '../services/seedService';

export const getDashboardSummary = async (req: Request, res: Response): Promise<void> => {
  try {
    const farmers = await dataRepository.getFarmers();
    const tests = await dataRepository.getTests();
    const devices = await dataRepository.getDevices();
    const alerts = await dataRepository.getAlerts();

    const now = new Date();
    const todayStr = now.toDateString();

    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toDateString();

    const todayTests = tests.filter(t => new Date(t.timestamp).toDateString() === todayStr);
    const yesterdayTests = tests.filter(t => new Date(t.timestamp).toDateString() === yesterdayStr);

    const totalVolumeToday = todayTests
      .filter(t => t.result !== 'REJECTED')
      .reduce((sum, t) => sum + t.quantity, 0);

    const totalVolumeYesterday = yesterdayTests
      .filter(t => t.result !== 'REJECTED')
      .reduce((sum, t) => sum + t.quantity, 0);

    const acceptedCount = todayTests.filter(t => t.result === 'ACCEPTED').length;
    const warningCount = todayTests.filter(t => t.result === 'WARNING').length;
    const rejectedCount = todayTests.filter(t => t.result === 'REJECTED').length;
    const totalTestsToday = todayTests.length;

    const avgPurity = totalTestsToday > 0
      ? Number((todayTests.reduce((sum, t) => sum + t.qualityScore, 0) / totalTestsToday).toFixed(1))
      : 0;

    let collectionGrowthPercent = 0;
    if (totalVolumeYesterday > 0) {
      collectionGrowthPercent = Number((((totalVolumeToday - totalVolumeYesterday) / totalVolumeYesterday) * 100).toFixed(1));
    } else if (totalVolumeYesterday === 0 && totalVolumeToday > 0) {
      collectionGrowthPercent = 100;
    } else {
      collectionGrowthPercent = 0;
    }

    const activeFarmersCount = farmers.filter(f => f.status === 'ACTIVE').length;
    const primaryDevice = devices.find(d => d.deviceId === 'ESP32-MILK-001') || devices[0];
    const activeAlertsCount = alerts.filter(a => a.status === 'ACTIVE').length;

    res.json({
      success: true,
      data: {
        todayCollectionLiters: Number(totalVolumeToday.toFixed(1)),
        collectionGrowthPercent,
        totalTestsToday,
        acceptedCount,
        warningCount,
        rejectedCount,
        averagePurityScore: avgPurity,
        activeFarmers: activeFarmersCount,
        deviceStatus: primaryDevice ? primaryDevice.status : 'CONNECTED',
        primaryDeviceName: primaryDevice ? primaryDevice.name : 'ESP32-MILK-001',
        activeAlertsCount
      }
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const getCollectionTrend = async (req: Request, res: Response): Promise<void> => {
  try {
    const days = Number(req.query.days) || 7;
    const collections = await dataRepository.getCollections();

    // Generate timeline
    const timelineData: { date: string; liters: number; amount: number; avgFat: number }[] = [];
    const now = new Date();

    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().slice(5, 10); // MM-DD
      const fullDateStr = d.toDateString();

      const dayCollections = collections.filter(c => new Date(c.timestamp).toDateString() === fullDateStr);
      const liters = dayCollections.reduce((sum, c) => sum + c.quantity, 0);
      const amount = dayCollections.reduce((sum, c) => sum + c.totalAmount, 0);
      const avgFat = dayCollections.length > 0
        ? Number((dayCollections.reduce((sum, c) => sum + c.fat, 0) / dayCollections.length).toFixed(2))
        : 0;

      timelineData.push({
        date: dateStr,
        liters: Number(liters.toFixed(1)),
        amount: Number(amount.toFixed(2)),
        avgFat
      });
    }

    res.json({ success: true, data: timelineData });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const getQualityAnalytics = async (req: Request, res: Response): Promise<void> => {
  try {
    const tests = await dataRepository.getTests();
    const settings = await dataRepository.getSettings();

    const count = tests.length;
    const avgPh = count > 0 ? Number((tests.reduce((s, t) => s + t.ph, 0) / count).toFixed(2)) : 0;
    const avgFat = count > 0 ? Number((tests.reduce((s, t) => s + t.fat, 0) / count).toFixed(2)) : 0;
    const avgDensity = count > 0 ? Number((tests.reduce((s, t) => s + t.density, 0) / count).toFixed(4)) : 0;
    const avgConductivity = count > 0 ? Number((tests.reduce((s, t) => s + t.conductivity, 0) / count).toFixed(2)) : 0;
    const avgTemp = count > 0 ? Number((tests.reduce((s, t) => s + t.temperature, 0) / count).toFixed(1)) : 0;

    const distribution = [
      { classification: 'EXCELLENT', count: tests.filter(t => t.classification === 'EXCELLENT').length },
      { classification: 'GOOD', count: tests.filter(t => t.classification === 'GOOD').length },
      { classification: 'SUSPICIOUS', count: tests.filter(t => t.classification === 'SUSPICIOUS').length },
      { classification: 'REJECT', count: tests.filter(t => t.classification === 'REJECT').length }
    ];

    res.json({
      success: true,
      data: {
        averages: {
          ph: avgPh,
          fat: avgFat,
          density: avgDensity,
          conductivity: avgConductivity,
          temperature: avgTemp
        },
        thresholds: settings.thresholds,
        distribution
      }
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};
