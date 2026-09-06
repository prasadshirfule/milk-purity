import { Request, Response } from 'express';
import { dataRepository } from '../services/seedService';
import { IMilkCollection } from '../types';

export const getCollections = async (req: Request, res: Response): Promise<void> => {
  try {
    const { farmerId, date, search } = req.query;
    let collections = await dataRepository.getCollections();

    if (farmerId && typeof farmerId === 'string') {
      collections = collections.filter(c => c.farmerId === farmerId);
    }

    if (search && typeof search === 'string') {
      const q = search.toLowerCase();
      collections = collections.filter(
        c =>
          c.collectionId.toLowerCase().includes(q) ||
          c.farmerName.toLowerCase().includes(q) ||
          c.testId.toLowerCase().includes(q)
      );
    }

    if (date && typeof date === 'string') {
      const targetDate = new Date(date).toDateString();
      collections = collections.filter(c => new Date(c.timestamp).toDateString() === targetDate);
    }

    // Summary calculation
    const totalVolume = collections.reduce((sum, c) => sum + c.quantity, 0);
    const totalAmount = collections.reduce((sum, c) => sum + c.totalAmount, 0);
    const avgFat = collections.length > 0
      ? Number((collections.reduce((sum, c) => sum + c.fat, 0) / collections.length).toFixed(2))
      : 0;

    res.json({
      success: true,
      count: collections.length,
      summary: {
        totalVolume: Number(totalVolume.toFixed(2)),
        totalAmount: Number(totalAmount.toFixed(2)),
        averageFat: avgFat
      },
      data: collections
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const createCollection = async (req: Request, res: Response): Promise<void> => {
  try {
    const { farmerId, farmerName, testId, quantity, fat, rate, totalAmount, qualityScore, result } = req.body;

    if (!farmerId || !quantity || !rate) {
      res.status(400).json({ success: false, error: 'farmerId, quantity and rate are required' });
      return;
    }

    const calculatedTotal = totalAmount || Number((Number(quantity) * Number(rate)).toFixed(2));
    const collectionId = `COL-${Date.now()}`;

    const newCollection: IMilkCollection = {
      collectionId,
      farmerId,
      farmerName: farmerName || (await dataRepository.getFarmerById(farmerId))?.name || 'Farmer',
      testId: testId || `MANUAL-${Date.now()}`,
      quantity: Number(quantity),
      fat: Number(fat || 4.2),
      rate: Number(rate),
      totalAmount: calculatedTotal,
      qualityScore: Number(qualityScore || 90),
      result: result || 'ACCEPTED',
      timestamp: new Date(),
      paymentStatus: 'PAID'
    };

    const created = await dataRepository.addCollection(newCollection);
    res.status(201).json({ success: true, data: created });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};
