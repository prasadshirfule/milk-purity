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
      operatorDecision, // 'ACCEPT' | 'REJECT'
      overrideReason,
      notes
    } = req.body;

    const isFiniteNumber = (val: any): boolean => {
      if (typeof val === 'number') {
        return Number.isFinite(val) && !isNaN(val);
      }
      if (typeof val === 'string') {
        const trimmed = val.trim();
        if (trimmed === '' || trimmed === 'Infinity' || trimmed === '-Infinity' || trimmed === 'NaN') return false;
        const num = Number(trimmed);
        return Number.isFinite(num) && !isNaN(num);
      }
      return false;
    };

    if (!farmerId || typeof farmerId !== 'string' || farmerId.trim() === '') {
      res.status(400).json({ success: false, error: 'Missing or invalid farmerId: must be a non-empty string' });
      return;
    }

    if (!isFiniteNumber(quantity) || Number(quantity) <= 0) {
      res.status(400).json({ success: false, error: 'Invalid milk quantity: must be a finite number greater than 0' });
      return;
    }
    const qtyNum = Number(quantity);

    if (!isFiniteNumber(ph) || Number(ph) < 0 || Number(ph) > 14) {
      res.status(400).json({ success: false, error: 'Invalid pH value: must be a finite number between 0 and 14' });
      return;
    }
    const phNum = Number(ph);

    if (!isFiniteNumber(fat) || Number(fat) < 0 || Number(fat) > 20) {
      res.status(400).json({ success: false, error: 'Invalid fat percentage: must be a finite number between 0 and 20' });
      return;
    }
    const fatNum = Number(fat);

    const tempNum = isFiniteNumber(temperature) ? Number(temperature) : 24.0;
    if (tempNum < -10 || tempNum > 100) {
      res.status(400).json({ success: false, error: 'Invalid temperature: must be between -10 and 100 °C' });
      return;
    }

    const densityNum = isFiniteNumber(density) ? Number(density) : 1.029;
    if (densityNum < 0.5 || densityNum > 2.0) {
      res.status(400).json({ success: false, error: 'Invalid density: must be between 0.5 and 2.0 g/mL' });
      return;
    }

    const condNum = isFiniteNumber(conductivity) ? Number(conductivity) : 5.0;
    if (condNum < 0 || condNum > 50) {
      res.status(400).json({ success: false, error: 'Invalid conductivity: must be between 0 and 50 mS/cm' });
      return;
    }

    const levelNum = isFiniteNumber(milkLevel) ? Math.max(0, Number(milkLevel)) : qtyNum;

    const settings = await dataRepository.getSettings();
    const sensorData = {
      deviceId: (deviceId && typeof deviceId === 'string') ? deviceId.trim() : 'ESP32-MILK-001',
      timestamp: new Date().toISOString(),
      temperature: tempNum,
      ph: phNum,
      fat: fatNum,
      density: densityNum,
      conductivity: condNum,
      milkLevel: levelNum
    };

    // 1. Calculate rule-based quality evaluation
    const qualityEval = QualityService.calculateQuality(sensorData, settings.thresholds);
    const recommendedResult = qualityEval.result; // 'ACCEPTED' | 'WARNING' | 'REJECTED'

    // 2. Query ML service prediction (mock / live)
    const mlPrediction = await MLService.predictPurity(sensorData);

    // 3. Determine operator decision & final result
    const decision: 'ACCEPT' | 'REJECT' = operatorDecision === 'REJECT' ? 'REJECT' : 'ACCEPT';

    let finalResult: 'ACCEPTED' | 'WARNING' | 'REJECTED' = 'REJECTED';
    let ratePerLiter = 0;
    let totalAmount = 0;

    if (decision === 'REJECT') {
      finalResult = 'REJECTED';
      ratePerLiter = 0;
      totalAmount = 0;
    } else {
      // Operator decided to ACCEPT
      if (recommendedResult === 'REJECTED') {
        // Operator manually overrides a rejected recommendation
        finalResult = 'ACCEPTED';
        ratePerLiter = QualityService.calculatePricing(sensorData.fat, qualityEval.score, settings.thresholds);
        totalAmount = Number((qtyNum * ratePerLiter).toFixed(2));
      } else if (recommendedResult === 'WARNING') {
        finalResult = 'WARNING';
        ratePerLiter = QualityService.calculatePricing(sensorData.fat, qualityEval.score, settings.thresholds);
        totalAmount = Number((qtyNum * ratePerLiter).toFixed(2));
      } else {
        finalResult = 'ACCEPTED';
        ratePerLiter = QualityService.calculatePricing(sensorData.fat, qualityEval.score, settings.thresholds);
        totalAmount = Number((qtyNum * ratePerLiter).toFixed(2));
      }
    }

    const testId = `TEST-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${Math.floor(100 + Math.random() * 900)}`;

    const newTest: IMilkTest = {
      testId,
      farmerId: farmerId.trim(),
      farmerName: farmerName || (await dataRepository.getFarmerById(farmerId.trim()))?.name || 'Farmer',
      deviceId: sensorData.deviceId,
      quantity: qtyNum,
      timestamp: new Date(),
      temperature: sensorData.temperature,
      ph: sensorData.ph,
      fat: sensorData.fat,
      density: sensorData.density,
      conductivity: sensorData.conductivity,
      milkLevel: sensorData.milkLevel,
      qualityScore: qualityEval.score,
      classification: qualityEval.classification,
      recommendedResult,
      operatorDecision: decision,
      overrideReason: overrideReason || undefined,
      prediction: mlPrediction.prediction,
      confidence: mlPrediction.confidence,
      warnings: [...qualityEval.warnings, ...mlPrediction.warnings],
      result: finalResult,
      ratePerLiter,
      totalAmount,
      notes: notes || undefined
    };

    const savedTest = await dataRepository.addTest(newTest);

    // 4. Automatically record MilkCollection ledger entry ONLY if final result is NOT rejected
    let createdCollection: IMilkCollection | undefined;
    if (savedTest.result !== 'REJECTED') {
      createdCollection = {
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
      await dataRepository.addCollection(createdCollection);
    }

    // 5. Generate alert if anomalous or rejected
    if (savedTest.result === 'REJECTED' || savedTest.result === 'WARNING' || decision === 'REJECT') {
      const alert: IAlert = {
        alertId: `ALT-${Date.now()}`,
        type: savedTest.conductivity > 6.0 ? 'HIGH_CONDUCTIVITY' : savedTest.ph < 6.5 ? 'ABNORMAL_PH' : 'SUSPICIOUS_MILK',
        severity: savedTest.result === 'REJECTED' ? 'CRITICAL' : 'WARNING',
        farmerId: savedTest.farmerId,
        farmerName: savedTest.farmerName,
        testId: savedTest.testId,
        deviceId: savedTest.deviceId,
        message: `Batch ${savedTest.testId} outcome: ${savedTest.result} (Operator: ${decision}). Score ${savedTest.qualityScore}%. ${savedTest.warnings.join(', ')}`,
        status: 'ACTIVE',
        timestamp: new Date()
      };
      await dataRepository.addAlert(alert);
    }

    res.status(201).json({
      success: true,
      data: savedTest,
      collection: createdCollection,
      qualityAssessment: qualityEval
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};
