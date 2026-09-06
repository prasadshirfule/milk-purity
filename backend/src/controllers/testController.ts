import { Request, Response } from 'express';
import { dataRepository } from '../services/seedService';
import { QualityService } from '../services/qualityService';
import { MLService } from '../services/mlService';
import { IMilkTest, IMilkCollection, IAlert } from '../types';

export const getTests = async (req: Request, res: Response): Promise<void> => {
  try {
    const { farmerId, result, date, search } = req.query;
    let tests = await dataRepository.getTests();

    if (farmerId && typeof farmerId === 'string') {
      tests = tests.filter(t => t.farmerId === farmerId);
    }

    if (result && typeof result === 'string' && result !== 'ALL') {
      tests = tests.filter(t => t.result === result);
    }

    if (search && typeof search === 'string') {
      const q = search.toLowerCase();
      tests = tests.filter(
        t =>
          t.testId.toLowerCase().includes(q) ||
          (t.farmerName && t.farmerName.toLowerCase().includes(q)) ||
          t.farmerId.toLowerCase().includes(q)
      );
    }

    if (date && typeof date === 'string') {
      const targetDate = new Date(date).toDateString();
      tests = tests.filter(t => new Date(t.timestamp).toDateString() === targetDate);
    }

    res.json({ success: true, count: tests.length, data: tests });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const getTestById = async (req: Request, res: Response): Promise<void> => {
  try {
    const test = await dataRepository.getTestById(req.params.id);
    if (!test) {
      res.status(404).json({ success: false, error: 'Test not found' });
      return;
    }
    res.json({ success: true, data: test });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const createTest = async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      farmerId,
      farmerName,
      deviceId,
      quantity,
      temperature,
      ph,
      fat,
      density,
      conductivity,
      milkLevel,
      notes
    } = req.body;

    if (!farmerId || quantity === undefined || ph === undefined || fat === undefined) {
      res.status(400).json({ success: false, error: 'Missing required test parameters' });
      return;
    }

    const settings = await dataRepository.getSettings();
    const sensorData = {
      deviceId: deviceId || 'ESP32-MILK-001',
      timestamp: new Date().toISOString(),
      temperature: Number(temperature) || 24.0,
      ph: Number(ph),
      fat: Number(fat),
      density: Number(density) || 1.029,
      conductivity: Number(conductivity) || 5.0,
      milkLevel: Number(milkLevel) || Number(quantity)
    };

    // 1. Calculate rule-based quality score
    const qualityEval = QualityService.calculateQuality(sensorData, settings.thresholds);

    // 2. Query ML service prediction (mock / live)
    const mlPrediction = await MLService.predictPurity(sensorData);

    const ratePerLiter = QualityService.calculatePricing(sensorData.fat, qualityEval.score, settings.thresholds);
    const totalAmount = qualityEval.result !== 'REJECTED' ? Number((Number(quantity) * ratePerLiter).toFixed(2)) : 0;

    const testId = `TEST-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${Math.floor(100 + Math.random() * 900)}`;

    const newTest: IMilkTest = {
      testId,
      farmerId,
      farmerName: farmerName || (await dataRepository.getFarmerById(farmerId))?.name || 'Farmer',
      deviceId: sensorData.deviceId,
      quantity: Number(quantity),
      timestamp: new Date(),
      temperature: sensorData.temperature,
      ph: sensorData.ph,
      fat: sensorData.fat,
      density: sensorData.density,
      conductivity: sensorData.conductivity,
      milkLevel: sensorData.milkLevel,
      qualityScore: qualityEval.score,
      classification: qualityEval.classification,
      prediction: mlPrediction.prediction,
      confidence: mlPrediction.confidence,
      warnings: [...qualityEval.warnings, ...mlPrediction.warnings],
      result: qualityEval.result,
      ratePerLiter,
      totalAmount,
      notes
    };

    const savedTest = await dataRepository.addTest(newTest);

    // 3. Automatically record MilkCollection ledger entry if accepted
    if (savedTest.result !== 'REJECTED') {
      const newCollection: IMilkCollection = {
        collectionId: `COL-${testId.replace('TEST-', '')}`,
        farmerId: savedTest.farmerId,
        farmerName: savedTest.farmerName || 'Farmer',
        testId: savedTest.testId,
        quantity: savedTest.quantity,
        fat: savedTest.fat,
        rate: savedTest.ratePerLiter || ratePerLiter,
        totalAmount: savedTest.totalAmount || totalAmount,
        qualityScore: savedTest.qualityScore,
        result: savedTest.result,
        timestamp: savedTest.timestamp,
        paymentStatus: 'PAID'
      };
      await dataRepository.addCollection(newCollection);
    }

    // 4. Generate alert if abnormal or rejected
    if (savedTest.result === 'REJECTED' || savedTest.result === 'WARNING') {
      const alert: IAlert = {
        alertId: `ALT-${Date.now()}`,
        type: savedTest.conductivity > 6.0 ? 'HIGH_CONDUCTIVITY' : savedTest.ph < 6.5 ? 'ABNORMAL_PH' : 'SUSPICIOUS_MILK',
        severity: savedTest.result === 'REJECTED' ? 'CRITICAL' : 'WARNING',
        farmerId: savedTest.farmerId,
        farmerName: savedTest.farmerName,
        testId: savedTest.testId,
        deviceId: savedTest.deviceId,
        message: `Batch ${savedTest.testId} flagged: Score ${savedTest.qualityScore}% (${savedTest.result}). ${savedTest.warnings.join(', ')}`,
        status: 'ACTIVE',
        timestamp: new Date()
      };
      await dataRepository.addAlert(alert);
    }

    res.status(201).json({
      success: true,
      data: savedTest,
      qualityAssessment: qualityEval
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};
