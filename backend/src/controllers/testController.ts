import { Request, Response } from 'express';
import { dataRepository } from '../services/seedService';
import { QualityService } from '../services/qualityService';
import { MLService } from '../services/mlService';
import { CustomerCodeService } from '../services/customerCodeService';
import { ENV } from '../config/environment';
import { IMilkTest, IMilkCollection, IAlert } from '../types';

export const getTests = async (req: Request, res: Response): Promise<void> => {
  try {
    const { farmerId, customerCode, result, date, search } = req.query;
    let tests = await dataRepository.getTests();

    if (farmerId && typeof farmerId === 'string') {
      tests = tests.filter(t => t.farmerId === farmerId);
    }

    if (customerCode && typeof customerCode === 'string') {
      const formattedCode = customerCode.trim().toUpperCase();
      tests = tests.filter(t => t.customerCode === formattedCode);
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
          t.farmerId.toLowerCase().includes(q) ||
          (t.customerCode && t.customerCode.toLowerCase().includes(q))
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
      customerCode,
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

    let farmer = null;
    const trimmedFarmerId = typeof farmerId === 'string' ? farmerId.trim() : '';
    const formattedCode = typeof customerCode === 'string' ? customerCode.trim().toUpperCase() : '';

    if (formattedCode && !CustomerCodeService.isValidFormat(formattedCode)) {
      res.status(400).json({
        success: false,
        error: `Invalid Customer Code format "${customerCode}". Expected 1 uppercase letter followed by 4 digits (e.g. A1024).`
      });
      return;
    }

    if (trimmedFarmerId && formattedCode) {
      // Both provided: ensure they belong to the EXACT SAME farmer
      farmer = await dataRepository.getFarmerById(trimmedFarmerId);
      if (!farmer) {
        res.status(400).json({ success: false, error: `Farmer not found with ID: ${trimmedFarmerId}` });
        return;
      }
      if (farmer.customerCode && farmer.customerCode !== formattedCode) {
        res.status(400).json({
          success: false,
          error: `Security validation failed: Customer code "${formattedCode}" does not match farmerId "${trimmedFarmerId}" (expected "${farmer.customerCode}").`
        });
        return;
      }
    } else if (formattedCode) {
      farmer = await dataRepository.getFarmerByCustomerCode(formattedCode);
      if (!farmer) {
        res.status(404).json({ success: false, error: `Customer not found with code: ${formattedCode}` });
        return;
      }
    } else if (trimmedFarmerId) {
      farmer = await dataRepository.getFarmerById(trimmedFarmerId);
      if (!farmer) {
        res.status(400).json({ success: false, error: `Farmer not found with ID: ${trimmedFarmerId}` });
        return;
      }
    } else {
      res.status(400).json({ success: false, error: 'Missing farmerId or customerCode: at least one customer identifier is required' });
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

    const isDemo = ENV.DEMO_MODE === true;

    // In connected/API mode, missing sensor measurements are rejected
    if (!isDemo) {
      if (temperature === undefined || temperature === null) {
        res.status(400).json({ success: false, error: 'Missing required field in connected mode: temperature' });
        return;
      }
      if (density === undefined || density === null) {
        res.status(400).json({ success: false, error: 'Missing required field in connected mode: density' });
        return;
      }
      if (conductivity === undefined || conductivity === null) {
        res.status(400).json({ success: false, error: 'Missing required field in connected mode: conductivity' });
        return;
      }
      if (milkLevel === undefined || milkLevel === null) {
        res.status(400).json({ success: false, error: 'Missing required field in connected mode: milkLevel' });
        return;
      }
    }

    let tempNum = 24.0;
    if (temperature !== undefined && temperature !== null) {
      if (!isFiniteNumber(temperature)) {
        res.status(400).json({ success: false, error: 'Invalid temperature: must be a valid finite number' });
        return;
      }
      tempNum = Number(temperature);
      if (tempNum < -10 || tempNum > 100) {
        res.status(400).json({ success: false, error: 'Invalid temperature: must be between -10 and 100 °C' });
        return;
      }
    }

    let densityNum = 1.029;
    if (density !== undefined && density !== null) {
      if (!isFiniteNumber(density)) {
        res.status(400).json({ success: false, error: 'Invalid density: must be a valid finite number' });
        return;
      }
      densityNum = Number(density);
      if (densityNum < 0.5 || densityNum > 2.0) {
        res.status(400).json({ success: false, error: 'Invalid density: must be between 0.5 and 2.0 g/mL' });
        return;
      }
    }

    let condNum = 5.0;
    if (conductivity !== undefined && conductivity !== null) {
      if (!isFiniteNumber(conductivity)) {
        res.status(400).json({ success: false, error: 'Invalid conductivity: must be a valid finite number' });
        return;
      }
      condNum = Number(conductivity);
      if (condNum < 0 || condNum > 50) {
        res.status(400).json({ success: false, error: 'Invalid conductivity: must be between 0 and 50 mS/cm' });
        return;
      }
    }

    let levelNum = qtyNum;
    if (milkLevel !== undefined && milkLevel !== null) {
      if (!isFiniteNumber(milkLevel)) {
        res.status(400).json({ success: false, error: 'Invalid milkLevel: must be a valid finite number' });
        return;
      }
      levelNum = Number(milkLevel);
      if (levelNum < 0) {
        res.status(400).json({ success: false, error: 'Invalid milkLevel: cannot be negative' });
        return;
      }
    }

    // Validate operatorDecision
    if (operatorDecision !== undefined && operatorDecision !== null) {
      if (operatorDecision !== 'ACCEPT' && operatorDecision !== 'REJECT') {
        res.status(400).json({
          success: false,
          error: `Invalid operatorDecision "${operatorDecision}": must be "ACCEPT" or "REJECT"`
        });
        return;
      }
    }
    const decision: 'ACCEPT' | 'REJECT' = operatorDecision === 'REJECT' ? 'REJECT' : 'ACCEPT';

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

    // 1. Query quality and ML service evaluation
    const mlPrediction = await MLService.predictPurity(sensorData, settings.thresholds);
    const qualityEval = QualityService.calculateQuality(sensorData, settings.thresholds);

    // Single authoritative purity score (0-100, 1 decimal place)
    const authoritativePurityScore = Number(mlPrediction.purityScore.toFixed(1));
    const authoritativeAiRec: 'ACCEPT' | 'REVIEW' | 'REJECT' = mlPrediction.aiRecommendation;
    const recommendedResult: 'ACCEPTED' | 'WARNING' | 'REJECTED' =
      authoritativeAiRec === 'ACCEPT' ? 'ACCEPTED' : authoritativeAiRec === 'REVIEW' ? 'WARNING' : 'REJECTED';

    // 2. Enforce overrideReason if operator is accepting a rejected recommendation
    const trimmedOverrideReason = typeof overrideReason === 'string' ? overrideReason.trim() : '';
    if (authoritativeAiRec === 'REJECT' && decision === 'ACCEPT') {
      if (!trimmedOverrideReason) {
        res.status(400).json({
          success: false,
          error: 'Manual override requires a non-empty overrideReason when accepting a batch with AI recommendation REJECT'
        });
        return;
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
      // Operator decided to ACCEPT
      if (authoritativeAiRec === 'REJECT') {
        // Operator manually overrides a rejected recommendation
        finalResult = 'ACCEPTED';
        ratePerLiter = QualityService.calculatePricing(
          sensorData.fat,
          Math.max(settings.thresholds.scoreSuspiciousMin, authoritativePurityScore),
          settings.thresholds
        );
        totalAmount = Number((qtyNum * ratePerLiter).toFixed(2));
      } else if (authoritativeAiRec === 'REVIEW') {
        finalResult = 'WARNING';
        ratePerLiter = QualityService.calculatePricing(sensorData.fat, authoritativePurityScore, settings.thresholds);
        totalAmount = Number((qtyNum * ratePerLiter).toFixed(2));
      } else {
        finalResult = 'ACCEPTED';
        ratePerLiter = QualityService.calculatePricing(sensorData.fat, authoritativePurityScore, settings.thresholds);
        totalAmount = Number((qtyNum * ratePerLiter).toFixed(2));
      }
    }

    const uniqueToken = `${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;
    const datePart = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const testId = `TEST-${datePart}-${uniqueToken}`;

    const newTest: IMilkTest = {
      testId,
      farmerId: farmer.farmerId,
      customerCode: farmer.customerCode,
      farmerName: farmer.name || farmerName || 'Farmer',
      deviceId: sensorData.deviceId,
      quantity: qtyNum,
      timestamp: new Date(),
      temperature: sensorData.temperature,
      ph: sensorData.ph,
      fat: sensorData.fat,
      density: sensorData.density,
      conductivity: sensorData.conductivity,
      milkLevel: sensorData.milkLevel,
      qualityScore: authoritativePurityScore,
      purityScore: authoritativePurityScore,
      classification: qualityEval.classification,
      recommendedResult,
      aiRecommendation: authoritativeAiRec,
      operatorDecision: decision,
      overrideReason: trimmedOverrideReason || undefined,
      modelVersion: mlPrediction.modelVersion || 'screening-baseline-v1',
      scoreExplanation: mlPrediction.scoreExplanation.length > 0 ? mlPrediction.scoreExplanation : qualityEval.scoreExplanation,
      prediction: mlPrediction.prediction,
      confidence: null,
      warnings: Array.from(new Set([...qualityEval.warnings, ...mlPrediction.warnings])),
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
        collectionId: `COL-${uniqueToken}`,
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
      let alertType: 'HIGH_CONDUCTIVITY' | 'ABNORMAL_PH' | 'ABNORMAL_DENSITY' | 'SUSPICIOUS_MILK' = 'SUSPICIOUS_MILK';
      if (savedTest.conductivity > 6.0) {
        alertType = 'HIGH_CONDUCTIVITY';
      } else if (savedTest.ph < 6.5 || savedTest.ph > 6.85) {
        alertType = 'ABNORMAL_PH';
      } else if (savedTest.density < 1.026 || savedTest.density > 1.034) {
        alertType = 'ABNORMAL_DENSITY';
      }

      const warningText = savedTest.warnings.length > 0 ? ` (${savedTest.warnings.join('; ')})` : '';
      const alertMsg = savedTest.result === 'REJECTED'
        ? `Milk quality screening score (${savedTest.purityScore}%) below configured rejection threshold for batch ${savedTest.testId} (Farmer: ${savedTest.farmerName}). AI Recommendation: REJECT.${warningText} Secondary laboratory verification advised.`
        : `Milk quality screening score (${savedTest.purityScore}%) in review range for batch ${savedTest.testId} (Farmer: ${savedTest.farmerName}). AI Recommendation: REVIEW.${warningText} Monitored intake recorded.`;

      const alert: IAlert = {
        alertId: `ALT-${uniqueToken}`,
        type: alertType,
        severity: savedTest.result === 'REJECTED' ? 'CRITICAL' : 'WARNING',
        farmerId: savedTest.farmerId,
        farmerName: savedTest.farmerName,
        testId: savedTest.testId,
        deviceId: savedTest.deviceId,
        message: alertMsg,
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
